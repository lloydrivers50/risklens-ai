"""FastAPI router for document extraction endpoints."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile

from server.features.extraction.models import TaskResponse
from server.features.extraction.store import TaskStore
from server.features.gateway.types import ModelProvider
from server.infrastructure.queue.sqs_client import SQSClient
from server.infrastructure.storage.s3_client import S3Client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_s3_client(request: Request) -> S3Client:
    return request.app.state.s3_client  # type: ignore[no-any-return]


def _get_sqs_client(request: Request) -> SQSClient:
    return request.app.state.sqs_client  # type: ignore[no-any-return]


def _get_task_store(request: Request) -> TaskStore:
    return request.app.state.task_store  # type: ignore[no-any-return]


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
    """Upload a PDF, store it in S3, and queue an extraction task via SQS."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    resolved_provider = provider or ModelProvider.ANTHROPIC
    resolved_model = model_name or "claude-sonnet-4-20250514"

    task = TaskResponse(
        id=task_id,
        type="extraction",
        status="pending",
        model=resolved_model,
        provider=resolved_provider.value,
        document_name=file.filename,
        created_at=now,
    )

    store = _get_task_store(request)
    await store.save(task)

    try:
        file_content = await file.read()
        s3_key = f"documents/{task_id}.pdf"

        s3 = _get_s3_client(request)
        await s3.upload_document(file_content, s3_key)

        sqs = _get_sqs_client(request)
        await sqs.send_task(
            task_id=task_id,
            s3_key=s3_key,
            task_type="extraction",
            model_config={
                "provider": resolved_provider.value,
                "model_name": resolved_model,
            },
        )
        logger.info("Task queued: task_id=%s, s3_key=%s", task_id, s3_key)

    except Exception as exc:
        logger.exception("Failed to queue extraction task: task_id=%s", task_id)
        task = task.model_copy(
            update={
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(exc),
            }
        )
        await store.save(task)

    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(request: Request, task_id: str) -> TaskResponse:
    """Retrieve a task by ID."""
    store = _get_task_store(request)
    task = await store.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    request: Request,
    type: str | None = Query(default=None),  # noqa: A002
) -> list[TaskResponse]:
    """List all tasks, optionally filtered by type."""
    store = _get_task_store(request)
    return await store.list_tasks(task_type=type)
