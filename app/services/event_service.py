import json
import uuid
from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import get_redis_client
from app.models.domain import DeduplicationResult, InvestmentEvent
from app.models.tables import (
    ArticleTable,
    CompanyTable,
    EventTable,
    article_entities,
    event_articles,
)
from app.processing.deduplicator import DeduplicationEngine
from app.rag.vectorstore import ChromaVectorStore, get_vector_store


class EventService:
    def __init__(
        self,
        db_session: AsyncSession,
        dedup_engine: DeduplicationEngine | None = None,
        vector_store: ChromaVectorStore | None = None,
    ) -> None:
        self.db = db_session
        self.dedup = dedup_engine or DeduplicationEngine()
        self.vector_store = vector_store or get_vector_store()
        self.redis = get_redis_client()

    async def ingest_event(
        self, event: InvestmentEvent
    ) -> tuple[InvestmentEvent, DeduplicationResult]:
        # Step 0: Persistent DB Check (Idempotency against restarts)
        existing_stmt = select(ArticleTable.id).where(
            ArticleTable.content_hash == event.content_hash
        )
        existing_res = await self.db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            return event, DeduplicationResult(
                is_duplicate=True,
                duplicate_type="exact",
                similarity_score=1.0,
                event=event,
            )

        # Step 1: In-Memory / Redis Multi-layer Deduplication
        dedup_result = await self.dedup.process(event)
        if dedup_result.is_duplicate:
            return event, dedup_result

        # Step 2: Persist in Relational DB
        article_row = ArticleTable(
            id=event.id,
            source=event.source,
            source_id=event.source_id,
            url=event.url,
            content_hash=event.content_hash,
            title=event.title,
            body=event.body,
            summary=event.summary,
            event_type=event.event_type.value,
            importance_score=event.importance_score,
            source_reliability=event.reliability.value,
            published_at=event.published_at,
            ingested_at=event.ingested_at,
            processed_at=event.processed_at or datetime.now(UTC),
            raw_payload=event.raw_payload,
        )
        self.db.add(article_row)

        # Entity links
        primary_company_id: str | None = None
        for ent in event.entities:
            if ent.ticker:
                comp_stmt = select(CompanyTable).where(CompanyTable.ticker == ent.ticker)
                comp_res = await self.db.execute(comp_stmt)
                comp_row = comp_res.scalar_one_or_none()

                if not comp_row:
                    comp_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"company:{ent.ticker}"))
                    comp_row = CompanyTable(
                        id=comp_id,
                        name=ent.name,
                        ticker=ent.ticker,
                        cik=ent.cik,
                    )
                    self.db.add(comp_row)
                    await self.db.flush()

                if not primary_company_id:
                    primary_company_id = comp_row.id

                # Link article to company
                await self.db.execute(
                    article_entities.insert().values(
                        article_id=article_row.id,
                        company_id=comp_row.id,
                        entity_type=ent.type,
                        confidence=ent.confidence,
                    )
                )

        # Event link or new cluster
        if dedup_result.matched_event_id:
            event_id = dedup_result.matched_event_id
            await self.db.execute(
                event_articles.insert().values(
                    event_id=event_id,
                    article_id=article_row.id,
                    relationship="corroborating",
                )
            )
        else:
            new_event_id = str(uuid.uuid4())
            event_row = EventTable(
                id=new_event_id,
                event_type=event.event_type.value,
                primary_company_id=primary_company_id,
                status=event.status.value,
                importance_score=event.importance_score,
                title=event.title,
                summary=event.summary,
                first_detected_at=event.ingested_at,
                last_updated_at=datetime.now(UTC),
            )
            self.db.add(event_row)
            await self.db.flush()

            await self.db.execute(
                event_articles.insert().values(
                    event_id=new_event_id,
                    article_id=article_row.id,
                    relationship="primary_source",
                )
            )

        await self.db.commit()

        # Step 3: Index in ChromaDB
        self.vector_store.add_event(event)

        # Step 4: Publish to Redis Pub/Sub for Live WebSocket Clients
        payload_str = json.dumps(
            {
                "id": event.id,
                "source": event.source,
                "title": event.title,
                "body": event.body,
                "url": event.url,
                "published_at": event.published_at.isoformat() if event.published_at else None,
                "ingested_at": event.ingested_at.isoformat(),
                "event_type": event.event_type.value,
                "reliability": event.reliability.value,
                "status": event.status.value,
                "entities": [ent.model_dump() for ent in event.entities],
                "content_hash": event.content_hash,
                "is_duplicate": False,
            }
        )
        await self.redis.publish("terminal:events", payload_str)

        return event, dedup_result

    async def list_articles(
        self,
        limit: int = 50,
        ticker: str | None = None,
        event_type: str | None = None,
    ) -> list[ArticleTable]:
        stmt = (
            select(ArticleTable)
            .options(selectinload(ArticleTable.companies))
            .order_by(desc(ArticleTable.ingested_at))
            .limit(limit)
        )
        if event_type:
            stmt = stmt.where(ArticleTable.event_type == event_type.lower())
        if ticker:
            stmt = stmt.join(ArticleTable.companies).where(CompanyTable.ticker == ticker.upper())

        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_companies(self) -> list[CompanyTable]:
        stmt = select(CompanyTable).order_by(CompanyTable.ticker)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())
