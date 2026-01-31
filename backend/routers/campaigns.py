from fastapi import APIRouter, HTTPException

from database import get_database
from schemas.campaign import (
    CampaignCreate,
    CampaignFull,
    CampaignListItem,
    CampaignProfileUpdate,
)
from services.campaign import (
    create_campaign,
    get_campaign,
    list_campaigns,
    update_campaign_profile,
)

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignListItem])
async def list_campaigns_endpoint():
    db = get_database()
    return await list_campaigns(db)


@router.post("", response_model=CampaignListItem, status_code=201)
async def create_campaign_endpoint(data: CampaignCreate):
    db = get_database()
    return await create_campaign(db, data)


@router.get("/{campaign_id}", response_model=CampaignFull)
async def get_campaign_endpoint(campaign_id: str):
    db = get_database()
    campaign = await get_campaign(db, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.patch("/{campaign_id}/profile", status_code=204)
async def update_campaign_profile_endpoint(
    campaign_id: str, data: CampaignProfileUpdate
):
    db = get_database()
    success = await update_campaign_profile(db, campaign_id, data.profile)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign not found")
