import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_company_endpoints_and_alerts() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Ingest an event with NVDA ticker
        payload = {
            "source": "reuters",
            "title": "Nvidia announces new Blackwell Ultra AI chip partnership",
            "body": "Nvidia expands its enterprise hyperscaler partnership with new silicon deliveries scheduled for Q4.",
            "url": "https://reuters.com/article/nvda-test-1",
        }
        res_ingest = await client.post("/api/v1/ingestion/webhook", json=payload)
        assert res_ingest.status_code == 202

        # 2. Query company profile
        res_comp = await client.get("/api/v1/companies/NVDA")
        assert res_comp.status_code == 200
        comp_data = res_comp.json()
        assert comp_data["ticker"] == "NVDA"
        assert comp_data["total_events"] >= 1

        # 3. Query company timeline
        res_tl = await client.get("/api/v1/companies/NVDA/timeline")
        assert res_tl.status_code == 200
        tl_data = res_tl.json()
        assert len(tl_data) >= 1
        assert "why_it_matters" in tl_data[0]
        assert "impact_tags" in tl_data[0]

        # 4. Query company delta
        res_delta = await client.get("/api/v1/companies/NVDA/delta?hours=24")
        assert res_delta.status_code == 200
        delta_data = res_delta.json()
        assert delta_data["ticker"] == "NVDA"
        assert delta_data["new_events_count"] >= 1
        assert "delta_summary" in delta_data

        # 5. Test watchlist CRUD
        res_wl_add = await client.post("/api/v1/alerts/watchlist", json={"ticker": "NVDA"})
        assert res_wl_add.status_code == 201
        assert res_wl_add.json()["ticker"] == "NVDA"

        res_wl_list = await client.get("/api/v1/alerts/watchlist")
        assert res_wl_list.status_code == 200
        tickers = [item["ticker"] for item in res_wl_list.json()]
        assert "NVDA" in tickers

        # 6. Test alerts query
        res_alerts = await client.get("/api/v1/alerts?min_importance=0.50&watchlist_only=true")
        assert res_alerts.status_code == 200
        alerts_list = res_alerts.json()
        assert len(alerts_list) >= 1
        assert alerts_list[0]["ticker"] == "NVDA"

        # 7. Delete from watchlist
        res_wl_del = await client.delete("/api/v1/alerts/watchlist/NVDA")
        assert res_wl_del.status_code == 204
