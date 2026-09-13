from datetime import UTC, datetime

from pydantic import BaseModel
from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.models.tables import Base


class FinancialStatementTable(Base):
    __tablename__ = "financial_statements"

    id = Column(String(64), primary_key=True)
    company_id = Column(
        String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True
    )
    ticker = Column(String(16), nullable=False, index=True)
    period_type = Column(String(16), nullable=False, default="quarterly")  # "quarterly" or "annual"
    fiscal_year = Column(Integer, nullable=False, index=True)
    fiscal_period = Column(String(8), nullable=False, index=True)  # "Q1", "Q2", "Q3", "Q4", "FY"
    filing_date = Column(DateTime, nullable=True)

    income_statement = Column(JSON, default=dict)
    balance_sheet = Column(JSON, default=dict)
    cash_flow = Column(JSON, default=dict)
    line_item_coordinates = Column(JSON, default=dict)

    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class ConsensusEstimateTable(Base):
    __tablename__ = "consensus_estimates"

    id = Column(String(64), primary_key=True)
    ticker = Column(String(16), nullable=False, index=True)
    fiscal_period = Column(String(16), nullable=False, index=True)
    consensus_revenue = Column(Float, nullable=False)
    consensus_eps = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    revisions_count = Column(Integer, default=15)
    last_updated = Column(DateTime, default=lambda: datetime.now(UTC))


class CatalystTable(Base):
    __tablename__ = "catalysts"

    id = Column(String(64), primary_key=True)
    ticker = Column(String(16), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    catalyst_type = Column(
        String(32), nullable=False, index=True
    )  # earnings, regulatory, investor_day, product_launch
    expected_date = Column(DateTime, nullable=False, index=True)
    confidence = Column(Float, default=0.90)
    potential_impact = Column(String(16), default="high")  # high, medium, low
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class MetricTraceDTO(BaseModel):
    ticker: str
    period: str
    metric: str
    value: float | str
    form_type: str
    source_url: str | None = None
    section_name: str
    row_index: int
    column_name: str
    verification_hash: str
    filing_snippet: str
