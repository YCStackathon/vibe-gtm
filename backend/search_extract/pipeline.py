from typing import Type
from pydantic import BaseModel

from backend.crawling.schemas import PersonClaims
from backend.search_extract.searcher import search
from backend.search_extract.collector import collect_pages
from backend.search_extract.extractor import extract_from_pages
from backend.search_extract.schemas import ExtractedPage


def run_pipeline(
    query: str,
    schema: Type[BaseModel],
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

    run_pipeline("Jakub Sobolewski AI Engineer",PersonClaims, prompt)