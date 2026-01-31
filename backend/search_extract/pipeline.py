import asyncio
from datetime import UTC, datetime

from backend.config import settings
from backend.crawling.schemas import PersonClaims
from backend.search_extract.collector import collect_pages
from backend.search_extract.extractor import extract_from_pages
from backend.search_extract.hallucination_checker import (
    run_from_db as check_hallucinations,
)
from backend.search_extract.schemas import ExtractedPage
from backend.search_extract.searcher import search
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel


def run_pipeline(
    query: str,
    schema: type[BaseModel],
    prompt: str,
    limit: int = 10,
) -> list[ExtractedPage]:
    """
    Full workflow: search -> collect -> extract.

    Args:
        query: Search query string
        schema: Pydantic model for extraction
        prompt: Instructions for the LLM extractor
        limit: Max number of search results

    Returns:
        List of extracted pages with structured data
    """
    print(f"Searching for: {query}")
    results = search(query, limit=limit)
    print(f"Found {len(results)} results")

    print("Collecting pages...")
    pages = collect_pages(results)
    print(f"Collected {len(pages)} pages")

    print("Extracting data...")
    extracted = extract_from_pages(pages, schema, prompt)
    print(f"Extracted from {len(extracted)} pages")

    return extracted


async def save_to_db(query: str, extracted: list[ExtractedPage]) -> str:
    """Save extracted pages to MongoDB."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    doc = {
        "query": query,
        "created_at": datetime.now(UTC),
        "pages": [page.model_dump() for page in extracted],
    }
    result = await db.extractions.insert_one(doc)
    client.close()
    return str(result.inserted_id)


def run_pipeline_and_save(
    query: str,
    schema: type[BaseModel],
    prompt: str,
    limit: int = 10,
    verify: bool = True,
) -> str:
    """Run pipeline, save results, and optionally verify claims. Returns verified doc ID."""
    extracted = run_pipeline(query, schema, prompt, limit)
    doc_id = asyncio.run(save_to_db(query, extracted))
    print(f"Saved to database with ID: {doc_id}")

    if verify:
        print("\nVerifying claims...")
        verified_id = check_hallucinations(doc_id)
        return verified_id

    return doc_id


if __name__ == "__main__":
    prompt= """
Return ONLY JSON matching this schema:
- subject.name
- claims: list of objects with:
  - type (interest, hobby, passion, community, culture, media, sports_team,
          prior_employer, education, location, language, other)
  - one_liner (single short sentence)
  - url (direct supporting link)
  - notes (optional)

Rules:
- High volume is preferred: include hobbies, interests, side projects, tools, communities,
  favorite media, sports, background, and any unique personal details.
- Every claim MUST include a URL. If no URL exists, skip it.
- Avoid sensitive topics (politics, religion, health, family).
- Output only the JSON object, nothing else.
    """

    doc_id = run_pipeline_and_save("Jakub Sobolewski AI Engineer", PersonClaims, prompt, limit=1)