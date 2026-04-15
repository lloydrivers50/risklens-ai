"""SQS worker — consumes extraction tasks from the queue."""

import asyncio
import io
import json
import logging
from datetime import datetime, timezone
from typing import Any

import pdfplumber

from server.config import Settings, get_settings
from server.features.extraction.models import TaskResponse, TaskTokenUsage
from server.features.extraction.service import ExtractionService
from server.features.extraction.store import TaskStore
from server.features.gateway.service import GatewayService
from server.features.gateway.types import ModelConfig, ModelProvider
from server.infrastructure.queue.sqs_client import SQSClient
from server.infrastructure.storage.s3_client import S3Client

logger = logging.getLogger(__name__)


def _extract_text_from_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages: list[str] = []
        for page in pdf.pages:
            text: str | None = page.extract_text()
            if text:
                pages.append(text)
    if not pages:
        raise ValueError("Could not extract text from PDF")
    return "\n\n".join(pages)


async def process_task(
    task_msg: dict[str, Any],
    s3: S3Client,
    extraction: ExtractionService,
    store: TaskStore,
) -> None:
    """Download PDF from S3, run extraction, and update the task in S3."""
    body: dict[str, Any] = json.loads(task_msg["Body"])
    task_id: str = body["task_id"]
    s3_key: str = body["s3_key"]
    model_cfg: dict[str, str] = body["model_config"]
    task_type: str = body.get("task_type", "extraction")

    task = await store.get(task_id)
    if task is None:
        # Task may have been created by the API but S3 is eventually consistent.
        # Build the task from the SQS message so we can still process it.
        logger.warning("Task not in store, creating from SQS message: task_id=%s", task_id)
        task = TaskResponse(
            id=task_id,
            type=task_type,
            status="pending",
            model=model_cfg["model_name"],
            provider=model_cfg["provider"],
            document_name=s3_key.split("/")[-1],
            created_at=datetime.now(timezone.utc).isoformat(),
        )

    if task.status not in ("pending", "processing"):
        logger.info("Task already handled, skipping: task_id=%s status=%s", task_id, task.status)
        return

    task = task.model_copy(update={"status": "processing"})
    await store.save(task)

    try:
        pdf_bytes = await s3.download_document(s3_key)
        document_text = await asyncio.to_thread(_extract_text_from_bytes, pdf_bytes)

        model_config = ModelConfig(
            provider=ModelProvider(model_cfg["provider"]),
            model_name=model_cfg["model_name"],
        )
        result, llm_response = await extraction.extract(document_text, model_config)

        task = task.model_copy(
            update={
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
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
        await store.save(task)
        logger.info("Task completed: task_id=%s", task_id)

    except Exception as exc:
        logger.exception("Task failed: task_id=%s", task_id)
        task = task.model_copy(
            update={
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(exc),
            }
        )
        await store.save(task)
        raise


async def worker_loop(settings: Settings) -> None:
    """Long-poll SQS and process extraction tasks indefinitely."""
    s3 = S3Client(settings)
    sqs = SQSClient(settings)
    gateway = GatewayService(settings)
    extraction = ExtractionService(gateway)
    store = TaskStore(settings)

    logger.info("Worker started — polling SQS")

    while True:
        messages = await sqs.receive_tasks(max_messages=1, wait_time=20)
        for msg in messages:
            receipt_handle: str = msg["ReceiptHandle"]
            try:
                await process_task(msg, s3, extraction, store)
                await sqs.delete_message(receipt_handle)
            except Exception:
                logger.exception("Message processing failed, leaving on queue")


if __name__ == "__main__":
    settings = get_settings()
    logging.basicConfig(level=settings.log_level)
    asyncio.run(worker_loop(settings))
