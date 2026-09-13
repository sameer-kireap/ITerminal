import hashlib
import re
from datetime import UTC, datetime
from typing import Protocol

from app.models.domain import ConfirmationStatus, DeduplicationResult, InvestmentEvent


class DeduplicationStore(Protocol):
    async def exists_hash(self, content_hash: str) -> bool: ...
    async def add_hash(self, content_hash: str, event_id: str) -> None: ...
    async def find_simhash(self, simhash: int, max_distance: int = 4) -> tuple[str, int] | None: ...
    async def add_simhash(self, simhash: int, event_id: str) -> None: ...
    async def find_event_cluster(self, cluster_key: str) -> str | None: ...
    async def add_event_to_cluster(self, cluster_key: str, event_id: str) -> None: ...


class InMemoryDeduplicationStore:
    def __init__(self) -> None:
        self.exact_hashes: dict[str, str] = {}
        self.simhashes: list[tuple[int, str]] = []
        self.clusters: dict[str, list[str]] = {}

    async def exists_hash(self, content_hash: str) -> bool:
        return content_hash in self.exact_hashes

    async def add_hash(self, content_hash: str, event_id: str) -> None:
        self.exact_hashes[content_hash] = event_id

    async def find_simhash(self, simhash: int, max_distance: int = 4) -> tuple[str, int] | None:
        for stored_hash, event_id in self.simhashes:
            dist = hamming_distance_64(simhash, stored_hash)
            if dist <= max_distance:
                return event_id, dist
        return None

    async def add_simhash(self, simhash: int, event_id: str) -> None:
        self.simhashes.append((simhash, event_id))

    async def find_event_cluster(self, cluster_key: str) -> str | None:
        cluster = self.clusters.get(cluster_key)
        return cluster[0] if cluster else None

    async def add_event_to_cluster(self, cluster_key: str, event_id: str) -> None:
        if cluster_key not in self.clusters:
            self.clusters[cluster_key] = []
        self.clusters[cluster_key].append(event_id)


def compute_content_hash(title: str, body: str) -> str:
    normalized = f"{title.strip().lower()}\n{body.strip().lower()}".encode()
    return hashlib.sha256(normalized).hexdigest()


def compute_simhash_64(text: str) -> int:
    tokens = re.findall(r"\w+", text.lower())
    if not tokens:
        return 0

    v = [0] * 64
    for token in tokens:
        token_bytes = token.encode("utf-8")
        h = int(hashlib.md5(token_bytes).hexdigest()[:16], 16)
        for i in range(64):
            bit = (h >> i) & 1
            v[i] += 1 if bit else -1

    fingerprint = 0
    for i in range(64):
        if v[i] > 0:
            fingerprint |= 1 << i
    return fingerprint


def hamming_distance_64(hash1: int, hash2: int) -> int:
    x = hash1 ^ hash2
    distance = 0
    while x:
        distance += 1
        x &= x - 1
    return distance


class DeduplicationEngine:
    def __init__(self, store: DeduplicationStore | None = None) -> None:
        self.store = store or InMemoryDeduplicationStore()

    async def process(self, event: InvestmentEvent) -> DeduplicationResult:
        # Level 1: Exact SHA-256 Hash
        if await self.store.exists_hash(event.content_hash):
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_type="exact",
                matched_event_id=None,
                similarity_score=1.0,
                event=event,
            )

        # Level 2: Near-Duplicate SimHash (Hamming Distance <= 4)
        combined_text = f"{event.title} {event.body}"
        simhash_val = compute_simhash_64(combined_text)
        simhash_match = await self.store.find_simhash(simhash_val, max_distance=4)
        if simhash_match:
            matched_id, dist = simhash_match
            sim_score = round(1.0 - (dist / 64.0), 4)
            return DeduplicationResult(
                is_duplicate=True,
                duplicate_type="near_simhash",
                matched_event_id=matched_id,
                similarity_score=sim_score,
                event=event,
            )

        # Level 3: Event Clustering
        primary_entity = (
            event.entities[0].ticker
            if event.entities and event.entities[0].ticker
            else (event.entities[0].name if event.entities else "MARKET")
        )
        pub_date = event.published_at or event.ingested_at or datetime.now(UTC)
        date_bucket = pub_date.strftime("%Y-%m-%d")
        cluster_key = f"{primary_entity.upper()}:{event.event_type.value}:{date_bucket}"

        existing_cluster_parent = await self.store.find_event_cluster(cluster_key)
        if existing_cluster_parent:
            event.status = ConfirmationStatus.CORROBORATED
            await self.store.add_hash(event.content_hash, event.id)
            await self.store.add_simhash(simhash_val, event.id)
            await self.store.add_event_to_cluster(cluster_key, event.id)
            return DeduplicationResult(
                is_duplicate=False,
                duplicate_type="cluster_existing",
                matched_event_id=existing_cluster_parent,
                similarity_score=0.85,
                event=event,
            )

        # Unique New Event
        await self.store.add_hash(event.content_hash, event.id)
        await self.store.add_simhash(simhash_val, event.id)
        await self.store.add_event_to_cluster(cluster_key, event.id)

        return DeduplicationResult(
            is_duplicate=False,
            duplicate_type=None,
            matched_event_id=None,
            similarity_score=None,
            event=event,
        )
