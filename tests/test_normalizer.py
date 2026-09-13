from app.models.domain import EventType, SourceReliability
from app.processing.normalizer import classify_event_type, normalize_event, resolve_entities


def test_entity_resolution_direct_ticker():
    text = "NVIDIA announced that NVDA will expand Blackwell production."
    entities = resolve_entities(text)
    tickers = [e.ticker for e in entities]
    assert "NVDA" in tickers
    assert entities[0].cik == "0001045810"


def test_entity_resolution_aliases():
    text = "Facebook parent Meta Platforms is ramping capital expenditures in data centers."
    entities = resolve_entities(text)
    tickers = [e.ticker for e in entities]
    assert "META" in tickers


def test_event_classification():
    assert (
        classify_event_type("Company reports Q4 earnings and net income of $5B")
        == EventType.EARNINGS
    )
    assert (
        classify_event_type("Executive VP resigns as chief financial officer")
        == EventType.EXECUTIVE
    )
    assert (
        classify_event_type("Company signs multi-year partnership agreement with supplier")
        == EventType.PARTNERSHIP
    )
    assert (
        classify_event_type("Antitrust investigation launched by DOJ into tech firm")
        == EventType.REGULATORY
    )
    assert (
        classify_event_type("Firm announces plans to acquire cloud software provider")
        == EventType.MA
    )


def test_event_normalization():
    event = normalize_event(
        source="sec_edgar",
        title="Form 8-K: Item 2.02 Results of Operations",
        body="Revenue increased 20% to $10 billion for the quarter.",
        url="https://sec.gov/sample-8k",
        source_id="sec-sample-01",
        reliability=SourceReliability.HIGH,
    )
    assert event.source == "sec_edgar"
    assert event.content_hash is not None
    assert len(event.content_hash) == 64
    assert event.reliability == SourceReliability.HIGH
