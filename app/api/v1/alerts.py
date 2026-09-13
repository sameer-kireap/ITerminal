import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.tables import ArticleTable, WatchlistTable

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertDTO(BaseModel):
    id: str
    ticker: str | None
    company_name: str | None
    title: str
    summary: str | None
    why_it_matters: str | None
    impact_tags: list[dict[str, Any]] = []
    importance_score: float
    event_type: str
    source: str
    source_reliability: str
    url: str | None
    detected_at: str


class WatchlistCreateRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)


class WatchlistItemDTO(BaseModel):
    id: str
    ticker: str
    created_at: str


@router.get("", response_model=list[AlertDTO])
async def get_materiality_alerts(
    min_importance: float = Query(default=0.70, ge=0.0, le=1.0),
    watchlist_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[AlertDTO]:
    watched_tickers: set[str] = set()
    if watchlist_only:
        wl_stmt = select(WatchlistTable.ticker)
        wl_res = await db.execute(wl_stmt)
        watched_tickers = {t.upper() for t in wl_res.scalars().all()}
        if not watched_tickers:
            return []

    stmt = (
        select(ArticleTable)
        .options(selectinload(ArticleTable.companies))
        .where(ArticleTable.importance_score >= min_importance)
        .order_by(desc(ArticleTable.ingested_at))
        .limit(limit * 2)
    )
    res = await db.execute(stmt)
    articles = res.scalars().all()

    alerts: list[AlertDTO] = []
    for a in articles:
        comp_ticker = a.companies[0].ticker if a.companies else None
        comp_name = a.companies[0].name if a.companies else None

        if watchlist_only and (not comp_ticker or comp_ticker.upper() not in watched_tickers):
            continue

        ts = a.published_at or a.ingested_at or datetime.now(UTC)
        alerts.append(
            AlertDTO(
                id=a.id,
                ticker=comp_ticker,
                company_name=comp_name,
                title=a.title,
                summary=a.summary,
                why_it_matters=a.why_it_matters,
                impact_tags=a.impact_tags or [],
                importance_score=a.importance_score or 0.0,
                event_type=a.event_type,
                source=a.source,
                source_reliability=a.source_reliability,
                url=a.url,
                detected_at=ts.isoformat(),
            )
        )
        if len(alerts) >= limit:
            break

    return alerts


@router.get("/watchlist", response_model=list[WatchlistItemDTO])
async def list_watchlist(
    db: AsyncSession = Depends(get_db),
) -> list[WatchlistItemDTO]:
    stmt = select(WatchlistTable).order_by(WatchlistTable.ticker)
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [
        WatchlistItemDTO(
            id=item.id,
            ticker=item.ticker,
            created_at=item.created_at.isoformat(),
        )
        for item in items
    ]


@router.post("/watchlist", response_model=WatchlistItemDTO, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    req: WatchlistCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> WatchlistItemDTO:
    clean_ticker = req.ticker.strip().upper()
    check_stmt = select(WatchlistTable).where(WatchlistTable.ticker == clean_ticker)
    existing = (await db.execute(check_stmt)).scalar_one_or_none()
    if existing:
        return WatchlistItemDTO(
            id=existing.id,
            ticker=existing.ticker,
            created_at=existing.created_at.isoformat(),
        )

    new_item = WatchlistTable(
        id=str(uuid.uuid4()),
        user_id="default_user",
        ticker=clean_ticker,
        created_at=datetime.now(UTC),
    )
    db.add(new_item)
    await db.commit()

    return WatchlistItemDTO(
        id=new_item.id,
        ticker=new_item.ticker,
        created_at=new_item.created_at.isoformat(),
    )


@router.delete("/watchlist/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    stmt = delete(WatchlistTable).where(WatchlistTable.ticker == ticker.strip().upper())
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not in watchlist")
    await db.commit()
