from enum import Enum

from pydantic import BaseModel


class LeadStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"


class Lead(BaseModel):
    id: str
    query: str
    extraction_task_id: str | None = None
    verified_claims_id: str | None = None
    status: LeadStatus = LeadStatus.PENDING
    error: str | None = None


class ParseLeadsRequest(BaseModel):
    raw_text: str


class ParseLeadsResponse(BaseModel):
    queries: list[str]


class ParsedQueries(BaseModel):
    """Schema for OpenAI structured output."""

    queries: list[str]


class ExtractLeadRequest(BaseModel):
    campaign_id: str
    lead_id: str
    query: str
    lead_index: int


class ExtractLeadResponse(BaseModel):
    extraction_task_id: str
