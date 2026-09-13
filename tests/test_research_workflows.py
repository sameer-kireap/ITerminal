import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.workflows.client import get_workflow_dispatcher
from app.workflows.models import ResearchInput


@pytest.mark.asyncio
async def test_deep_research_workflow_execution() -> None:
    dispatcher = get_workflow_dispatcher()
    inp = ResearchInput(
        tickers=["NVDA"],
        topic="Evaluate sustainability of AI datacenter margins",
        depth="deep",
    )

    wf_id = await dispatcher.start_research_workflow(inp)
    assert wf_id.startswith("research-")

    # Await background workflow completion
    for _ in range(20):
        status = dispatcher.get_status(wf_id)
        if status and status.status == "COMPLETED":
            break
        await asyncio.sleep(0.1)

    status = dispatcher.get_status(wf_id)
    assert status is not None
    assert status.status == "COMPLETED"
    assert status.report is not None
    assert "NVDA" in status.report.tickers
    assert len(status.report.key_findings) > 0
    assert status.report.bull_case is not None
    assert status.report.bear_case is not None


@pytest.mark.asyncio
async def test_bull_bear_and_compare() -> None:
    dispatcher = get_workflow_dispatcher()

    bb = await dispatcher.run_bull_bear("NVDA")
    assert bb.ticker == "NVDA"
    assert len(bb.bull_catalysts) > 0
    assert len(bb.bear_risks) > 0
    assert len(bb.falsification_conditions) > 0

    comp = await dispatcher.run_compare("NVDA", "AMD")
    assert comp.ticker_a == "NVDA"
    assert comp.ticker_b == "AMD"
    assert "NVDA" in comp.strategic_advantages
    assert "AMD" in comp.strategic_advantages


@pytest.mark.asyncio
async def test_research_api_endpoints() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. RAG query
        res_q = await client.post(
            "/api/v1/research/query",
            json={"query": "What is the guidance outlook?", "ticker": "NVDA"},
        )
        assert res_q.status_code == 200
        data_q = res_q.json()
        assert "answer" in data_q
        assert "citations" in data_q

        # 2. Bull-Bear API
        res_bb = await client.post("/api/v1/research/bull-bear", json={"ticker": "NVDA"})
        assert res_bb.status_code == 200
        assert res_bb.json()["ticker"] == "NVDA"

        # 3. Compare API
        res_cmp = await client.post(
            "/api/v1/research/compare", json={"ticker_a": "NVDA", "ticker_b": "MSFT"}
        )
        assert res_cmp.status_code == 200
        assert res_cmp.json()["ticker_a"] == "NVDA"

        # 4. Thesis CRUD
        res_th_create = await client.post(
            "/api/v1/research/theses",
            json={
                "ticker": "NVDA",
                "thesis_text": "Nvidia will sustain 75% gross margins through 2026.",
            },
        )
        assert res_th_create.status_code == 201
        th_data = res_th_create.json()
        thesis_id = th_data["id"]
        assert th_data["ticker"] == "NVDA"
        assert "last_evaluation" in th_data

        # 5. List theses
        res_th_list = await client.get("/api/v1/research/theses?ticker=NVDA")
        assert res_th_list.status_code == 200
        assert len(res_th_list.json()) >= 1

        # 6. Evaluate thesis
        res_eval = await client.post(f"/api/v1/research/theses/{thesis_id}/evaluate")
        assert res_eval.status_code == 200
        assert res_eval.json()["status"] in ["supports", "contradicts", "neutral"]

        # 7. Delete thesis
        res_del = await client.delete(f"/api/v1/research/theses/{thesis_id}")
        assert res_del.status_code == 204
