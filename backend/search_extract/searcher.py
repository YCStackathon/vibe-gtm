from dotenv import load_dotenv
from firecrawl import Firecrawl

from search_extract.schemas import SearchResult

load_dotenv()


def search(query: str, limit: int = 10) -> list[SearchResult]:
    """Run a search query and return list of results."""
    firecrawl = Firecrawl()

    response = firecrawl.search(query, limit=limit)

    results = []
    for item in response.web or []:
        results.append(SearchResult(
            url=item.url,
            title=item.title,
            description=item.description,
        ))

    return results
