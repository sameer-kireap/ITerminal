import re
from typing import Any

import feedparser
import httpx

from app.core.config import get_settings
from app.ingestion.base import BaseConnector
from app.models.domain import EventType, InvestmentEvent, SourceReliability
from app.processing.normalizer import normalize_event

settings = get_settings()

SEC_FORM_TO_EVENT = {
    "8-K": EventType.BREAKING,
    "10-Q": EventType.EARNINGS,
    "10-K": EventType.EARNINGS,
    "4": EventType.EXECUTIVE,
    "SC 13D": EventType.MA,
}


class EdgarConnector(BaseConnector):
    DEFAULT_FEED_URL = "https://www.sec.gov/Archives/edgar/usgaap.rss.xml"

    def __init__(
        self,
        feed_url: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__(source_name="sec_edgar", rate_limit_per_min=600)
        self.feed_url = feed_url or self.DEFAULT_FEED_URL
        self._client = client
        self.headers = {
            "User-Agent": settings.SEC_USER_AGENT,
            "Accept-Encoding": "gzip, deflate",
            "Host": "www.sec.gov",
        }

    async def poll(self) -> list[dict[str, Any]]:
        client = self._client or httpx.AsyncClient(timeout=15.0, headers=self.headers)
        try:
            response = await client.get(self.feed_url)
            response.raise_for_status()
            parsed = feedparser.parse(response.text)
            return [dict(entry) for entry in parsed.entries]
        except Exception:
            return []
        finally:
            if not self._client:
                await client.aclose()

    def normalize(self, raw_item: dict[str, Any]) -> InvestmentEvent:
        title = raw_item.get("title", "SEC Filing")
        summary = raw_item.get("summary", "") or raw_item.get("description", "")
        link = raw_item.get("link")
        published_at = raw_item.get("published") or raw_item.get("updated")
        source_id = raw_item.get("id") or link

        # Extract Form type (e.g. 8-K, 10-Q) from title or summary
        event_type = EventType.REGULATORY
        form_match = re.search(r"\b(8-K|10-Q|10-K|SC 13D|Form 4)\b", title, re.IGNORECASE)
        if form_match:
            detected_form = form_match.group(1).upper()
            event_type = SEC_FORM_TO_EVENT.get(detected_form, EventType.REGULATORY)

        return normalize_event(
            source=self.source_name,
            title=title,
            body=summary,
            url=link,
            source_id=source_id,
            published_at=published_at,
            event_type=event_type,
            raw_payload=raw_item,
            reliability=SourceReliability.HIGH,
        )
