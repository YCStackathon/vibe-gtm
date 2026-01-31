import json
from firecrawl import FirecrawlApp
from schemas import PersonClaims
from dotenv import load_dotenv

load_dotenv()

def crawl_person(query: str):
    """Extract personal information about a person using Firecrawl agent."""
    app = FirecrawlApp()


    prompt = f"""prompt =
Extract as many connection-relevant claims as possible about {query}.

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

    result = app.agent(
        schema=PersonClaims,
        prompt=prompt,
        model="spark-1-pro",
    )

    return result


def main():
    query = "Jakub Sobolewski AI engineer"
    output_file = "person_claims.json"

    result = crawl_person(query)

    # Save to JSON
    with open(output_file, "w") as f:
        json.dump(result.data, f, indent=2)

    print(f"Results saved to {output_file}")
    print(result)


if __name__ == "__main__":
    main()
