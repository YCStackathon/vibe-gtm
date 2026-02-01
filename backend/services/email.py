import logging
import re

import httpx

from config import settings

logger = logging.getLogger(__name__)


def extract_campaign_id(email_address: str) -> str | None:
    """Extract campaign ID from email address like leads-abc123@xxx.resend.app."""
    match = re.match(r"leads-([a-f0-9]+)@", email_address.lower())
    if match:
        return match.group(1)
    return None


async def get_received_email_content(email_id: str) -> str | None:
    """Fetch received email content from Resend Receiving API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.resend.com/emails/receiving/{email_id}",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
            response.raise_for_status()
            email = response.json()
            return email.get("text") or email.get("html", "")
    except Exception as e:
        logger.exception(f"Failed to fetch email {email_id}: {e}")
        return None
