from datetime import UTC, datetime

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from schemas.campaign import (
    CampaignCreate,
    CampaignFull,
    CampaignListItem,
)
from schemas.profile import FounderProfile

COLLECTION = "campaigns"


async def list_campaigns(db: AsyncIOMotorDatabase) -> list[CampaignListItem]:
    cursor = db[COLLECTION].find().sort("updated_at", -1)
    campaigns = []
    async for doc in cursor:
        campaigns.append(
            CampaignListItem(
                id=str(doc["_id"]),
                name=doc["name"],
                created_at=doc["created_at"],
                updated_at=doc["updated_at"],
            )
        )
    return campaigns


async def create_campaign(
    db: AsyncIOMotorDatabase, data: CampaignCreate
) -> CampaignListItem:
    now = datetime.now(UTC)
    doc = {
        "name": data.name,
        "created_at": now,
        "updated_at": now,
        "profile": None,
    }
    result = await db[COLLECTION].insert_one(doc)
    return CampaignListItem(
        id=str(result.inserted_id),
        name=data.name,
        created_at=now,
        updated_at=now,
    )


async def get_campaign(
    db: AsyncIOMotorDatabase, campaign_id: str
) -> CampaignFull | None:
    try:
        doc = await db[COLLECTION].find_one({"_id": ObjectId(campaign_id)})
    except Exception:
        return None

    if not doc:
        return None

    profile = None
    if doc.get("profile"):
        profile = FounderProfile(**doc["profile"])

    return CampaignFull(
        id=str(doc["_id"]),
        name=doc["name"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        profile=profile,
        whoami_extraction_id=doc.get("whoami_extraction_id"),
        leads=doc.get("leads", []),
    )


async def update_campaign_profile(
    db: AsyncIOMotorDatabase, campaign_id: str, profile: FounderProfile
) -> bool:
    try:
        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id)},
            {
                "$set": {
                    "profile": profile.model_dump(),
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def update_campaign_extraction_id(
    db: AsyncIOMotorDatabase, campaign_id: str, extraction_id: str
) -> bool:
    try:
        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id)},
            {
                "$set": {
                    "whoami_extraction_id": extraction_id,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def update_campaign_leads(
    db: AsyncIOMotorDatabase, campaign_id: str, leads: list[str]
) -> bool:
    try:
        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id)},
            {
                "$set": {
                    "leads": leads,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False
