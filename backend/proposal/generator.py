import logging

from openai import OpenAI

from config import settings
from crawling.schemas import ClaimVerified
from schemas.proposal import ProposalAIOutput

logger = logging.getLogger(__name__)

SCORE_LABELS = {0: "none", 1: "low", 2: "medium", 3: "perfect"}


def format_claims_for_matching(claims: list[ClaimVerified]) -> str:
    """Format verified claims for the matching prompt, including source URLs."""
    lines = []
    for c in claims:
        if c.is_supported:
            lines.append(f"- [{c.type}] {c.one_liner} (source: {c.url})")
    return "\n".join(lines) if lines else "(no verified claims)"


def generate_proposal(
    founder_name: str,
    founder_claims: list[ClaimVerified],
    lead_name: str,
    lead_claims: list[ClaimVerified],
) -> ProposalAIOutput:
    """Generate a scored proposal matching founder and lead claims."""
    client = OpenAI(api_key=settings.openai_api_key)

    prompt = """You are an expert at finding meaningful connections for personalized outreach.

Analyze the founder's and lead's verified claims to find connection points that could spark genuine conversations.

Score the match quality:
- 3 (Perfect): Multiple strong shared interests, same school/company, direct overlap that makes outreach feel natural
- 2 (Medium): Some shared interests or experiences worth mentioning, decent conversation starters
- 1 (Low): Weak or tangential connections only, might feel forced
- 0 (None): No meaningful connection found

For each match you find:
- Include both the founder's claim and the lead's matching claim
- Include the source URL where you found the lead's claim
- Provide a readable source name (e.g., "LinkedIn", "Medium", "Twitter", "Company Blog")

Write a conversational "reason" that could be used as an email opener. Focus on the human connection, not just listing facts. Example:
"You both ride Harleys and have done cross-country trips - there's a shared sense of adventure there that makes for a natural conversation starter."

If no matches are found, set score to 0 and provide a brief reason explaining there were no overlapping interests."""

    founder_claims_text = format_claims_for_matching(founder_claims)
    lead_claims_text = format_claims_for_matching(lead_claims)

    user_content = f"""FOUNDER ({founder_name}):
{founder_claims_text}

LEAD ({lead_name}):
{lead_claims_text}"""

    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_content},
            ],
            response_format=ProposalAIOutput,
        )

        result = response.choices[0].message.parsed
        if result:
            return result
    except Exception as e:
        logger.exception(f"Failed to generate proposal: {e}")

    return ProposalAIOutput(
        score=0,
        reason="Unable to generate proposal due to an error.",
        matches=[],
    )
