from pydantic import BaseModel


class ParseLeadsRequest(BaseModel):
    raw_text: str


class ParseLeadsResponse(BaseModel):
    queries: list[str]


class ParsedQueries(BaseModel):
    """Schema for OpenAI structured output."""

    queries: list[str]
