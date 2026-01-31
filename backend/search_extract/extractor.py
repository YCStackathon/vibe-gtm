
from search_extract.schemas import CollectedPage, ExtractedPage
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

MAX_CONTENT_LENGTH = 15000


def extract_from_pages(
    pages: list[CollectedPage],
    schema: type[BaseModel],
    prompt: str,
) -> list[ExtractedPage]:
    """Run LLM extraction on each page using the provided schema."""
    client = OpenAI()

    extracted = []
    for page in pages:
        try:
            content = page.markdown[:MAX_CONTENT_LENGTH]

            response = client.beta.chat.completions.parse(
                model="gpt-5-nano",
                messages=[
                    {
                        "role": "system",
                        "content": f"{prompt}\n\nExtract information from the following content.",
                    },
                    {
                        "role": "user",
                        "content": f"URL: {page.url}\n\nContent:\n{content}",
                    },
                ],
                response_format=schema,
            )

            parsed = response.choices[0].message.parsed

            extracted.append(ExtractedPage(
                url=page.url,
                data=parsed.model_dump() if parsed else None,
            ))
            print(f"Extracted: {page.url}")
        except Exception as e:
            print(f"Failed to extract from {page.url}: {e}")
            extracted.append(ExtractedPage(
                url=page.url,
                data=None,
                error=str(e),
            ))

    return extracted
