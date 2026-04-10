"""FastAPI router for document extraction endpoints."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

import pdfplumber
from fastapi import APIRouter, HTTPException, Query, Request, UploadFile
from pydantic import BaseModel

from server.features.extraction.service import ExtractionService
from server.features.gateway.types import ModelConfig, ModelProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


# ---------------------------------------------------------------------------
# Response models (match frontend Task interface)
# ---------------------------------------------------------------------------


class TaskTokenUsage(BaseModel):
    input: int
    output: int
    total: int


class TaskResponse(BaseModel):
    id: str
    type: str
    status: str
    model: str
    provider: str
    document_name: str
    created_at: str
    completed_at: str | None = None
    latency_ms: float | None = None
    token_usage: TaskTokenUsage | None = None
    cost_usd: float | None = None
    result: dict[str, Any] | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# In-memory task store (replaced by DB/S3 later)
# ---------------------------------------------------------------------------

_task_store: dict[str, TaskResponse] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_extraction_service(request: Request) -> ExtractionService:
    return request.app.state.extraction_service  # type: ignore[no-any-return]


def _extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from an uploaded PDF using pdfplumber."""
    with pdfplumber.open(file.file) as pdf:  # type: ignore[arg-type]
        pages: list[str] = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
    if not pages:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")
    return "\n\n".join(pages)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post("/extract", response_model=TaskResponse)
async def extract_document(
    request: Request,
    file: UploadFile,
    model_name: str | None = Query(default=None),
    provider: ModelProvider | None = Query(default=None),
) -> TaskResponse:
    """Upload a PDF and extract structured insurance data."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    task = TaskResponse(
        id=task_id,
        type="extraction",
        status="processing",
        model=model_name or "claude-sonnet-4-20250514",
        provider=(provider or ModelProvider.ANTHROPIC).value,
        document_name=file.filename,
        created_at=now,
    )
    _task_store[task_id] = task

    try:
        document_text = _extract_text_from_pdf(file)

        model_config: ModelConfig | None = None
        if model_name or provider:
            model_config = ModelConfig(
                provider=provider or ModelProvider.ANTHROPIC,
                model_name=model_name or "claude-sonnet-4-20250514",
            )

        service = _get_extraction_service(request)
        result, llm_response = await service.extract(document_text, model_config)

        completed_at = datetime.now(timezone.utc).isoformat()
        task = task.model_copy(
            update={
                "status": "completed",
                "completed_at": completed_at,
                "latency_ms": llm_response.latency_ms,
                "token_usage": TaskTokenUsage(
                    input=llm_response.token_usage.input_tokens,
                    output=llm_response.token_usage.output_tokens,
                    total=llm_response.token_usage.total_tokens,
                ),
                "cost_usd": llm_response.cost_usd,
                "result": result.model_dump(),
            }
        )
        _task_store[task_id] = task

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Extraction failed for task %s", task_id)
        task = task.model_copy(
            update={
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(exc),
            }
        )
        _task_store[task_id] = task

    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str) -> TaskResponse:
    """Retrieve a task by ID."""
    task = _task_store.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    type: str | None = Query(default=None),  # noqa: A002
) -> list[TaskResponse]:
    """List all tasks, optionally filtered by type."""
    tasks = list(_task_store.values())
    if type:
        tasks = [t for t in tasks if t.type == type]
    return sorted(tasks, key=lambda t: t.created_at, reverse=True)
