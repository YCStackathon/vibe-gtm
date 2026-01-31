from typing import Literal

from pydantic import BaseModel, Field


class Claim(BaseModel):
    type: Literal[
        "interest",
        "hobby",
        "passion",
        "community",
        "culture",
        "media",
        "sports_team",
        "prior_employer",
        "education",
        "location",
        "language",
        "other",
    ] = Field(..., description="Category of the extracted claim")

    one_liner: str = Field(
        ...,
        description="Single-sentence statement about the person (standalone claim)",
        max_length=300,
    )

    url: str = Field(
        ...,
        description="Direct URL to the source supporting this claim"
    )

    notes: str | None = Field(
        None,
        description="Optional extra context for internal use (not user-facing)"
    )

class VerificationAnalysis(BaseModel):
    is_supported: bool
    reasoning: str

class ClaimVerified(Claim, VerificationAnalysis):
    pass

class PersonClaims(BaseModel):
    person_name: str
    claims: list[Claim] = Field(
        default_factory=list,
        description="List of extracted connection-relevant claims"
    )

class PersonClaimsVerified(PersonClaims):
    claims: list[ClaimVerified]