from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.processing.earnings_parser import (
    EarningsIntelligenceService,
    EarningsReleaseDTO,
    TranscriptAnalysisDTO,
)

router = APIRouter(prefix="/earnings", tags=["earnings"])


@router.get("/{ticker}", response_model=EarningsReleaseDTO)
async def get_earnings_report(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> EarningsReleaseDTO:
    svc = EarningsIntelligenceService(db)
    return await svc.get_earnings_intelligence(ticker=ticker)


@router.get("/{ticker}/transcript", response_model=TranscriptAnalysisDTO)
async def get_earnings_call_transcript(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> TranscriptAnalysisDTO:
    svc = EarningsIntelligenceService(db)
    return await svc.get_transcript_intelligence(ticker=ticker)
