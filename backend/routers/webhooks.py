import logging

from fastapi import APIRouter, Request

from database import get_database
from routers.leads import parse_leads_with_openai
from services.campaign import append_leads_to_campaign
from services.email import extract_campaign_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/resend")
async def handle_resend_webhook(request: Request):
    """Handle incoming email webhook from Resend."""
    payload = await request.json()
    logger.info(f"Received Resend webhook: {payload}")

    event_type = payload.get("type")
    if event_type != "email.received":
        logger.info(f"Ignoring Resend event: {event_type}")
        return {"status": "ignored", "reason": f"event type {event_type} not handled"}

    data = payload.get("data", {})
    to_addresses = data.get("to", [])

    if not to_addresses:
        logger.warning("Resend webhook missing to addresses")
        return {"status": "error", "reason": "missing to addresses"}

    to_address = to_addresses[0]
    campaign_id = extract_campaign_id(to_address)

    if not campaign_id:
        logger.warning(f"Could not extract campaign ID from: {to_address}")
        return {"status": "error", "reason": "invalid email address format"}

    # Email content is in the webhook payload for inbound emails
    email_content = data.get("text") or data.get("html", "")
    if not email_content:
        logger.error("No email content in webhook payload")
        return {"status": "error", "reason": "no email content"}

    try:
        leads = parse_leads_with_openai(email_content)
        logger.info(f"Parsed {len(leads)} leads from email for campaign {campaign_id}")
    except Exception as e:
        logger.exception(f"Failed to parse leads: {e}")
        return {"status": "error", "reason": "failed to parse leads"}

    db = get_database()
    success = await append_leads_to_campaign(db, campaign_id, leads)

    if not success:
        logger.error(f"Failed to add leads to campaign {campaign_id}")
        return {"status": "error", "reason": "campaign not found"}

    logger.info(f"Added {len(leads)} leads to campaign {campaign_id}")
    return {"status": "processed", "leads_added": len(leads)}
