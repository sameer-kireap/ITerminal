from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.processing.catalyst_tracker import (
    CatalystCreateRequest,
    CatalystDTO,
    CatalystService,
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=list[CatalystDTO])
async def get_investment_calendar(
    ticker: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[CatalystDTO]:
    svc = CatalystService(db)
    return await svc.list_catalysts(ticker=ticker, limit=limit)


@router.post("", response_model=CatalystDTO, status_code=status.HTTP_201_CREATED)
async def add_catalyst_event(
    req: CatalystCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> CatalystDTO:
    svc = CatalystService(db)
    return await svc.create_catalyst(req)
