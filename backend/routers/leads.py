import logging

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from config import settings
from schemas.leads import ParsedQueries, ParseLeadsRequest, ParseLeadsResponse

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
