import pytest

from app.models.domain import (
    ConfirmationStatus,
    Entity,
    EventType,
    InvestmentEvent,
    SourceReliability,
)
from app.rag.retriever import RAGRetriever
from app.rag.vectorstore import ChromaVectorStore


@pytest.mark.asyncio
async def test_rag_retrieval_and_citations(tmp_path: str) -> None:
    store = ChromaVectorStore(persist_directory=str(tmp_path))
    retriever = RAGRetriever(vector_store=store)

    event1 = InvestmentEvent(
        id="rag-evt-1",
        source="sec_edgar",
        content_hash="hash-rag-1",
        title="NVIDIA Q4 Revenue surges to $22 billion on AI data center shipments",
        body="Nvidia announced massive revenue of $22 billion driven by hyperscaler AI orders.",
        event_type=EventType.EARNINGS,
        entities=[Entity(name="NVIDIA Corp", type="company", ticker="NVDA", confidence=1.0)],
        reliability=SourceReliability.HIGH,
        status=ConfirmationStatus.CONFIRMED,
    )
    store.add_event(event1)

    # Test grounded context generation
    context, citations = retriever.retrieve_and_ground(query="Nvidia revenue Q4", ticker="NVDA")
    assert "[Source 1]" in context
    assert len(citations) == 1
    assert citations[0].source_name == "NVDA SEC_EDGAR"
    assert "22 billion" in citations[0].relevant_snippet

    # Test query answering
    answer_obj = await retriever.answer_query(query="What was Nvidia Q4 revenue?", ticker="NVDA")
    assert answer_obj.has_sufficient_context is True
    assert "[Source 1]" in answer_obj.answer
    assert len(answer_obj.citations) == 1


@pytest.mark.asyncio
async def test_rag_anti_hallucination_fallback(tmp_path: str) -> None:
    store = ChromaVectorStore(persist_directory=str(tmp_path))
    retriever = RAGRetriever(vector_store=store)

    # No data indexed for UNKNOWN ticker
    answer_obj = await retriever.answer_query(
        query="What is the gross margin for unknown entity?", ticker="UNKNOWN"
    )
    assert answer_obj.has_sufficient_context is False
    assert "Insufficient verifiable source data to answer this query." in answer_obj.answer
    assert len(answer_obj.citations) == 0


@pytest.mark.asyncio
async def test_rag_contradiction_detection(tmp_path: str) -> None:
    store = ChromaVectorStore(persist_directory=str(tmp_path))
    retriever = RAGRetriever(vector_store=store)

    evt_a = InvestmentEvent(
        id="evt-source-a",
        source="reuters",
        content_hash="hash-a",
        title="Report states acquisition price agreed at $500 million",
        body="Sources close to the deal confirm the transaction valuation was $500 million.",
        event_type=EventType.MA,
        entities=[Entity(name="TargetCo", type="company", ticker="TGT", confidence=1.0)],
        reliability=SourceReliability.MEDIUM,
    )
    evt_b = InvestmentEvent(
        id="evt-source-b",
        source="bloomberg",
        content_hash="hash-b",
        title="Dispute over deal size valuation pegged at $650 million",
        body="Regulatory filing indicates the total purchase consideration was $650 million.",
        event_type=EventType.MA,
        entities=[Entity(name="TargetCo", type="company", ticker="TGT", confidence=1.0)],
        reliability=SourceReliability.HIGH,
    )
    store.add_event(evt_a)
    store.add_event(evt_b)

    answer_obj = await retriever.answer_query(query="acquisition price valuation", ticker="TGT")
    assert answer_obj.has_sufficient_context is True
    assert len(answer_obj.contradictions_detected) >= 1
    assert "Source Discrepancies Noted" in answer_obj.answer
