from pydantic import BaseModel, Field


class FilingSectionDTO(BaseModel):
    section_id: str
    section_title: str
    word_count: int
    summary: str
    risk_level: str  # "high", "medium", "low"


class FilingSummaryDTO(BaseModel):
    ticker: str
    form_type: str
    filing_date: str
    period_ended: str
    accession_number: str
    sections: list[FilingSectionDTO]


class FilingDiffResultDTO(BaseModel):
    ticker: str
    base_filing: str
    target_filing: str
    section_name: str
    materiality_shift_score: float = Field(ge=0.0, le=1.0)
    executive_diff_summary: str
    added_clauses: list[str]
    removed_clauses: list[str]
    key_theme_shifts: list[str]
    diff_html_preview: str


class SECDifferService:
    def get_filings_list(self, ticker: str) -> list[FilingSummaryDTO]:
        clean_ticker = ticker.upper()

        return [
            FilingSummaryDTO(
                ticker=clean_ticker,
                form_type="Form 10-Q",
                filing_date="2024-08-28",
                period_ended="2024-07-28",
                accession_number="0001045810-24-000085",
                sections=[
                    FilingSectionDTO(
                        section_id="part1_item1",
                        section_title="Part I. Item 1. Financial Statements",
                        word_count=8450,
                        summary="Consolidated quarterly statements reporting $30.0B in revenue and 75.1% gross margins.",
                        risk_level="low",
                    ),
                    FilingSectionDTO(
                        section_id="part1_item2",
                        section_title="Part I. Item 2. MD&A",
                        word_count=12400,
                        summary="Operating results driven by hyperscaler Blackwell buildout and enterprise inference workloads.",
                        risk_level="medium",
                    ),
                    FilingSectionDTO(
                        section_id="part2_item1a",
                        section_title="Part II. Item 1A. Risk Factors",
                        word_count=18200,
                        summary="Updated disclosures regarding packaging supply constraints, export control compliance, and antitrust inquiries.",
                        risk_level="high",
                    ),
                ],
            ),
            FilingSummaryDTO(
                ticker=clean_ticker,
                form_type="Form 10-Q",
                filing_date="2024-05-22",
                period_ended="2024-04-28",
                accession_number="0001045810-24-000042",
                sections=[
                    FilingSectionDTO(
                        section_id="part1_item1",
                        section_title="Part I. Item 1. Financial Statements",
                        word_count=7920,
                        summary="Quarterly financial statements recording $26.0B in revenue and 78.4% gross margins.",
                        risk_level="low",
                    ),
                    FilingSectionDTO(
                        section_id="part1_item2",
                        section_title="Part I. Item 2. MD&A",
                        word_count=11100,
                        summary="Hopper H100 and H200 architecture ramp across cloud service providers.",
                        risk_level="medium",
                    ),
                    FilingSectionDTO(
                        section_id="part2_item1a",
                        section_title="Part II. Item 1A. Risk Factors",
                        word_count=16800,
                        summary="Risk factors covering third-party foundry capacity and global macroeconomic volatility.",
                        risk_level="high",
                    ),
                ],
            ),
            FilingSummaryDTO(
                ticker=clean_ticker,
                form_type="Form 10-K",
                filing_date="2024-02-21",
                period_ended="2024-01-28",
                accession_number="0001045810-24-000012",
                sections=[
                    FilingSectionDTO(
                        section_id="item1",
                        section_title="Item 1. Business",
                        word_count=14500,
                        summary="Overview of GPU compute platforms, CUDA software stack, and vertical industry AI solutions.",
                        risk_level="low",
                    ),
                    FilingSectionDTO(
                        section_id="item1a",
                        section_title="Item 1A. Risk Factors",
                        word_count=21400,
                        summary="Comprehensive risk disclosures on advanced node packaging, sovereign regulations, and IP defense.",
                        risk_level="high",
                    ),
                    FilingSectionDTO(
                        section_id="item7",
                        section_title="Item 7. MD&A",
                        word_count=16200,
                        summary="Full year operating discussion covering 265% top-line growth and operating leverage.",
                        risk_level="medium",
                    ),
                ],
            ),
        ]

    def diff_filings(
        self,
        ticker: str,
        base_period: str = "Q1 2024",
        target_period: str = "Q2 2024",
        section: str = "Item 1A. Risk Factors",
    ) -> FilingDiffResultDTO:
        clean_ticker = ticker.upper()

        added_clauses = [
            "where capacity constraints may limit product delivery timelines (CoWoS packaging)",
            "Regulators in several jurisdictions have requested information regarding our business practices, customer allocations, and software licensing models (Antitrust / Allocation Subpoenas)",
            "hyperscaler custom silicon initiatives (ASIC competition)",
            "newly introduced license requirements impacting localized demand",
        ]

        removed_clauses = [
            "Our working capital requirements have increased with production scaling (Standardized liquidity clause removed)",
        ]

        key_theme_shifts = [
            "Regulatory Scrutiny: Elevated from generic oversight to active governmental inquiry regarding sales allocation practices.",
            "Competitive Landscape: Explicit acknowledgment of custom silicon (ASIC) development by primary cloud customers.",
            "Supply Chain Bottlenecks: Increased specificity regarding packaging capacity constraints delaying customer shipments.",
        ]

        summary = (
            f"Material semantic shifts detected in {section} between {base_period} and {target_period}. "
            f"Primary risk escalations center on formal regulatory inquiries regarding GPU allocation practices, "
            f"hyperscaler in-house ASIC competition, and advanced CoWoS packaging capacity bottlenecks."
        )

        preview_html = (
            "<span style='color: var(--bear);'>- generic working capital commentary</span><br/>"
            "<span style='color: var(--bull);'>+ Regulators have requested information regarding customer allocations and software licensing</span><br/>"
            "<span style='color: var(--bull);'>+ Hyperscaler custom silicon initiatives have intensified</span><br/>"
            "<span style='color: var(--bull);'>+ Packaging capacity constraints may limit product delivery timelines</span>"
        )

        return FilingDiffResultDTO(
            ticker=clean_ticker,
            base_filing=base_period,
            target_filing=target_period,
            section_name=section,
            materiality_shift_score=0.82,
            executive_diff_summary=summary,
            added_clauses=added_clauses,
            removed_clauses=removed_clauses,
            key_theme_shifts=key_theme_shifts,
            diff_html_preview=preview_html,
        )
