from typing import Any

from pydantic import BaseModel, Field

from app.models.domain import Citation


class ResearchInput(BaseModel):
    tickers: list[str] = Field(default_factory=list, description="Target company tickers")
    topic: str = Field(..., description="Research question or topic")
    depth: str = Field(default="deep", description="quick, standard, deep")
    focus_areas: list[str] = Field(default_factory=list)


class ResearchStep(BaseModel):
    step_id: str
    tool: str = Field(description="vector_query, sql_query, edgar_lookup, financial_calc")
    description: str
    query: str
    ticker: str | None = None


class ResearchPlan(BaseModel):
    topic: str
    steps: list[ResearchStep] = Field(default_factory=list)


class StepResult(BaseModel):
    step_id: str
    tool: str
    findings: str
    citations: list[Citation] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)


class ResearchReport(BaseModel):
    workflow_id: str
    topic: str
    tickers: list[str] = Field(default_factory=list)
    executive_summary: str
    key_findings: list[str] = Field(default_factory=list)
    bull_case: str | None = None
    bear_case: str | None = None
    contradictions: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    generated_at: str


class BullBearAnalysis(BaseModel):
    ticker: str
    bull_thesis: str
    bull_catalysts: list[str] = Field(default_factory=list)
    bear_thesis: str
    bear_risks: list[str] = Field(default_factory=list)
    falsification_conditions: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)


class ThesisEvaluation(BaseModel):
    thesis_id: str
    ticker: str
    status: str = Field(description="supports, contradicts, neutral")
    rationale: str
    supporting_evidence: list[str] = Field(default_factory=list)
    contradicting_evidence: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)


class CompanyComparison(BaseModel):
    ticker_a: str
    ticker_b: str
    summary: str
    metrics_comparison: dict[str, Any] = Field(default_factory=dict)
    strategic_advantages: dict[str, list[str]] = Field(default_factory=dict)
    citations: list[Citation] = Field(default_factory=list)


class WorkflowStatus(BaseModel):
    workflow_id: str
    status: str
    progress: float = 0.0
    current_step: str | None = None
    report: ResearchReport | None = None
    error: str | None = None
