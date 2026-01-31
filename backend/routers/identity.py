import logging

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from database import get_database
from schemas.profile import ProfileExtractionResponse
from search_extract.pipeline_async import run_extraction_pipeline
from services import campaign as campaign_service
from services.extraction_task import (
    LogType,
    add_log,
    complete_task,
    create_log_callback,
    create_task,
    fail_task,
    set_task_running,
)
from services.reducto import extract_profile_from_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/identity", tags=["identity"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def run_extraction_background(task_id: str, campaign_id: str, query: str):
    """Background task to run the extraction pipeline."""
    db = get_database()
    log = create_log_callback(task_id)
    set_task_running(task_id)

    try:
        verified_id = await run_extraction_pipeline(
            db=db,
            query=query,
            campaign_id=campaign_id,
            log=log,
            limit=5,
        )

        # Update campaign with extraction ID
        await campaign_service.update_campaign_extraction_id(
            db, campaign_id, verified_id
        )
        await add_log(task_id, "Campaign updated", LogType.SUCCESS)
        await complete_task(task_id, verified_id)

    except Exception as e:
        logger.exception(f"Extraction pipeline failed for task {task_id}")
        await fail_task(task_id, str(e))


@router.post("/extract", response_model=ProfileExtractionResponse)
async def extract_profile(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    campaign_id: str = Form(...),
):
    """Extract profile from PDF and start whoami extraction."""
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File exceeds 10MB limit",
        )

    db = get_database()

    # Verify campaign exists
    campaign = await campaign_service.get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    try:
        logger.info(f"Extracting profile from {file.filename}")
        profile = await extract_profile_from_pdf(content)
        logger.info(f"Successfully extracted profile: {profile.name}")

        # Save profile to campaign immediately
        await campaign_service.update_campaign_profile(db, campaign_id, profile)

        # Build query for whoami extraction
        query_parts = [profile.name]
        if profile.current_job_title:
            query_parts.append(profile.current_job_title)
        query = " ".join(query_parts)

        # Create extraction task and start background processing
        task = create_task(campaign_id, query)
        background_tasks.add_task(
            run_extraction_background, task.id, campaign_id, query
        )

        return ProfileExtractionResponse(
            profile=profile,
            extraction_task_id=task.id,
        )

    except Exception as e:
        logger.exception(f"Failed to extract profile from {file.filename}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract profile: {e!s}",
        )
