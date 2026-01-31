import asyncio
from collections.abc import Callable
from datetime import UTC, datetime

from firecrawl import Firecrawl
from motor.motor_asyncio import AsyncIOMotorDatabase
from openai import OpenAI

from config import settings
from crawling.schemas import (
    Claim,
    ClaimVerified,
    PersonClaims,
    PersonClaimsVerified,
    VerificationAnalysis,
)
from search_extract.schemas import CollectedPage, ExtractedPage, SearchResult
from services.extraction_task import LogType

MAX_CONTENT_LENGTH = 15000


LogCallback = Callable[[str, LogType, int | None], None]


def _noop_log(message: str, log_type: LogType = LogType.INFO, progress: int | None = None):
    print(f"[{log_type.value}] {message}")


async def run_extraction_pipeline(
    db: AsyncIOMotorDatabase,
    query: str,
    campaign_id: str,
    log: LogCallback = _noop_log,
    limit: int = 10,
) -> str:
    """
    Full extraction pipeline: search -> collect -> extract -> verify -> save.
    Returns the verified_claims document ID.
    """
    firecrawl = Firecrawl(api_key=settings.firecrawl_api_key)
    openai_client = OpenAI(api_key=settings.openai_api_key)

    # Step 1: Search
    log(f"Searching for: {query}", LogType.INFO)
    results = await asyncio.to_thread(_search, firecrawl, query, limit)
    log(f"Found {len(results)} results", LogType.SUCCESS)

    if not results:
        raise ValueError("No search results found")

    # Step 2: Collect pages
    log("Collecting pages...", LogType.INFO)
    pages = []
    for i, result in enumerate(results, 1):
        progress = int((i / len(results)) * 33)
        log(f"Scraping page {i}/{len(results)}: {result.url[:50]}...", LogType.PROGRESS, progress)
        page = await asyncio.to_thread(_scrape_page, firecrawl, result)
        if page:
            pages.append(page)

    log(f"Collected {len(pages)} pages", LogType.SUCCESS)

    if not pages:
        raise ValueError("Failed to collect any pages")

    # Step 3: Extract claims from pages
    log("Extracting claims...", LogType.INFO)
    extracted = []
    for i, page in enumerate(pages, 1):
        progress = 33 + int((i / len(pages)) * 33)
        log(f"Extracting from page {i}/{len(pages)}", LogType.PROGRESS, progress)
        result = await asyncio.to_thread(_extract_from_page, openai_client, page, query)
        extracted.append(result)

    # Save raw extraction
    extraction_doc = {
        "query": query,
        "campaign_id": campaign_id,
        "created_at": datetime.now(UTC),
        "pages": [page.model_dump() for page in extracted],
    }
    extraction_result = await db.extractions.insert_one(extraction_doc)
    extraction_id = str(extraction_result.inserted_id)
    log(f"Saved raw extraction: {extraction_id}", LogType.SUCCESS)

    # Step 4: Verify claims
    log("Verifying claims...", LogType.INFO)
    all_verified: list[dict] = []

    for page in extracted:
        data = page.data
        if not data or page.error:
            continue

        person_name = data.get("person_name", "Unknown")
        claims_data = data.get("claims", [])

        if not claims_data:
            continue

        verified_claims = []
        for i, claim_data in enumerate(claims_data, 1):
            progress = 66 + int((i / len(claims_data)) * 33)
            claim = Claim(**claim_data)
            log(f"Verifying claim {i}/{len(claims_data)}: {claim.one_liner[:40]}...", LogType.PROGRESS, progress)

            verified = await asyncio.to_thread(_verify_claim, firecrawl, openai_client, claim)
            verified_claims.append(verified)

            status = "✓" if verified.is_supported else "✗"
            log_type = LogType.SUCCESS if verified.is_supported else LogType.ERROR
            log(f"{status} {verified.reasoning[:60]}", log_type)

        person_verified = PersonClaimsVerified(person_name=person_name, claims=verified_claims)
        all_verified.append(person_verified.model_dump())

    # Save verified claims
    verified_doc = {
        "query": query,
        "campaign_id": campaign_id,
        "source_extraction_id": extraction_id,
        "verified_persons": all_verified,
        "created_at": datetime.now(UTC),
    }
    verified_result = await db.verified_claims.insert_one(verified_doc)
    verified_id = str(verified_result.inserted_id)

    # Summary
    total_claims = sum(len(p.get("claims", [])) for p in all_verified)
    verified_count = sum(
        sum(1 for c in p.get("claims", []) if c.get("is_supported"))
        for p in all_verified
    )
    log(f"Verification complete: {verified_count}/{total_claims} claims verified", LogType.SUCCESS, 100)

    return verified_id


def _search(firecrawl: Firecrawl, query: str, limit: int) -> list[SearchResult]:
    response = firecrawl.search(query, limit=limit)
    results = []
    for item in response.web or []:
        results.append(SearchResult(
            url=item.url,
            title=item.title,
            description=item.description,
        ))
    return results


def _scrape_page(firecrawl: Firecrawl, result: SearchResult) -> CollectedPage | None:
    try:
        response = firecrawl.scrape(result.url, formats=["markdown"])
        markdown = response.markdown or ""
        return CollectedPage(url=result.url, markdown=markdown, title=result.title)
    except Exception as e:
        print(f"Failed to scrape {result.url}: {e}")
        return None


def _extract_from_page(openai_client: OpenAI, page: CollectedPage, query: str) -> ExtractedPage:
    prompt = """
Return ONLY JSON matching this schema:
- person_name: the person's full name
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
    try:
        content = page.markdown[:MAX_CONTENT_LENGTH]
        response = openai_client.beta.chat.completions.parse(
            model="gpt-5-nano",
            messages=[
                {
                    "role": "system",
                    "content": f"{prompt}\n\nExtract information about the person from: {query}",
                },
                {
                    "role": "user",
                    "content": f"URL: {page.url}\n\nContent:\n{content}",
                },
            ],
            response_format=PersonClaims,
        )
        parsed = response.choices[0].message.parsed
        return ExtractedPage(
            url=page.url,
            data=parsed.model_dump() if parsed else None,
        )
    except Exception as e:
        return ExtractedPage(url=page.url, data=None, error=str(e))


def _verify_claim(firecrawl: Firecrawl, openai_client: OpenAI, claim: Claim) -> ClaimVerified:
    try:
        response = firecrawl.scrape(str(claim.url), formats=["markdown"])
        content = response.markdown
    except Exception as e:
        return ClaimVerified(
            **claim.model_dump(mode="python"),
            is_supported=False,
            reasoning=f"Could not access source: {e}",
        )

    if not content:
        return ClaimVerified(
            **claim.model_dump(mode="python"),
            is_supported=False,
            reasoning="Empty content from source",
        )

    try:
        response = openai_client.responses.parse(
            model="gpt-5-nano",
            instructions="You are a fact-checker. Determine if the claim is supported by the source content. Be strict - the claim must be directly or clearly supported by the text.",
            input=f"""
CLAIM: {claim.one_liner}

SOURCE CONTENT:
{content[:15000]}

Analyze if the claim is directly supported, partially supported, or not found in the source content.
""",
            text_format=VerificationAnalysis,
        )
        verification = response.output_parsed
        return ClaimVerified(
            **claim.model_dump(mode="python"),
            is_supported=verification.is_supported,
            reasoning=verification.reasoning,
        )
    except Exception as e:
        return ClaimVerified(
            **claim.model_dump(mode="python"),
            is_supported=False,
            reasoning=f"Verification failed: {e}",
        )
