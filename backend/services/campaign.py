import uuid
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from config import settings
from schemas.campaign import (
    CampaignCreate,
    CampaignFull,
    CampaignListItem,
)
from schemas.leads import Lead, LeadStatus
from schemas.profile import FounderProfile

COLLECTION = "campaigns"


def generate_receiving_email(campaign_id: str) -> str | None:
    """Generate the receiving email address for a campaign."""
    if not settings.resend_receiving_domain:
        return None
    return f"leads-{campaign_id}@{settings.resend_receiving_domain}"


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


def _parse_leads(raw_leads: list[Any]) -> list[Lead]:
    """Parse leads from database format (handles old string and new object format)."""
    leads = []
    for item in raw_leads:
        if isinstance(item, str):
            # Legacy string format - skip (shouldn't exist after migration)
            continue
        elif isinstance(item, dict):
            leads.append(Lead(**item))
    return leads


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

    campaign_id = str(doc["_id"])
    leads = _parse_leads(doc.get("leads", []))

    return CampaignFull(
        id=campaign_id,
        name=doc["name"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        profile=profile,
        whoami_extraction_id=doc.get("whoami_extraction_id"),
        leads=leads,
        receiving_email=generate_receiving_email(campaign_id),
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
    db: AsyncIOMotorDatabase, campaign_id: str, leads: list[Any]
) -> bool:
    """Update campaign leads. Accepts Lead objects or dicts."""
    try:
        # Convert Lead objects to dicts for storage
        leads_data = []
        for lead in leads:
            if hasattr(lead, "model_dump"):
                leads_data.append(lead.model_dump())
            elif isinstance(lead, dict):
                leads_data.append(lead)
            # Skip any other types

        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id)},
            {
                "$set": {
                    "leads": leads_data,
                    "updated_at": datetime.now(UTC),
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def append_leads_to_campaign(
    db: AsyncIOMotorDatabase, campaign_id: str, new_leads: list[str]
) -> bool:
    """Append new leads to existing campaign leads."""
    try:
        # Convert string queries to Lead objects
        lead_dicts = [
            {
                "id": str(uuid.uuid4()),
                "query": query,
                "status": LeadStatus.PENDING.value,
                "extraction_task_id": None,
                "verified_claims_id": None,
                "error": None,
            }
            for query in new_leads
        ]
        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id)},
            {
                "$push": {"leads": {"$each": lead_dicts}},
                "$set": {"updated_at": datetime.now(UTC)},
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def update_lead_status(
    db: AsyncIOMotorDatabase,
    campaign_id: str,
    lead_id: str,
    status: LeadStatus,
    extraction_task_id: str | None = None,
    verified_claims_id: str | None = None,
    error: str | None = None,
) -> bool:
    """Update a specific lead's status within a campaign."""
    try:
        update_fields: dict[str, Any] = {
            "leads.$.status": status.value,
            "updated_at": datetime.now(UTC),
        }
        if extraction_task_id is not None:
            update_fields["leads.$.extraction_task_id"] = extraction_task_id
        if verified_claims_id is not None:
            update_fields["leads.$.verified_claims_id"] = verified_claims_id
        if error is not None:
            update_fields["leads.$.error"] = error

        result = await db[COLLECTION].update_one(
            {"_id": ObjectId(campaign_id), "leads.id": lead_id},
            {"$set": update_fields},
        )
        return result.matched_count > 0
    except Exception:
        return False
