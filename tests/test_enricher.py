import pytest

from app.models.domain import (
    ConfirmationStatus,
    Entity,
    EventType,
    InvestmentEvent,
    SourceReliability,
)
from app.processing.enricher import EventEnricher


@pytest.mark.asyncio
async def test_enricher_heuristics() -> None:
    enricher = EventEnricher()

    event = InvestmentEvent(
        id="evt-1",
        source="reuters",
        content_hash="hash-1",
        title="Nvidia reports record earnings beat with $30 billion in data center revenue",
        body="Nvidia announced massive revenue growth driven by AI accelerator demand. Operating margins expanded by 400 bps.",
        event_type=EventType.EARNINGS,
        entities=[Entity(name="NVIDIA Corp", type="company", ticker="NVDA", confidence=1.0)],
        reliability=SourceReliability.HIGH,
        status=ConfirmationStatus.CONFIRMED,
    )

    summary, why_it_matters, impact_tags, importance_score = await enricher.enrich(event)

    assert "Nvidia" in summary
    assert "operating margin trajectory" in why_it_matters
    assert importance_score >= 0.80
    assert any(tag.category == "Revenue" for tag in impact_tags)
    assert any(tag.category == "Margin" for tag in impact_tags)


@pytest.mark.asyncio
async def test_enricher_regulatory_event() -> None:
    enricher = EventEnricher()

    event = InvestmentEvent(
        id="evt-2",
        source="sec_edgar",
        content_hash="hash-2",
        title="DOJ opens formal antitrust investigation into Alphabet search agreements",
        body="Regulators have issued subpoenas regarding exclusive distribution contracts.",
        event_type=EventType.REGULATORY,
        entities=[Entity(name="Alphabet Inc", type="company", ticker="GOOGL", confidence=1.0)],
        reliability=SourceReliability.HIGH,
        status=ConfirmationStatus.CONFIRMED,
    )

    summary, why_it_matters, impact_tags, importance_score = await enricher.enrich(event)

    assert "Alphabet" in summary or "DOJ" in summary
    assert importance_score >= 0.75
    assert "contingency reserves" in why_it_matters
    assert any(tag.category == "Regulatory" and tag.sentiment == "negative" for tag in impact_tags)
