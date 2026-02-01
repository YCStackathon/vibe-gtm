from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProposalMatch(BaseModel):
    founder_claim: str = Field(..., description="Founder's relevant claim")
    lead_claim: str = Field(..., description="Lead's matching claim")
    source_url: str = Field(..., description="URL where the lead's claim was found")
    source_readable: str = Field(
        ..., description="Human-readable source name (e.g., LinkedIn, Medium)"
    )


class ProposalAIOutput(BaseModel):
    """OpenAI structured output schema for proposal generation."""

    score: int = Field(..., ge=0, le=3, description="Match score: 0=None, 1=Low, 2=Medium, 3=Perfect")
    reason: str = Field(
        ...,
        description="Conversational explanation for why reaching out makes sense",
    )
    matches: list[ProposalMatch] = Field(
        default_factory=list, description="Specific claim matches found"
    )


class Proposal(BaseModel):
    id: str
    campaign_id: str
    lead_id: str
    lead_name: str
    score: int
    score_label: Literal["none", "low", "medium", "perfect"]
    reason: str
    matches: list[ProposalMatch] = Field(default_factory=list)
    created_at: datetime


class GenerateProposalRequest(BaseModel):
    campaign_id: str
    lead_id: str


class ProposalListResponse(BaseModel):
    proposals: list[Proposal]
