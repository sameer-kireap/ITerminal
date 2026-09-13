from typing import Any

from pydantic import BaseModel

from app.models.domain import InvestmentEvent, SourceReliability
from app.processing.normalizer import normalize_event


class WebhookPayload(BaseModel):
    source: str
    title: str
    body: str
    url: str | None = None
    source_id: str | None = None
    published_at: str | None = None
    reliability: SourceReliability = SourceReliability.MEDIUM
    metadata: dict[str, Any] | None = None


def process_webhook_payload(payload: WebhookPayload) -> InvestmentEvent:
    return normalize_event(
        source=payload.source,
        title=payload.title,
        body=payload.body,
        url=payload.url,
        source_id=payload.source_id,
        published_at=payload.published_at,
        reliability=payload.reliability,
        raw_payload=payload.metadata,
    )
