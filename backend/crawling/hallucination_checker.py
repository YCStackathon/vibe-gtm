import json

from dotenv import load_dotenv
from firecrawl import Firecrawl
from openai import OpenAI

from schemas import Claim, ClaimVerified, PersonClaims, PersonClaimsVerified, VerificationAnalysis

load_dotenv()


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
            model="gpt-4o-mini",
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
    firecrawl = Firecrawl()
    openai_client = OpenAI()

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


def main():
    input_file = "person_claims.json"
    output_file = "person_claims_verified.json"

    # Load claims from JSON file
    with open(input_file) as f:
        data = json.load(f)

    person_claims = PersonClaims.model_validate(data)

    result = check_hallucinations(person_claims)

    # Save verified results to JSON
    with open(output_file, "w") as f:
        f.write(result.model_dump_json(indent=2))

    print(f"\nResults saved to {output_file}")

    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)

    verified = sum(1 for c in result.claims if c.is_supported)
    print(f"Verified: {verified}/{len(result.claims)}")

    print("\nDetailed Results:")
    for c in result.claims:
        status = "✓ VERIFIED" if c.is_supported else "✗ NOT VERIFIED"
        print(f"\n{status}")
        print(f"  Type: {c.type}")
        print(f"  Claim: {c.one_liner[:100]}")
        print(f"  URL: {c.url}")
        print(f"  Reasoning: {c.reasoning}")


if __name__ == "__main__":
    main()
