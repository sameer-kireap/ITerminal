from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.tables import ArticleTable, CompanyTable

router = APIRouter(prefix="/companies", tags=["companies"])


class CompanyProfileDTO(BaseModel):
    id: str
    name: str
    ticker: str
    cik: str | None
    sector: str | None
    total_events: int
    sentiment_distribution: dict[str, int]
    latest_event_at: str | None


class TimelineItemDTO(BaseModel):
    id: str
    title: str
    summary: str | None
    why_it_matters: str | None
    impact_tags: list[dict[str, Any]] = []
    importance_score: float | None
    event_type: str
    source: str
    url: str | None
    timestamp: str


class DeltaFeedDTO(BaseModel):
    ticker: str
    window_hours: int = 24
    new_events_count: int
    prior_events_count: int
    activity_delta_percent: float
    key_developments: list[TimelineItemDTO]
    delta_summary: str


@router.get("/{ticker}", response_model=CompanyProfileDTO)
async def get_company_profile(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> CompanyProfileDTO:
    stmt = (
        select(CompanyTable)
        .where(CompanyTable.ticker == ticker.upper())
        .options(selectinload(CompanyTable.articles))
    )
    res = await db.execute(stmt)
    comp = res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=404, detail=f"Company '{ticker}' not found")

    articles = comp.articles
    sentiments: dict[str, int] = {"positive": 0, "negative": 0, "neutral": 0}
    for art in articles:
        if art.impact_tags:
            for tag in art.impact_tags:
                sent = tag.get("sentiment", "neutral").lower()
                sentiments[sent] = sentiments.get(sent, 0) + 1

    latest_dt = max((a.ingested_at for a in articles), default=None)

    return CompanyProfileDTO(
        id=comp.id,
        name=comp.name,
        ticker=comp.ticker or ticker.upper(),
        cik=comp.cik,
        sector=comp.sector,
        total_events=len(articles),
        sentiment_distribution=sentiments,
        latest_event_at=latest_dt.isoformat() if latest_dt else None,
    )


@router.get("/{ticker}/timeline", response_model=list[TimelineItemDTO])
async def get_company_timeline(
    ticker: str,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[TimelineItemDTO]:
    stmt = (
        select(ArticleTable)
        .join(ArticleTable.companies)
        .where(CompanyTable.ticker == ticker.upper())
        .order_by(desc(ArticleTable.ingested_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    articles = res.scalars().all()

    items = []
    for a in articles:
        ts = a.published_at or a.ingested_at or datetime.now(UTC)
        items.append(
            TimelineItemDTO(
                id=a.id,
                title=a.title,
                summary=a.summary,
                why_it_matters=a.why_it_matters,
                impact_tags=a.impact_tags or [],
                importance_score=a.importance_score,
                event_type=a.event_type,
                source=a.source,
                url=a.url,
                timestamp=ts.isoformat(),
            )
        )
    return items


@router.get("/{ticker}/delta", response_model=DeltaFeedDTO)
async def get_company_delta(
    ticker: str,
    hours: int = Query(default=24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
) -> DeltaFeedDTO:
    now = datetime.now(UTC)
    cutoff = now - timedelta(hours=hours)
    prior_cutoff = cutoff - timedelta(hours=hours)

    stmt_recent = (
        select(ArticleTable)
        .join(ArticleTable.companies)
        .where(
            CompanyTable.ticker == ticker.upper(),
            ArticleTable.ingested_at >= cutoff,
        )
        .order_by(desc(ArticleTable.importance_score))
    )
    res_recent = await db.execute(stmt_recent)
    recent_articles = list(res_recent.scalars().all())

    stmt_prior_count = (
        select(func.count(ArticleTable.id))
        .join(ArticleTable.companies)
        .where(
            CompanyTable.ticker == ticker.upper(),
            ArticleTable.ingested_at >= prior_cutoff,
            ArticleTable.ingested_at < cutoff,
        )
    )
    res_prior = await db.execute(stmt_prior_count)
    prior_count = res_prior.scalar() or 0

    new_count = len(recent_articles)
    if prior_count > 0:
        delta_pct = round(((new_count - prior_count) / prior_count) * 100.0, 1)
    else:
        delta_pct = 100.0 if new_count > 0 else 0.0

    key_developments = [
        TimelineItemDTO(
            id=a.id,
            title=a.title,
            summary=a.summary,
            why_it_matters=a.why_it_matters,
            impact_tags=a.impact_tags or [],
            importance_score=a.importance_score,
            event_type=a.event_type,
            source=a.source,
            url=a.url,
            timestamp=(a.published_at or a.ingested_at or now).isoformat(),
        )
        for a in recent_articles[:5]
    ]

    if new_count == 0:
        summary_text = (
            f"No new material events detected for {ticker.upper()} in the past {hours} hours."
        )
    else:
        top_titles = "; ".join(a.title for a in recent_articles[:2])
        summary_text = (
            f"{new_count} developments surfaced in the last {hours}h ({delta_pct:+}% vs prior window). "
            f"Key drivers: {top_titles}"
        )

    return DeltaFeedDTO(
        ticker=ticker.upper(),
        window_hours=hours,
        new_events_count=new_count,
        prior_events_count=prior_count,
        activity_delta_percent=delta_pct,
        key_developments=key_developments,
        delta_summary=summary_text,
    )
