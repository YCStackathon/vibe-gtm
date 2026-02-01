import logging
from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from crawling.schemas import ClaimVerified
from database import get_database
from proposal.generator import SCORE_LABELS, generate_proposal
from schemas.proposal import (
    GenerateProposalRequest,
    Proposal,
    ProposalListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


@router.get("/{campaign_id}", response_model=ProposalListResponse)
async def list_proposals(campaign_id: str):
    """Get all proposals for a campaign, sorted by score descending."""
    db = get_database()

    cursor = db.proposals.find({"campaign_id": campaign_id}).sort("score", -1)
    proposals = []
    async for doc in cursor:
        proposals.append(
            Proposal(
                id=str(doc["_id"]),
                campaign_id=doc["campaign_id"],
                lead_id=doc["lead_id"],
                lead_name=doc["lead_name"],
                score=doc["score"],
                score_label=doc["score_label"],
                reason=doc["reason"],
                matches=doc.get("matches", []),
                created_at=doc["created_at"],
            )
        )

    return ProposalListResponse(proposals=proposals)


@router.post("/generate", response_model=Proposal)
async def generate_proposal_endpoint(request: GenerateProposalRequest):
    """Generate a proposal for a specific lead."""
    db = get_database()

    # Get campaign with founder claims
    campaign = await db.campaigns.find_one({"_id": ObjectId(request.campaign_id)})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get founder's verified claims from whoami extraction
    whoami_id = campaign.get("whoami_extraction_id")
    if not whoami_id:
        raise HTTPException(status_code=400, detail="No founder identity extracted yet")

    whoami_doc = await db.verified_claims.find_one({"_id": ObjectId(whoami_id)})
    if not whoami_doc:
        raise HTTPException(status_code=404, detail="Founder claims not found")

    founder_name = campaign.get("profile", {}).get("name", "Founder")
    founder_claims = []
    for person in whoami_doc.get("verified_persons", []):
        founder_claims.extend([ClaimVerified(**c) for c in person.get("claims", [])])

    # Get lead's verified claims
    lead = None
    for l in campaign.get("leads", []):
        if l.get("id") == request.lead_id:
            lead = l
            break

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    verified_id = lead.get("verified_claims_id")
    if not verified_id:
        raise HTTPException(status_code=400, detail="Lead has no verified claims")

    lead_doc = await db.verified_claims.find_one({"_id": ObjectId(verified_id)})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead claims not found")

    # Extract lead name and claims
    lead_persons = lead_doc.get("verified_persons", [])
    lead_name = (
        lead_persons[0].get("person_name", "Unknown") if lead_persons else "Unknown"
    )
    lead_claims = []
    for person in lead_persons:
        lead_claims.extend([ClaimVerified(**c) for c in person.get("claims", [])])

    # Generate proposal
    result = generate_proposal(founder_name, founder_claims, lead_name, lead_claims)

    # Save to database
    proposal_doc = {
        "campaign_id": request.campaign_id,
        "lead_id": request.lead_id,
        "lead_name": lead_name,
        "score": result.score,
        "score_label": SCORE_LABELS[result.score],
        "reason": result.reason,
        "matches": [m.model_dump() for m in result.matches],
        "created_at": datetime.now(UTC),
    }

    insert_result = await db.proposals.insert_one(proposal_doc)

    return Proposal(
        id=str(insert_result.inserted_id),
        campaign_id=proposal_doc["campaign_id"],
        lead_id=proposal_doc["lead_id"],
        lead_name=proposal_doc["lead_name"],
        score=proposal_doc["score"],
        score_label=proposal_doc["score_label"],
        reason=proposal_doc["reason"],
        matches=proposal_doc["matches"],
        created_at=proposal_doc["created_at"],
    )
