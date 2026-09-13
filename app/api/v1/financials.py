from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.financials import MetricTraceDTO
from app.processing.financial_service import FinancialDataService

router = APIRouter(prefix="/financials", tags=["financials"])


@router.get("/{ticker}/statements")
async def get_financial_statements(
    ticker: str,
    limit: int = Query(default=8, ge=1, le=16),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    svc = FinancialDataService(db)
    return await svc.get_statements(ticker=ticker, limit=limit)


@router.get("/{ticker}/metrics")
async def get_financial_metrics_trend(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    svc = FinancialDataService(db)
    return await svc.get_metrics_trend(ticker=ticker)


@router.get("/{ticker}/trace", response_model=MetricTraceDTO)
async def trace_financial_metric(
    ticker: str,
    period: str = Query(default="Q4 2024"),
    metric: str = Query(default="revenue"),
    db: AsyncSession = Depends(get_db),
) -> MetricTraceDTO:
    svc = FinancialDataService(db)
    return await svc.trace_metric(ticker=ticker, period=period, metric=metric)
