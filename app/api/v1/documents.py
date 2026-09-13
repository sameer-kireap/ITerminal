from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.processing.document_parser import (
    CompareReportsRequest,
    DocumentAnalysisDTO,
    DocumentIntelligenceService,
    ReportComparisonDTO,
)

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentUploadRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content: str = Field(..., min_length=10)


@router.post("/analyze", response_model=DocumentAnalysisDTO)
async def analyze_document_endpoint(req: DocumentUploadRequest) -> DocumentAnalysisDTO:
    svc = DocumentIntelligenceService()
    return svc.analyze_document(title=req.title, text=req.content)


@router.post("/compare", response_model=ReportComparisonDTO)
async def compare_reports_endpoint(req: CompareReportsRequest) -> ReportComparisonDTO:
    svc = DocumentIntelligenceService()
    return svc.compare_reports(req)
