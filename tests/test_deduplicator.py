import pytest

from app.models.domain import EventType
from app.processing.deduplicator import (
    DeduplicationEngine,
)
from app.processing.normalizer import normalize_event


@pytest.mark.asyncio
async def test_exact_deduplication():
    engine = DeduplicationEngine()
    event1 = normalize_event(
        source="sec_edgar",
        title="NVIDIA Reports Record Q4 Revenue",
        body="NVIDIA announced Q4 revenue of $22.1B, up 265% year-over-year.",
    )
    event2 = normalize_event(
        source="reuters",
        title="NVIDIA Reports Record Q4 Revenue",
        body="NVIDIA announced Q4 revenue of $22.1B, up 265% year-over-year.",
    )

    res1 = await engine.process(event1)
    assert not res1.is_duplicate

    res2 = await engine.process(event2)
    assert res2.is_duplicate
    assert res2.duplicate_type == "exact"


@pytest.mark.asyncio
async def test_simhash_near_deduplication():
    engine = DeduplicationEngine()
    event1 = normalize_event(
        source="reuters",
        title="Nvidia beats Wall Street expectations on surging AI infrastructure demand",
        body="NVIDIA reported record quarterly revenue driven by immense demand for Hopper H100 GPUs across global cloud providers.",
    )
    # Syndicated wire story with minor headline edit
    event2 = normalize_event(
        source="yahoo_finance",
        title="Nvidia smashes Wall Street expectations on surging AI infrastructure demand",
        body="NVIDIA reported record quarterly revenue driven by immense demand for Hopper H100 GPUs across global cloud providers.",
    )

    res1 = await engine.process(event1)
    assert not res1.is_duplicate

    res2 = await engine.process(event2)
    assert res2.is_duplicate
    assert res2.duplicate_type == "near_simhash"
    assert res2.similarity_score is not None
    assert res2.similarity_score > 0.90


@pytest.mark.asyncio
async def test_event_clustering():
    engine = DeduplicationEngine()
    event1 = normalize_event(
        source="bloomberg",
        title="Apple in talks with Google for Gemini AI on iPhone",
        body="Apple Inc is negotiating to integrate Gemini AI models into iOS 18.",
        event_type=EventType.PARTNERSHIP,
    )
    # Different wording about the same company partnership
    event2 = normalize_event(
        source="financial_times",
        title="Google in high-level discussions with Apple for smartphone AI agreement",
        body="Discussions between Apple and Alphabet aim to deploy generative AI tools on upcoming handset releases.",
        event_type=EventType.PARTNERSHIP,
    )

    res1 = await engine.process(event1)
    assert not res1.is_duplicate

    res2 = await engine.process(event2)
    assert not res2.is_duplicate
    assert res2.duplicate_type == "cluster_existing"
    assert res2.matched_event_id == event1.id
