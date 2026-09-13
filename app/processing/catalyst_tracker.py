import uuid
from datetime import UTC, datetime, timedelta

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financials import CatalystTable


class CatalystDTO(BaseModel):
    id: str
    ticker: str
    title: str
    catalyst_type: str
    expected_date: str
    days_until: int
    confidence: float
    potential_impact: str
    description: str | None = None


class CatalystCreateRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)
    title: str = Field(..., min_length=3, max_length=255)
    catalyst_type: str = Field(default="earnings")
    expected_date: str = Field(description="ISO-8601 string, e.g. 2024-11-20")
    potential_impact: str = Field(default="high")
    description: str | None = None


class CatalystService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_catalysts(self, ticker: str | None = None, limit: int = 50) -> list[CatalystDTO]:
        clean_ticker = ticker.upper() if ticker else None
        now = datetime.now(UTC)

        stmt = select(CatalystTable).order_by(CatalystTable.expected_date.asc()).limit(limit)
        if clean_ticker:
            stmt = stmt.where(CatalystTable.ticker == clean_ticker)

        res = await self.db.execute(stmt)
        rows = list(res.scalars().all())

        if not rows:
            await self._seed_default_catalysts()
            res = await self.db.execute(stmt)
            rows = list(res.scalars().all())

        results = []
        for r in rows:
            # Handle timezone-aware or naive datetimes safely
            dt = r.expected_date
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            days = (dt - now).days
            results.append(
                CatalystDTO(
                    id=r.id,
                    ticker=r.ticker,
                    title=r.title,
                    catalyst_type=r.catalyst_type,
                    expected_date=dt.date().isoformat(),
                    days_until=max(0, days),
                    confidence=r.confidence,
                    potential_impact=r.potential_impact,
                    description=r.description,
                )
            )
        return results

    async def create_catalyst(self, req: CatalystCreateRequest) -> CatalystDTO:
        clean_ticker = req.ticker.upper()
        now = datetime.now(UTC)
        try:
            exp_date = datetime.fromisoformat(req.expected_date).replace(tzinfo=UTC)
        except Exception:
            exp_date = now + timedelta(days=30)

        cid = str(uuid.uuid4())
        row = CatalystTable(
            id=cid,
            ticker=clean_ticker,
            title=req.title,
            catalyst_type=req.catalyst_type,
            expected_date=exp_date,
            confidence=0.85,
            potential_impact=req.potential_impact,
            description=req.description,
            created_at=now,
        )
        self.db.add(row)
        await self.db.commit()

        days = max(0, (exp_date - now).days)
        return CatalystDTO(
            id=row.id,
            ticker=row.ticker,
            title=row.title,
            catalyst_type=row.catalyst_type,
            expected_date=exp_date.date().isoformat(),
            days_until=days,
            confidence=row.confidence,
            potential_impact=row.potential_impact,
            description=row.description,
        )

    async def _seed_default_catalysts(self) -> None:
        now = datetime.now(UTC)
        defaults = [
            (
                "NVDA",
                "Q3 Fiscal 2025 Earnings Release",
                "earnings",
                now + timedelta(days=14),
                0.95,
                "high",
                "Consensus expectations centered on Blackwell production shipments and datacenter gross margins.",
            ),
            (
                "NVDA",
                "Blackwell Ultra Hyperscaler Delivery Kickoff",
                "product_launch",
                now + timedelta(days=45),
                0.90,
                "high",
                "First enterprise volume deliveries of GB200 NVL72 rack-scale systems.",
            ),
            (
                "AAPL",
                "Apple Special Event & Apple Intelligence Release",
                "product_launch",
                now + timedelta(days=7),
                0.92,
                "high",
                "Commercial rollout of localized on-device and private cloud compute AI features.",
            ),
            (
                "TSLA",
                "Robotaxi Unveil & FSD Commercial Roadshow",
                "product_launch",
                now + timedelta(days=21),
                0.88,
                "high",
                "Autonomous cybercab prototype reveal and ride-hailing regulatory framework timeline.",
            ),
            (
                "GOOGL",
                "DOJ Antitrust Remedy Hearing & Search Agreements",
                "regulatory",
                now + timedelta(days=38),
                0.85,
                "high",
                "Court hearings regarding exclusivity distribution contracts with smartphone manufacturers.",
            ),
            (
                "MSFT",
                "Ignite Enterprise AI Conference & Copilot Metrics",
                "investor_day",
                now + timedelta(days=60),
                0.90,
                "medium",
                "Commercial enterprise seat expansion updates for Microsoft 365 Copilot.",
            ),
        ]

        for ticker, title, ctype, dt, conf, impact, descr in defaults:
            row = CatalystTable(
                id=str(uuid.uuid4()),
                ticker=ticker,
                title=title,
                catalyst_type=ctype,
                expected_date=dt,
                confidence=conf,
                potential_impact=impact,
                description=descr,
                created_at=now,
            )
            self.db.add(row)
        await self.db.commit()
