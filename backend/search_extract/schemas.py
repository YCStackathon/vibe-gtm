from typing import Any

from pydantic import BaseModel


class SearchResult(BaseModel):
    url: str
    title: str | None = None
    description: str | None = None


class CollectedPage(BaseModel):
    url: str
    markdown: str
    title: str | None = None


class ExtractedPage(BaseModel):
    url: str
    data: Any
    error: str | None = None
