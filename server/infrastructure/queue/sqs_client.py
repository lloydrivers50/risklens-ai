"""Thin async wrapper around boto3 SQS."""

import asyncio
import json
import logging
from typing import Any

import boto3

from server.config import Settings

logger = logging.getLogger(__name__)


class SQSClient:
    def __init__(self, settings: Settings) -> None:
        self._queue_url = settings.sqs_queue_url
        self._client: Any = boto3.client(
            "sqs",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

    async def send_task(
        self,
        task_id: str,
        s3_key: str,
        task_type: str,
        model_config: dict[str, str],
    ) -> None:
        """Send a task message to SQS."""
        message = {
            "task_id": task_id,
            "s3_key": s3_key,
            "task_type": task_type,
            "model_config": model_config,
        }
        logger.info("Sending task to SQS: task_id=%s", task_id)
        await asyncio.to_thread(
            self._client.send_message,
            QueueUrl=self._queue_url,
            MessageBody=json.dumps(message),
        )

    async def receive_tasks(
        self,
        max_messages: int = 1,
        wait_time: int = 20,
    ) -> list[dict[str, Any]]:
        """Long-poll SQS and return a list of message dicts."""
        response: dict[str, Any] = await asyncio.to_thread(
            self._client.receive_message,
            QueueUrl=self._queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=wait_time,
        )
        messages: list[dict[str, Any]] = response.get("Messages", [])
        return messages

    async def delete_message(self, receipt_handle: str) -> None:
        """Delete a processed message from SQS."""
        await asyncio.to_thread(
            self._client.delete_message,
            QueueUrl=self._queue_url,
            ReceiptHandle=receipt_handle,
        )
