from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.deps import get_event_service, get_vector_store_dep
from app.rag.vectorstore import ChromaVectorStore
from app.services.event_service import EventService

router = APIRouter(prefix="/articles", tags=["articles"])


class ArticleDTO(BaseModel):
    id: str
    source: str
    source_id: str | None
    url: str | None
    content_hash: str
    title: str
    body: str
    summary: str | None
    event_type: str
    importance_score: float | None
    source_reliability: str
    published_at: str | None
    ingested_at: str
    entities: list[dict[str, Any]] = []


class CompanyDTO(BaseModel):
    id: str
    name: str
    ticker: str | None
    cik: str | None


@router.get("", response_model=list[ArticleDTO])
async def list_articles_endpoint(
    limit: int = Query(default=50, ge=1, le=200),
    ticker: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    event_service: EventService = Depends(get_event_service),
) -> list[ArticleDTO]:
    rows = await event_service.list_articles(limit=limit, ticker=ticker, event_type=event_type)

    results = []
    for r in rows:
        ent_list = [{"name": c.name, "ticker": c.ticker, "cik": c.cik} for c in r.companies]
        results.append(
            ArticleDTO(
                id=r.id,
                source=r.source,
                source_id=r.source_id,
                url=r.url,
                content_hash=r.content_hash,
                title=r.title,
                body=r.body,
                summary=r.summary,
                event_type=r.event_type,
                importance_score=r.importance_score,
                source_reliability=r.source_reliability,
                published_at=r.published_at.isoformat() if r.published_at else None,
                ingested_at=r.ingested_at.isoformat() if r.ingested_at else "",
                entities=ent_list,
            )
        )
    return results


@router.get("/companies", response_model=list[CompanyDTO])
async def list_companies_endpoint(
    event_service: EventService = Depends(get_event_service),
) -> list[CompanyDTO]:
    comps = await event_service.get_companies()
    return [CompanyDTO(id=c.id, name=c.name, ticker=c.ticker, cik=c.cik) for c in comps]


@router.get("/search")
async def search_articles_endpoint(
    q: str = Query(..., min_length=2),
    top_k: int = Query(default=5, ge=1, le=20),
    ticker: str | None = Query(default=None),
    vector_store: ChromaVectorStore = Depends(get_vector_store_dep),
) -> dict[str, Any]:
    matches = vector_store.query_articles(query_text=q, top_k=top_k, ticker=ticker)
    return {
        "query": q,
        "count": len(matches),
        "results": matches,
    }
