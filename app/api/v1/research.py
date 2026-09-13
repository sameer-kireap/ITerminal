from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.processing.thesis_evaluator import ThesisEvaluator
from app.rag.retriever import GroundedAnswer, RAGRetriever
from app.workflows.client import WorkflowDispatcher, get_workflow_dispatcher
from app.workflows.models import (
    BullBearAnalysis,
    CompanyComparison,
    ResearchInput,
    ThesisEvaluation,
    WorkflowStatus,
)

router = APIRouter(prefix="/research", tags=["research"])


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="User research question")
    ticker: str | None = Field(default=None, description="Optional target company ticker")
    top_k: int = Field(default=5, ge=1, le=8)


class BullBearRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)


class CompareRequest(BaseModel):
    ticker_a: str = Field(..., min_length=1, max_length=16)
    ticker_b: str = Field(..., min_length=1, max_length=16)


class ThesisCreateRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)
    thesis_text: str = Field(..., min_length=5)


class ThesisDTO(BaseModel):
    id: str
    ticker: str
    thesis_text: str
    status: str
    last_evaluation: dict[str, Any] | None = None
    created_at: str


@router.post("/query", response_model=GroundedAnswer)
async def query_copilot(req: RAGQueryRequest) -> GroundedAnswer:
    retriever = RAGRetriever()
    return await retriever.answer_query(
        query=req.query,
        ticker=req.ticker,
        top_k=req.top_k,
    )


@router.post(
    "/deep-dive",
    response_model=dict[str, str],
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_deep_research(
    req: ResearchInput,
    dispatcher: WorkflowDispatcher = Depends(get_workflow_dispatcher),
) -> dict[str, str]:
    workflow_id = await dispatcher.start_research_workflow(req)
    return {
        "workflow_id": workflow_id,
        "status": "ACCEPTED",
        "message": f"Durable research workflow '{workflow_id}' queued.",
    }


@router.get("/tasks/{task_id}", response_model=WorkflowStatus)
async def get_research_task_status(
    task_id: str,
    dispatcher: WorkflowDispatcher = Depends(get_workflow_dispatcher),
) -> WorkflowStatus:
    wf_status = dispatcher.get_status(task_id)
    if not wf_status:
        raise HTTPException(status_code=404, detail=f"Research task '{task_id}' not found")
    return wf_status


@router.post("/bull-bear", response_model=BullBearAnalysis)
async def generate_bull_bear(
    req: BullBearRequest,
    dispatcher: WorkflowDispatcher = Depends(get_workflow_dispatcher),
) -> BullBearAnalysis:
    return await dispatcher.run_bull_bear(req.ticker)


@router.post("/compare", response_model=CompanyComparison)
async def compare_companies(
    req: CompareRequest,
    dispatcher: WorkflowDispatcher = Depends(get_workflow_dispatcher),
) -> CompanyComparison:
    return await dispatcher.run_compare(req.ticker_a, req.ticker_b)


@router.get("/theses", response_model=list[ThesisDTO])
async def list_theses_endpoint(
    ticker: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[ThesisDTO]:
    evaluator = ThesisEvaluator(db)
    rows = await evaluator.list_theses(ticker=ticker)
    return [
        ThesisDTO(
            id=r.id,
            ticker=r.ticker,
            thesis_text=r.thesis_text,
            status=r.status,
            last_evaluation=r.last_evaluation,
            created_at=r.created_at.isoformat(),
        )
        for r in rows
    ]


@router.post("/theses", response_model=ThesisDTO, status_code=status.HTTP_201_CREATED)
async def create_thesis_endpoint(
    req: ThesisCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> ThesisDTO:
    evaluator = ThesisEvaluator(db)
    row = await evaluator.create_thesis(ticker=req.ticker, thesis_text=req.thesis_text)
    return ThesisDTO(
        id=row.id,
        ticker=row.ticker,
        thesis_text=row.thesis_text,
        status=row.status,
        last_evaluation=row.last_evaluation,
        created_at=row.created_at.isoformat(),
    )


@router.post("/theses/{thesis_id}/evaluate", response_model=ThesisEvaluation)
async def evaluate_thesis_endpoint(
    thesis_id: str,
    db: AsyncSession = Depends(get_db),
) -> ThesisEvaluation:
    evaluator = ThesisEvaluator(db)
    try:
        return await evaluator.evaluate_thesis(thesis_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/theses/{thesis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thesis_endpoint(
    thesis_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    evaluator = ThesisEvaluator(db)
    success = await evaluator.delete_thesis(thesis_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Thesis '{thesis_id}' not found")
