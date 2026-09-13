import hashlib
from typing import Any

import chromadb
from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from chromadb.config import Settings as ChromaSettings

from app.core.config import get_settings
from app.models.domain import InvestmentEvent

settings = get_settings()


class FastDeterministicEmbeddingFunction(EmbeddingFunction[Documents]):
    def __init__(self) -> None:
        pass

    @staticmethod
    def name() -> str:
        return "fast_deterministic"

    def get_config(self) -> dict[str, Any]:
        return {"name": "fast_deterministic"}

    @classmethod
    def build_from_config(cls, config: dict[str, Any]) -> "FastDeterministicEmbeddingFunction":
        return cls()

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            h = hashlib.sha256(text.encode("utf-8")).digest()
            raw = [float(b) / 255.0 for b in h] * 2
            norm = sum(x * x for x in raw) ** 0.5 or 1.0
            embeddings.append([x / norm for x in raw])
        return embeddings


def generate_deterministic_chunk_id(source: str, source_id: str, chunk_index: int = 0) -> str:
    key = f"{source}:{source_id}:{chunk_index}".encode()
    return hashlib.sha256(key).hexdigest()


class ChromaVectorStore:
    def __init__(self, persist_directory: str | None = None) -> None:
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.embedding_fn = FastDeterministicEmbeddingFunction()
        self.articles_collection = self.client.get_or_create_collection(
            name="iterminal_articles_v1",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.embedding_fn,
        )
        self.filings_collection = self.client.get_or_create_collection(
            name="iterminal_filings_v1",
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.embedding_fn,
        )

    def add_event(self, event: InvestmentEvent) -> str:
        primary_ticker = "NONE"
        if event.entities:
            for ent in event.entities:
                if ent.ticker:
                    primary_ticker = ent.ticker.upper()
                    break

        doc_id = generate_deterministic_chunk_id(
            source=event.source,
            source_id=event.source_id or event.content_hash,
            chunk_index=0,
        )

        metadata: dict[str, Any] = {
            "source": str(event.source),
            "source_id": str(event.source_id or event.content_hash),
            "url": str(event.url or ""),
            "published_at": str(event.published_at.isoformat() if event.published_at else ""),
            "ingested_at": str(event.ingested_at.isoformat()),
            "ticker": primary_ticker,
            "event_type": str(event.event_type.value),
            "chunk_index": 0,
        }

        document_text = f"{event.title}\n\n{event.body}"

        self.articles_collection.upsert(
            ids=[doc_id],
            documents=[document_text],
            metadatas=[metadata],
        )
        return doc_id

    def query_articles(
        self,
        query_text: str,
        top_k: int = 5,
        ticker: str | None = None,
        event_type: str | None = None,
    ) -> list[dict[str, Any]]:
        where_filter: dict[str, Any] | None = None
        conditions = []

        if ticker:
            conditions.append({"ticker": ticker.upper()})
        if event_type:
            conditions.append({"event_type": event_type.lower()})

        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}

        results = self.articles_collection.query(
            query_texts=[query_text],
            n_results=top_k,
            where=where_filter,
        )

        formatted = []
        if results and results["ids"] and len(results["ids"][0]) > 0:
            count = len(results["ids"][0])
            for i in range(count):
                formatted.append(
                    {
                        "id": results["ids"][0][i],
                        "document": results["documents"][0][i] if results["documents"] else "",
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i]
                        if results.get("distances")
                        else None,
                    }
                )
        return formatted


_vector_store: ChromaVectorStore | None = None


def get_vector_store() -> ChromaVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaVectorStore()
    return _vector_store
