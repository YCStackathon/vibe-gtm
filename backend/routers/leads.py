import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException
from openai import OpenAI

from config import settings
from database import get_database
from schemas.leads import (
    ExtractLeadRequest,
    ExtractLeadResponse,
    LeadStatus,
    ParsedQueries,
    ParseLeadsRequest,
    ParseLeadsResponse,
)
from search_extract.pipeline_async import run_extraction_pipeline
from services import campaign as campaign_service
from services.extraction_task import (
    LogType,
    add_log,
    complete_task,
    create_task_for_lead,
    fail_task,
    set_task_running,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["leads"])


def parse_leads_with_openai(raw_text: str) -> list[str]:
    """Use OpenAI to parse raw lead text into clean search queries."""
    client = OpenAI(api_key=settings.openai_api_key)

    prompt = """You are an expert at parsing lead lists.
Extract individual leads from the input text.

The user may paste leads in any format:
- Bullet points (-, *, •)
- Numbered lists (1., 2.)
- CSV format (comma or semicolon separated)
- Plain text with line breaks
- Mixed formats

For each lead, create a clean search query with the person's name
and their company/role if available. Remove formatting artifacts
(bullets, numbers, special characters). Output each as a clean string.

Examples:
Input: "- Joshua Alphonse - Mux Community Engineer"
Output: ["Joshua Alphonse Mux Community Engineer"]

Input: "John Smith, CEO, Acme Corp"
Output: ["John Smith CEO Acme Corp"]

Input: "1. Jane Doe (Product Manager at TechCo)"
Output: ["Jane Doe Product Manager TechCo"]"""

    response = client.beta.chat.completions.parse(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": raw_text},
        ],
        response_format=ParsedQueries,
    )

    result = response.choices[0].message.parsed
    return result.queries if result else []


@router.post("/parse", response_model=ParseLeadsResponse)
async def parse_leads(request: ParseLeadsRequest) -> ParseLeadsResponse:
    """Parse raw lead text into clean search queries using OpenAI."""
    if not request.raw_text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        logger.info(f"Parsing leads from {len(request.raw_text)} characters of text")
        queries = parse_leads_with_openai(request.raw_text)
        logger.info(f"Parsed {len(queries)} lead queries")
        return ParseLeadsResponse(queries=queries)
    except Exception as e:
        logger.exception("Failed to parse leads")
        raise HTTPException(status_code=500, detail=f"Failed to parse leads: {e!s}")


async def run_lead_extraction_background(
    task_id: str,
    campaign_id: str,
    lead_id: str,
    query: str,
    lead_index: int,
):
    """Background task to run lead extraction pipeline with prefixed logging."""
    import asyncio

    db = get_database()
    prefix = f"[Lead {str(lead_index + 1).zfill(2)}]"

    def prefixed_log(
        message: str, log_type: LogType = LogType.INFO, progress: int | None = None
    ):
        asyncio.create_task(add_log(task_id, f"{prefix} {message}", log_type, progress))

    set_task_running(task_id)

    try:
        verified_id = await run_extraction_pipeline(
            db=db,
            query=query,
            campaign_id=campaign_id,
            log=prefixed_log,
            limit=5,
        )

        # Update lead status in campaign
        await campaign_service.update_lead_status(
            db,
            campaign_id,
            lead_id,
            status=LeadStatus.COMPLETED,
            verified_claims_id=verified_id,
        )

        await add_log(task_id, f"{prefix} Extraction complete", LogType.SUCCESS)
        await complete_task(task_id, verified_id)

    except Exception as e:
        logger.exception(f"Lead extraction failed for task {task_id}")
        await campaign_service.update_lead_status(
            db,
            campaign_id,
            lead_id,
            status=LeadStatus.ERROR,
            error=str(e),
        )
        await fail_task(task_id, str(e))


@router.post("/extract", response_model=ExtractLeadResponse)
async def extract_lead(
    background_tasks: BackgroundTasks,
    request: ExtractLeadRequest,
):
    """Start extraction for a single lead."""
    db = get_database()

    # Verify campaign exists
    campaign = await campaign_service.get_campaign(db, request.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Create task for this lead
    task = create_task_for_lead(
        campaign_id=request.campaign_id,
        query=request.query,
        lead_id=request.lead_id,
        lead_index=request.lead_index,
    )

    # Update lead status to processing
    await campaign_service.update_lead_status(
        db,
        request.campaign_id,
        request.lead_id,
        status=LeadStatus.PROCESSING,
        extraction_task_id=task.id,
    )

    # Start background extraction
    background_tasks.add_task(
        run_lead_extraction_background,
        task.id,
        request.campaign_id,
        request.lead_id,
        request.query,
        request.lead_index,
    )

    return ExtractLeadResponse(extraction_task_id=task.id)
