from firecrawl import Firecrawl
from dotenv import load_dotenv

from backend.search_extract.schemas import SearchResult, CollectedPage

load_dotenv()


def collect_pages(results: list[SearchResult]) -> list[CollectedPage]:
    """Scrape each URL and return markdown content."""
    firecrawl = Firecrawl()

    pages = []
    for result in results:
        try:
            response = firecrawl.scrape(result.url, formats=["markdown"])
            markdown = response.markdown or ""

            pages.append(CollectedPage(
                url=result.url,
                markdown=markdown,
                title=result.title,
            ))
            print(f"Collected: {result.url}")
        except Exception as e:
            print(f"Failed to collect {result.url}: {e}")
            continue

    return pages
