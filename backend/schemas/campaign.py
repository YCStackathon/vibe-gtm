from datetime import datetime

from pydantic import BaseModel, Field

from schemas.profile import FounderProfile


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CampaignListItem(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime


class CampaignFull(CampaignListItem):
    profile: FounderProfile | None = None


class CampaignProfileUpdate(BaseModel):
    profile: FounderProfile
