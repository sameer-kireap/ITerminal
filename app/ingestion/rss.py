from typing import Any

import feedparser
import httpx

from app.ingestion.base import BaseConnector
from app.models.domain import InvestmentEvent, SourceReliability
from app.processing.normalizer import normalize_event


class RSSConnector(BaseConnector):
    def __init__(
        self,
        feed_url: str,
        source_name: str = "wire_rss",
        rate_limit_per_min: int = 60,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        super().__init__(source_name=source_name, rate_limit_per_min=rate_limit_per_min)
        self.feed_url = feed_url
        self._client = client
        self.etag: str | None = None
        self.last_modified: str | None = None

    async def poll(self) -> list[dict[str, Any]]:
        client = self._client or httpx.AsyncClient(timeout=15.0)
        headers = {}
        if self.etag:
            headers["If-None-Match"] = self.etag
        if self.last_modified:
            headers["If-Modified-Since"] = self.last_modified

        try:
            response = await client.get(self.feed_url, headers=headers)
            if response.status_code == 304:
                return []
            response.raise_for_status()

            self.etag = response.headers.get("etag")
            self.last_modified = response.headers.get("last-modified")

            parsed = feedparser.parse(response.text)
            return [dict(entry) for entry in parsed.entries]
        except Exception:
            return []
        finally:
            if not self._client:
                await client.aclose()

    def normalize(self, raw_item: dict[str, Any]) -> InvestmentEvent:
        title = raw_item.get("title", "")
        summary = raw_item.get("summary", "") or raw_item.get("description", "")
        link = raw_item.get("link")
        source_id = raw_item.get("id") or link
        published_at = raw_item.get("published") or raw_item.get("updated")

        return normalize_event(
            source=self.source_name,
            title=title,
            body=summary,
            url=link,
            source_id=source_id,
            published_at=published_at,
            raw_payload=raw_item,
            reliability=SourceReliability.MEDIUM,
        )
