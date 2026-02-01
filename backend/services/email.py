import logging
import re

import resend

from config import settings

logger = logging.getLogger(__name__)


def init_resend():
    """Initialize Resend API client."""
    resend.api_key = settings.resend_api_key


def extract_campaign_id(email_address: str) -> str | None:
    """Extract campaign ID from email address like leads-abc123@xxx.resend.app."""
    match = re.match(r"leads-([a-f0-9]+)@", email_address.lower())
    if match:
        return match.group(1)
    return None


async def get_received_email_content(email_id: str) -> str | None:
    """Fetch received email content from Resend API."""
    try:
        init_resend()
        email = resend.Emails.get(email_id)
        return email.get("text") or email.get("html", "")
    except Exception as e:
        logger.exception(f"Failed to fetch email {email_id}: {e}")
        return None
