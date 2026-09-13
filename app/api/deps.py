from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.processing.deduplicator import DeduplicationEngine
from app.rag.vectorstore import ChromaVectorStore, get_vector_store
from app.services.event_service import EventService

_shared_dedup_engine = DeduplicationEngine()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


def get_vector_store_dep() -> ChromaVectorStore:
    return get_vector_store()


def get_event_service(
    db: AsyncSession = Depends(get_db),
    vector_store: ChromaVectorStore = Depends(get_vector_store_dep),
) -> EventService:
    return EventService(
        db_session=db,
        dedup_engine=_shared_dedup_engine,
        vector_store=vector_store,
    )
