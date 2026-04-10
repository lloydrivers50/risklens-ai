import logging
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from server.config import get_settings
from server.features.extraction.router import router as extraction_router
from server.features.extraction.service import ExtractionService
from server.features.gateway.service import GatewayService
from server.features.gateway.types import ModelConfig, ModelProvider, TokenUsage

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request / Response models (match the frontend contract)
# ---------------------------------------------------------------------------


class PlaygroundRequestBody(BaseModel):
    prompt: str
    model: str
    provider: ModelProvider
    task_type: str
    temperature: float = 0.0
    max_tokens: int = 4096


class PlaygroundResponseBody(BaseModel):
    id: str
    result: str
    model: str
    provider: ModelProvider
    latency_ms: float
    token_usage: TokenUsage
    cost_usd: float


class HealthResponse(BaseModel):
    status: str
    version: str
    providers: list[str]


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    app.state.gateway = GatewayService(settings)
    app.state.extraction_service = ExtractionService(app.state.gateway)
    logger.info(
        "RiskLens AI started — providers: %s",
        [p.value for p in app.state.gateway.available_providers()],
    )
    yield


def get_gateway(request: Request) -> GatewayService:
    return request.app.state.gateway  # type: ignore[no-any-return]


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="RiskLens AI",
    version="0.1.0",
    description="LLM-powered document processing for commercial insurance",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extraction_router)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/v1/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    gateway = get_gateway(request)
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        providers=[p.value for p in gateway.available_providers()],
    )


@app.post("/api/v1/playground", response_model=PlaygroundResponseBody)
async def playground(
    body: PlaygroundRequestBody,
    request: Request,
) -> PlaygroundResponseBody:
    gateway = get_gateway(request)
    model = ModelConfig(
        provider=body.provider,
        model_name=body.model,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
    )
    response = await gateway.complete(body.prompt, model)
    return PlaygroundResponseBody(
        id=str(uuid.uuid4()),
        result=response.content,
        model=response.model_config_used.model_name,
        provider=response.model_config_used.provider,
        latency_ms=response.latency_ms,
        token_usage=response.token_usage,
        cost_usd=response.cost_usd,
    )


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "server.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
