from datetime import datetime

from crawling.schemas import Claim
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    name: str
    claims: list[Claim] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProposalMatch(BaseModel):
    user_claim: str = Field(..., description="User's claim one-liner")
    target_claim: str = Field(..., description="Target's matching claim one-liner")
    match_reason: str = Field(..., description="Why these claims match")


class ProposalResult(BaseModel):
    target_person_name: str
    matches: list[ProposalMatch] = Field(default_factory=list)
    icebreaker_suggestions: list[str] = Field(
        default_factory=list, description="2-3 conversation starters based on matches"
    )


class CreateUserProfileRequest(BaseModel):
    name: str
    claims: list[Claim]


class MatchRequest(BaseModel):
    user_id: str
    target_person_id: str


class UserProfileResponse(BaseModel):
    id: str
    name: str
    claims: list[Claim]
    created_at: datetime
