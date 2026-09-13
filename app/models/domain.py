from datetime import UTC, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EventType(str, Enum):
    BREAKING = "breaking"
    EARNINGS = "earnings"
    GUIDANCE = "guidance"
    MA = "m_and_a"
    PRODUCT = "product"
    PARTNERSHIP = "partnership"
    REGULATORY = "regulatory"
    LITIGATION = "litigation"
    EXECUTIVE = "executive"
    RUMOR = "rumor"
    GENERAL = "general"


class SourceReliability(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ConfirmationStatus(str, Enum):
    DETECTED = "detected"
    CORROBORATED = "corroborated"
    CONFIRMED = "confirmed"


class Entity(BaseModel):
    name: str
    type: str = Field(description="company, ticker, person, sector")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    ticker: str | None = None
    cik: str | None = None


class Citation(BaseModel):
    source_index: int
    source_name: str
    source_url: str | None = None
    published_at: datetime | None = None
    relevant_snippet: str
    content_hash: str


class ImpactTag(BaseModel):
    category: str = Field(description="e.g. Revenue, Margin, Valuation, Regulatory, Supply Chain")
    sentiment: str = Field(description="positive, negative, neutral")
    note: str | None = None


class EnrichmentResult(BaseModel):
    summary: str
    why_it_matters: str
    impact_tags: list[ImpactTag] = Field(default_factory=list)
    importance_score: float = Field(ge=0.0, le=1.0)


class InvestmentEvent(BaseModel):
    id: str = Field(description="Deterministic or UUID string")
    source: str = Field(description="Source identifier, e.g., 'sec_edgar'")
    source_id: str | None = None
    url: str | None = None
    content_hash: str = Field(description="SHA-256 of normalized title + body")

    published_at: datetime | None = None
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    processed_at: datetime | None = None

    title: str
    body: str
    summary: str | None = None
    why_it_matters: str | None = None
    impact_tags: list[ImpactTag] = Field(default_factory=list)
    event_type: EventType = EventType.GENERAL

    entities: list[Entity] = Field(default_factory=list)
    importance_score: float | None = Field(default=None, ge=0.0, le=1.0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reliability: SourceReliability = SourceReliability.MEDIUM
    status: ConfirmationStatus = ConfirmationStatus.DETECTED

    raw_payload: dict[str, Any] | None = None


class DeduplicationResult(BaseModel):
    is_duplicate: bool
    duplicate_type: str | None = None  # "exact", "near_simhash", "cluster_existing"
    matched_event_id: str | None = None
    similarity_score: float | None = None
    event: InvestmentEvent


class IngestResponse(BaseModel):
    status: str
    event_id: str
    content_hash: str
    deduplication: DeduplicationResult
    entity_count: int
