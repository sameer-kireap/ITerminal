import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.processing.document_parser import CompareReportsRequest, DocumentIntelligenceService
from app.processing.sec_differ import SECDifferService


@pytest.mark.asyncio
async def test_financial_statements_and_trace() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Financial Statements
        res_stmt = await client.get("/api/v1/financials/NVDA/statements?limit=4")
        assert res_stmt.status_code == 200
        stmts = res_stmt.json()
        assert len(stmts) >= 1
        assert "income_statement" in stmts[0]
        assert "revenue" in stmts[0]["income_statement"]
        assert stmts[0]["income_statement"]["revenue"] > 0

        # 2. Metrics Trend
        res_metrics = await client.get("/api/v1/financials/NVDA/metrics")
        assert res_metrics.status_code == 200
        metrics = res_metrics.json()
        assert "revenue" in metrics["metrics"]
        assert len(metrics["periods"]) >= 1

        # 3. Line-Item Coordinate Trace
        res_trace = await client.get(
            "/api/v1/financials/NVDA/trace?period=Q4%202024&metric=revenue"
        )
        assert res_trace.status_code == 200
        trace = res_trace.json()
        assert trace["ticker"] == "NVDA"
        assert trace["metric"] == "revenue"
        assert trace["value"] == 22103.0
        assert "verification_hash" in trace
        assert "Form 10-Q" in trace["form_type"]
        assert "Part I" in trace["section_name"]


@pytest.mark.asyncio
async def test_earnings_intelligence_and_transcript() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Earnings Release Actuals vs Consensus
        res_earn = await client.get("/api/v1/earnings/NVDA")
        assert res_earn.status_code == 200
        earn = res_earn.json()
        assert earn["ticker"] == "NVDA"
        assert earn["beat_or_miss"] == "beat"
        assert earn["revenue_surprise_pct"] > 0
        assert "Data Center" in earn["segment_breakdown"]

        # 2. Transcript Analysis
        res_tr = await client.get("/api/v1/earnings/NVDA/transcript")
        assert res_tr.status_code == 200
        tr = res_tr.json()
        assert tr["ticker"] == "NVDA"
        assert tr["overall_sentiment_score"] > 0.5
        assert len(tr["qa_sessions"]) >= 2
        assert tr["qa_sessions"][0]["analyst_name"] == "Toshiya Hari"


@pytest.mark.asyncio
async def test_sec_differ() -> None:
    differ = SECDifferService()
    diff_res = differ.diff_filings(
        ticker="NVDA",
        base_period="Q1 2024",
        target_period="Q2 2024",
        section="Item 1A. Risk Factors",
    )

    assert diff_res.ticker == "NVDA"
    assert diff_res.materiality_shift_score >= 0.70
    assert len(diff_res.added_clauses) >= 2
    assert any("capacity constraints" in c for c in diff_res.added_clauses)
    assert len(diff_res.key_theme_shifts) >= 2

    # Test via API
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/filings/NVDA/diff")
        assert res.status_code == 200
        data = res.json()
        assert data["materiality_shift_score"] >= 0.70


@pytest.mark.asyncio
async def test_catalysts_and_calendar() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List default seeded catalysts
        res_cal = await client.get("/api/v1/calendar?limit=10")
        assert res_cal.status_code == 200
        events = res_cal.json()
        assert len(events) >= 1

        # Add custom catalyst
        payload = {
            "ticker": "NVDA",
            "title": "GTC AI Keynote & B200 Compute Updates",
            "catalyst_type": "investor_day",
            "expected_date": "2025-03-18",
            "potential_impact": "high",
            "description": "Annual developer conference keynote detailing GPU roadmaps.",
        }
        res_create = await client.post("/api/v1/calendar", json=payload)
        assert res_create.status_code == 201
        created = res_create.json()
        assert created["ticker"] == "NVDA"
        assert created["title"] == payload["title"]


@pytest.mark.asyncio
async def test_document_intelligence_and_comparison() -> None:
    svc = DocumentIntelligenceService()

    # 1. Document Analysis
    doc_a = (
        "Goldman Sachs Equity Research: Nvidia Corporation (NVDA: Buy). "
        "We raise our 12-month target price to $150 based on continued hyperscaler capex expansion. "
        "Data Center revenue surged 409% YoY. We project 76% gross margins through fiscal 2026."
    )
    analysis = svc.analyze_document(title="Goldman Sachs NVDA Preview", text=doc_a)
    assert analysis.sentiment == "bullish"
    assert len(analysis.extracted_metrics) >= 2
    assert "Top-line Growth & Sales Momentum" in analysis.key_themes

    # 2. Report Comparison
    doc_b = (
        "Morgan Stanley Research: Nvidia Corp (NVDA: Equal-weight). "
        "While near-term visibility remains robust, we note emerging risk of gross margin compression to 72%. "
        "Hyperscalers are accelerating internal ASIC programs, introducing long-term multiple risk."
    )
    comp_req = CompareReportsRequest(
        report_a_title="Goldman Sachs Bull Note",
        report_a_text=doc_a,
        report_b_title="Morgan Stanley Cautious Note",
        report_b_text=doc_b,
    )
    comp_res = svc.compare_reports(comp_req)
    assert len(comp_res.shared_theses) >= 1
    assert len(comp_res.diverging_views) >= 2
    assert "Goldman Sachs Bull Note" in comp_res.reconciliation_summary
