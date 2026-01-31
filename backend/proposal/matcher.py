from crawling.schemas import Claim
from openai import OpenAI

from config import settings
from .schemas import ProposalResult


def format_claims(claims: list[Claim]) -> str:
    lines = []
    for c in claims:
        lines.append(f"- [{c.type}] {c.one_liner}")
    return "\n".join(lines) if lines else "(no claims)"


def find_matches(
    user_name: str,
    user_claims: list[Claim],
    target_person_name: str,
    target_claims: list[Claim],
) -> ProposalResult:
    client = OpenAI(api_key=settings.openai_api_key)

    prompt = """You are an expert at finding meaningful connections between people.

Analyze the claims of two people and find matches for personalized outreach.
Look for:
- Shared interests (tennis, reading, etc.)
- Common experiences (same school, company, location)
- Similar passions or hobbies
- Cultural or community overlaps

For each match found, explain why it's relevant for building a connection.
Also suggest 2-3 icebreaker conversation starters based on the matches."""

    user_content = f"""USER ({user_name}) CLAIMS:
{format_claims(user_claims)}

TARGET ({target_person_name}) CLAIMS:
{format_claims(target_claims)}"""

    response = client.beta.chat.completions.parse(
        model="gpt-5-nano",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": user_content},
        ],
        response_format=ProposalResult,
    )

    result = response.choices[0].message.parsed
    if result:
        result.target_person_name = target_person_name
    return result or ProposalResult(target_person_name=target_person_name)
