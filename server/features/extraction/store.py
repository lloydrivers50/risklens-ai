"""S3-backed task store — shared across API and worker processes."""

import asyncio
import logging
from typing import Any

import boto3

from server.config import Settings
from server.features.extraction.models import TaskResponse

logger = logging.getLogger(__name__)


class TaskStore:
    """Persist task metadata as JSON objects in S3 under tasks/{task_id}.json."""

    def __init__(self, settings: Settings) -> None:
        self._bucket = settings.s3_bucket_name
        self._prefix = "tasks/"
        self._client: Any = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

    def _key(self, task_id: str) -> str:
        return f"{self._prefix}{task_id}.json"

    async def save(self, task: TaskResponse) -> None:
        """Write task metadata to S3."""
        key = self._key(task.id)
        body = task.model_dump_json()
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self._bucket,
            Key=key,
            Body=body.encode(),
            ContentType="application/json",
        )
        logger.debug("Saved task to S3: %s", key)

    async def get(self, task_id: str) -> TaskResponse | None:
        """Retrieve task metadata from S3. Returns None if not found."""
        key = self._key(task_id)
        try:
            response: dict[str, Any] = await asyncio.to_thread(
                self._client.get_object,
                Bucket=self._bucket,
                Key=key,
            )
            body: bytes = await asyncio.to_thread(response["Body"].read)
            return TaskResponse.model_validate_json(body)
        except self._client.exceptions.NoSuchKey:
            return None

    async def list_tasks(self, task_type: str | None = None) -> list[TaskResponse]:
        """List all tasks, optionally filtered by type."""
        response: dict[str, Any] = await asyncio.to_thread(
            self._client.list_objects_v2,
            Bucket=self._bucket,
            Prefix=self._prefix,
        )
        tasks: list[TaskResponse] = []
        for obj in response.get("Contents", []):
            obj_key: str = obj["Key"]
            if not obj_key.endswith(".json"):
                continue
            try:
                data: dict[str, Any] = await asyncio.to_thread(
                    self._client.get_object,
                    Bucket=self._bucket,
                    Key=obj_key,
                )
                body_bytes: bytes = await asyncio.to_thread(data["Body"].read)
                task = TaskResponse.model_validate_json(body_bytes)
                if task_type and task.type != task_type:
                    continue
                tasks.append(task)
            except Exception:
                logger.warning("Failed to load task from %s", obj_key, exc_info=True)

        return sorted(tasks, key=lambda t: t.created_at, reverse=True)
