import pytest
from httpx import ASGITransport, AsyncClient

from app.core.database import engine, init_db
from app.main import app
from app.models.tables import Base


@pytest.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "iTerminal"


@pytest.mark.asyncio
async def test_ingest_event_and_retrieve():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Ingest new event
        ingest_payload = {
            "source": "sec_edgar",
            "title": "NVIDIA CORP - Form 8-K Earnings Release",
            "body": "NVIDIA reported record quarterly revenue of $22.1 billion with gross margin expanding to 76%.",
            "url": "https://sec.gov/sample-nvda-8k",
            "source_id": "sec-nvda-test-1",
        }
        res = await ac.post("/api/v1/ingestion/event", json=ingest_payload)
        assert res.status_code == 202
        data = res.json()
        assert data["status"] == "accepted"
        assert data["content_hash"] is not None

        # Fetch articles
        articles_res = await ac.get("/api/v1/articles?limit=10")
        assert articles_res.status_code == 200
        articles = articles_res.json()
        assert len(articles) >= 1
        assert any("NVIDIA" in a["title"] for a in articles)


@pytest.mark.asyncio
async def test_simulation_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/ingestion/simulate/apple-ai-partnership")
        assert res.status_code == 202
        data = res.json()
        assert data["status"] in ["accepted", "duplicate"]
        assert data["entity_count"] >= 1
