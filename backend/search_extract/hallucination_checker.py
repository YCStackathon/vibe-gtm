import asyncio
from datetime import UTC, datetime

from backend.config import settings
from backend.crawling.schemas import (
    Claim,
    ClaimVerified,
    PersonClaims,
    PersonClaimsVerified,
    VerificationAnalysis,
)
from bson import ObjectId
from firecrawl import Firecrawl
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI


def scrape_url(firecrawl: Firecrawl, url: str) -> str | None:
    """Scrape URL and return markdown content."""
    try:
        result = firecrawl.scrape(str(url))
        return result.markdown
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None


def verify_claim(firecrawl: Firecrawl, openai_client: OpenAI, claim: Claim) -> ClaimVerified:
    """Verify if a claim is supported by the cited source."""
    content = scrape_url(firecrawl, str(claim.url))

    if content is None:
        return ClaimVerified(
            **claim.model_dump(mode="python"),
            is_supported=False,
            reasoning="Could not access the source URL",
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


def check_hallucinations(person_claims: PersonClaims) -> PersonClaimsVerified:
    """Check all claims for hallucinations."""
    firecrawl = Firecrawl(api_key=settings.firecrawl_api_key)
    openai_client = OpenAI(api_key=settings.openai_api_key)

    verified_claims = []

    print(f"Found {len(person_claims.claims)} claims to verify\n")

    for i, claim in enumerate(person_claims.claims, 1):
        print(f"[{i}/{len(person_claims.claims)}] Verifying: {claim.one_liner[:60]}...")
        verified = verify_claim(firecrawl, openai_client, claim)
        verified_claims.append(verified)
        status = "✓" if verified.is_supported else "✗"
        print(f"  {status} {verified.reasoning[:80]}\n")

    return PersonClaimsVerified(
        person_name=person_claims.person_name,
        claims=verified_claims,
    )


async def load_extraction(doc_id: str) -> dict | None:
    """Load an extraction document from the database."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]
    doc = await db.extractions.find_one({"_id": ObjectId(doc_id)})
    client.close()
    return doc


async def save_verified(doc_id: str, verified_data: dict) -> str:
    """Save verified claims to the database."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.database_name]

    verified_data["source_extraction_id"] = doc_id
    verified_data["created_at"] = datetime.now(UTC)
    result = await db.verified_claims.insert_one(verified_data)
    client.close()
    return str(result.inserted_id)


def run_from_db(doc_id: str) -> str:
    """Load extraction from DB, verify claims, save results. Returns verified doc ID."""
    extraction = asyncio.run(load_extraction(doc_id))
    if not extraction:
        raise ValueError(f"Extraction {doc_id} not found")

    print(f"Loaded extraction: {extraction['query']}")

    all_verified: list[dict] = []
    for page in extraction.get("pages", []):
        data = page.get("data")
        if not data or page.get("error"):
            continue

        person_name = data.get("person_name", "Unknown")
        claims_data = data.get("claims", [])

        if not claims_data:
            continue

        person_claims = PersonClaims(person_name=person_name, claims=claims_data)
        result = check_hallucinations(person_claims)
        all_verified.append(result.model_dump())

    verified_doc = {
        "query": extraction["query"],
        "verified_persons": all_verified,
    }
    verified_id = asyncio.run(save_verified(doc_id, verified_doc))

    # Print summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    for person in all_verified:
        verified_count = sum(1 for c in person["claims"] if c["is_supported"])
        print(f"{person['person_name']}: {verified_count}/{len(person['claims'])} verified")

    print(f"\nSaved to database with ID: {verified_id}")
    return verified_id


if __name__ == "__main__":
    run_from_db("697e7d87e243a89d85cf8253")
