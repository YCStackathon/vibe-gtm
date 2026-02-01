from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from schemas.leads import Lead
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
    whoami_extraction_id: str | None = None
    leads: list[Lead] = []


class CampaignProfileUpdate(BaseModel):
    profile: FounderProfile


class CampaignLeadsUpdate(BaseModel):
    leads: list[Any]  # Accept both Lead objects and legacy string format
