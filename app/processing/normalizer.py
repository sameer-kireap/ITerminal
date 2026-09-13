import re
import uuid
from datetime import UTC, datetime
from typing import Any

from dateutil import parser as date_parser

from app.models.domain import (
    ConfirmationStatus,
    Entity,
    EventType,
    InvestmentEvent,
    SourceReliability,
)
from app.processing.deduplicator import compute_content_hash

KNOWN_ENTITIES = {
    "NVDA": {
        "name": "NVIDIA Corp",
        "ticker": "NVDA",
        "cik": "0001045810",
        "aliases": ["nvidia", "nvda", "nvidia corp"],
    },
    "AAPL": {
        "name": "Apple Inc",
        "ticker": "AAPL",
        "cik": "0000320193",
        "aliases": ["apple", "aapl", "apple inc", "apple computer"],
    },
    "MSFT": {
        "name": "Microsoft Corp",
        "ticker": "MSFT",
        "cik": "0000789019",
        "aliases": ["microsoft", "msft", "microsoft corp"],
    },
    "TSLA": {
        "name": "Tesla Inc",
        "ticker": "TSLA",
        "cik": "0001318605",
        "aliases": ["tesla", "tsla", "tesla motors"],
    },
    "GOOGL": {
        "name": "Alphabet Inc",
        "ticker": "GOOGL",
        "cik": "0001652044",
        "aliases": ["google", "alphabet", "googl", "goog"],
    },
    "AMZN": {
        "name": "Amazon.com Inc",
        "ticker": "AMZN",
        "cik": "0001018724",
        "aliases": ["amazon", "amzn", "amazon.com"],
    },
    "META": {
        "name": "Meta Platforms Inc",
        "ticker": "META",
        "cik": "0001326801",
        "aliases": ["meta", "facebook", "meta platforms", "fb"],
    },
    "AMD": {
        "name": "Advanced Micro Devices Inc",
        "ticker": "AMD",
        "cik": "0000002488",
        "aliases": ["amd", "advanced micro devices"],
    },
    "INTC": {
        "name": "Intel Corp",
        "ticker": "INTC",
        "cik": "0000050863",
        "aliases": ["intel", "intc", "intel corp"],
    },
    "TSM": {
        "name": "Taiwan Semiconductor Manufacturing",
        "ticker": "TSM",
        "cik": "0001046179",
        "aliases": ["tsmc", "tsm", "taiwan semi"],
    },
}

ALIAS_TO_TICKER = {
    alias.lower(): ticker for ticker, data in KNOWN_ENTITIES.items() for alias in data["aliases"]
}

EVENT_PATTERNS = [
    (
        EventType.EARNINGS,
        re.compile(
            r"\b(q[1-4]\s+(results|earnings|net income)|reports\s+q[1-4]|item\s+2\.02|eps\s+of|revenue\s+of|quarterly\s+results)\b",
            re.IGNORECASE,
        ),
    ),
    (
        EventType.GUIDANCE,
        re.compile(
            r"\b(guidance|forecasts|raises\s+outlook|lowers\s+outlook|fiscal\s+year\s+outlook)\b",
            re.IGNORECASE,
        ),
    ),
    (
        EventType.MA,
        re.compile(
            r"\b(acquire|acquires|acquisition|acquiring|merger|to\s+buy|takeover|merging\s+with)\b",
            re.IGNORECASE,
        ),
    ),
    (
        EventType.PARTNERSHIP,
        re.compile(
            r"\b(partners\s+with|partnership|teams\s+up|collaboration|agreement\s+with)\b",
            re.IGNORECASE,
        ),
    ),
    (
        EventType.EXECUTIVE,
        re.compile(
            r"\b(appoints|steps\s+down|resigns|named\s+ceo|cfo|chief\s+executive)\b", re.IGNORECASE
        ),
    ),
    (
        EventType.REGULATORY,
        re.compile(r"\b(sec|investigation|regulatory|doj|ftc|antitrust|subpoena)\b", re.IGNORECASE),
    ),
    (
        EventType.LITIGATION,
        re.compile(
            r"\b(lawsuit|sues|sued|patent\s+infringement|court|injunction)\b", re.IGNORECASE
        ),
    ),
    (
        EventType.PRODUCT,
        re.compile(r"\b(launches|unveils|announces\s+new|releases|next-gen)\b", re.IGNORECASE),
    ),
    (
        EventType.RUMOR,
        re.compile(r"\b(rumor|reportedly|sources\s+say|unconfirmed|speculation)\b", re.IGNORECASE),
    ),
]


def resolve_entities(text: str) -> list[Entity]:
    found: dict[str, Entity] = {}
    lower_text = text.lower()

    for alias, ticker in ALIAS_TO_TICKER.items():
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, lower_text):
            data = KNOWN_ENTITIES[ticker]
            if ticker not in found:
                found[ticker] = Entity(
                    name=data["name"],
                    type="company",
                    ticker=ticker,
                    cik=data["cik"],
                    confidence=0.98,
                )

    ticker_pattern = re.compile(r"\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b")
    for match in ticker_pattern.finditer(text):
        symbol = match.group(1) or match.group(2)
        if symbol in KNOWN_ENTITIES and symbol not in found:
            data = KNOWN_ENTITIES[symbol]
            found[symbol] = Entity(
                name=data["name"],
                type="company",
                ticker=symbol,
                cik=data["cik"],
                confidence=0.95,
            )

    return list(found.values())


def classify_event_type(text: str) -> EventType:
    for event_type, pattern in EVENT_PATTERNS:
        if pattern.search(text):
            return event_type
    return EventType.GENERAL


def parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    try:
        dt = date_parser.parse(str(value))
        return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
    except Exception:
        return None


def normalize_event(
    source: str,
    title: str,
    body: str,
    url: str | None = None,
    source_id: str | None = None,
    published_at: Any = None,
    event_type: EventType | None = None,
    raw_payload: dict | None = None,
    reliability: SourceReliability = SourceReliability.MEDIUM,
) -> InvestmentEvent:
    cleaned_title = re.sub(r"\s+", " ", title).strip()
    cleaned_body = re.sub(r"\s+", " ", body).strip()

    combined_text = f"{cleaned_title} {cleaned_body}"
    resolved_entities = resolve_entities(combined_text)
    resolved_type = event_type or classify_event_type(combined_text)

    content_hash = compute_content_hash(cleaned_title, cleaned_body)
    event_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source}:{source_id or content_hash}"))

    parsed_published_at = parse_timestamp(published_at)

    return InvestmentEvent(
        id=event_id,
        source=source,
        source_id=source_id,
        url=url,
        content_hash=content_hash,
        published_at=parsed_published_at,
        ingested_at=datetime.now(UTC),
        title=cleaned_title,
        body=cleaned_body,
        event_type=resolved_type,
        entities=resolved_entities,
        reliability=reliability,
        status=ConfirmationStatus.DETECTED,
        raw_payload=raw_payload,
    )
