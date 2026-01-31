from typing import Any, Optional
from pydantic import BaseModel, HttpUrl


class SearchResult(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None


class CollectedPage(BaseModel):
    url: str
    markdown: str
    title: Optional[str] = None


class ExtractedPage(BaseModel):
    url: str
    data: Any
    error: Optional[str] = None
