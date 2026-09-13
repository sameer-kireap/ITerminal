from typing import Any

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.api.deps import get_event_service
from app.ingestion.webhook import WebhookPayload, process_webhook_payload
from app.models.domain import EventType, IngestResponse, SourceReliability
from app.processing.normalizer import normalize_event
from app.services.event_service import EventService

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


class RawIngestRequest(BaseModel):
    source: str
    title: str
    body: str
    url: str | None = None
    source_id: str | None = None
    published_at: str | None = None
    event_type: EventType | None = None
    reliability: SourceReliability = SourceReliability.MEDIUM
    metadata: dict[str, Any] | None = None


@router.post("/event", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_event_endpoint(
    req: RawIngestRequest,
    event_service: EventService = Depends(get_event_service),
) -> IngestResponse:
    event = normalize_event(
        source=req.source,
        title=req.title,
        body=req.body,
        url=req.url,
        source_id=req.source_id,
        published_at=req.published_at,
        event_type=req.event_type,
        reliability=req.reliability,
        raw_payload=req.metadata,
    )

    processed_event, dedup_res = await event_service.ingest_event(event)

    return IngestResponse(
        status="duplicate" if dedup_res.is_duplicate else "accepted",
        event_id=processed_event.id,
        content_hash=processed_event.content_hash,
        deduplication=dedup_res,
        entity_count=len(processed_event.entities),
    )


@router.post("/webhook", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_webhook_endpoint(
    payload: WebhookPayload,
    event_service: EventService = Depends(get_event_service),
) -> IngestResponse:
    event = process_webhook_payload(payload)
    processed_event, dedup_res = await event_service.ingest_event(event)

    return IngestResponse(
        status="duplicate" if dedup_res.is_duplicate else "accepted",
        event_id=processed_event.id,
        content_hash=processed_event.content_hash,
        deduplication=dedup_res,
        entity_count=len(processed_event.entities),
    )


@router.post(
    "/simulate/{scenario}", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED
)
async def simulate_scenario_endpoint(
    scenario: str,
    event_service: EventService = Depends(get_event_service),
) -> IngestResponse:
    scenarios = {
        "nvda-beat": {
            "source": "sec_edgar",
            "title": "NVIDIA CORP - Form 8-K (Item 2.02 Results of Operations)",
            "body": "NVIDIA reported record Q4 revenue of $22.1 billion, up 265% from a year ago. Data Center revenue was $18.4 billion, up 409%. GAAP diluted EPS was $4.93, up 765% year-over-year. Fiscal 2025 Q1 revenue guidance is expected to be $24.0 billion.",
            "url": "https://www.sec.gov/Archives/edgar/data/1045810/000104581024000029/nvda-20240221.htm",
            "source_id": "sec-nvda-8k-20240221",
            "reliability": SourceReliability.HIGH,
        },
        "reuters-syndicate": {
            "source": "reuters",
            "title": "Nvidia crushes quarterly estimates on soaring AI chip demand",
            "body": "NVIDIA reported record Q4 revenue of $22.1 billion, up 265% from a year ago. Data Center revenue was $18.4 billion, up 409%. GAAP diluted EPS was $4.93, up 765% year-over-year. Fiscal 2025 Q1 revenue guidance is expected to be $24.0 billion.",
            "url": "https://www.reuters.com/technology/nvidia-forecasts-q1-revenue-above-estimates-2024-02-21/",
            "source_id": "reuters-nvda-q4-2024",
            "reliability": SourceReliability.MEDIUM,
        },
        "apple-ai-partnership": {
            "source": "bloomberg",
            "title": "Apple in talks to let Google Gemini power iPhone AI features",
            "body": "Apple Inc is in active negotiations to build Google's Gemini AI engine into the iPhone, according to people familiar with the matter. The partnership would provide Gemini a market of over 2 billion active Apple devices.",
            "url": "https://www.bloomberg.com/news/articles/2024-03-18/apple-in-talks-to-license-google-gemini-for-iphone-ai-features",
            "source_id": "bloomberg-aapl-googl-2024",
            "reliability": SourceReliability.MEDIUM,
        },
        "tesla-fcf": {
            "source": "sec_edgar",
            "title": "Tesla Inc - Form 10-Q Quarterly Report for Period Ended June 30",
            "body": "Tesla Inc reported automotive gross margin excluding regulatory credits of 14.6%. Free cash flow reached $1.34 billion, supported by vehicle deliveries of 443,956. Energy storage deployments reached a record 9.4 GWh.",
            "url": "https://www.sec.gov/Archives/edgar/data/1318605/000162828024032804/tsla-20240630.htm",
            "source_id": "sec-tsla-10q-20240630",
            "reliability": SourceReliability.HIGH,
        },
    }

    selected = scenarios.get(scenario, scenarios["nvda-beat"])
    event = normalize_event(
        source=selected["source"],
        title=selected["title"],
        body=selected["body"],
        url=selected["url"],
        source_id=selected["source_id"],
        reliability=selected["reliability"],
    )

    processed_event, dedup_res = await event_service.ingest_event(event)

    return IngestResponse(
        status="duplicate" if dedup_res.is_duplicate else "accepted",
        event_id=processed_event.id,
        content_hash=processed_event.content_hash,
        deduplication=dedup_res,
        entity_count=len(processed_event.entities),
    )
