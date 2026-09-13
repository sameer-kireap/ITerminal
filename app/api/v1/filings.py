from fastapi import APIRouter, Query

from app.processing.sec_differ import (
    FilingDiffResultDTO,
    FilingSummaryDTO,
    SECDifferService,
)

router = APIRouter(prefix="/filings", tags=["filings"])


@router.get("/{ticker}", response_model=list[FilingSummaryDTO])
async def list_company_filings(ticker: str) -> list[FilingSummaryDTO]:
    svc = SECDifferService()
    return svc.get_filings_list(ticker)


@router.get("/{ticker}/diff", response_model=FilingDiffResultDTO)
async def diff_company_filings(
    ticker: str,
    base_period: str = Query(default="Q1 2024"),
    target_period: str = Query(default="Q2 2024"),
    section: str = Query(default="Item 1A. Risk Factors"),
) -> FilingDiffResultDTO:
    svc = SECDifferService()
    return svc.diff_filings(
        ticker=ticker,
        base_period=base_period,
        target_period=target_period,
        section=section,
    )
