import asyncio
from typing import Any

from redis.asyncio import Redis, from_url

from app.core.config import get_settings

settings = get_settings()


class InMemoryRedis:
    def __init__(self) -> None:
        self.store: dict[str, Any] = {}
        self.ttls: dict[str, float] = {}
        self.subscribers: dict[str, list[asyncio.Queue]] = {}

    async def get(self, name: str) -> str | None:
        return self.store.get(name)

    async def set(self, name: str, value: Any, ex: int | None = None) -> bool:
        self.store[name] = str(value)
        return True

    async def exists(self, *names: str) -> int:
        return sum(1 for name in names if name in self.store)

    async def incr(self, name: str) -> int:
        val = int(self.store.get(name, 0)) + 1
        self.store[name] = str(val)
        return val

    async def publish(self, channel: str, message: str) -> int:
        queues = self.subscribers.get(channel, [])
        for q in queues:
            await q.put(message)
        return len(queues)

    def pubsub(self) -> Any:
        parent = self

        class InMemoryPubSub:
            def __init__(self) -> None:
                self.channel_name: str | None = None
                self.queue: asyncio.Queue = asyncio.Queue()

            async def subscribe(self, channel: str) -> None:
                self.channel_name = channel
                if channel not in parent.subscribers:
                    parent.subscribers[channel] = []
                parent.subscribers[channel].append(self.queue)

            async def listen(self) -> Any:
                while True:
                    msg = await self.queue.get()
                    yield {"type": "message", "channel": self.channel_name, "data": msg}

            async def close(self) -> None:
                if self.channel_name and self.channel_name in parent.subscribers:
                    if self.queue in parent.subscribers[self.channel_name]:
                        parent.subscribers[self.channel_name].remove(self.queue)

        return InMemoryPubSub()

    async def close(self) -> None:
        pass


_redis_client: Redis | InMemoryRedis | None = None


def get_redis_client() -> Redis | InMemoryRedis:
    global _redis_client
    if _redis_client is None:
        if settings.REDIS_ENABLED:
            try:
                _redis_client = from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                _redis_client = InMemoryRedis()
        else:
            _redis_client = InMemoryRedis()
    return _redis_client
