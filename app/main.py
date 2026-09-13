import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.articles import router as articles_router
from app.api.v1.ingestion import router as ingestion_router
from app.core.config import get_settings
from app.core.database import init_db
from app.core.redis import get_redis_client

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    # Ensure local directory structures
    os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
    os.makedirs("./data", exist_ok=True)
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Native Investment Intelligence Terminal API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix=settings.API_V1_PREFIX)
app.include_router(articles_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "environment": settings.ENVIRONMENT, "project": settings.PROJECT_NAME}


@app.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket) -> None:
    await websocket.accept()
    redis = get_redis_client()
    pubsub = redis.pubsub()
    await pubsub.subscribe("terminal:events")

    try:
        async for message in pubsub.listen():
            if message and message.get("type") == "message":
                data = message.get("data")
                if data:
                    await websocket.send_text(str(data))
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        await pubsub.close()


static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def serve_index() -> FileResponse:
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return FileResponse(__file__)
