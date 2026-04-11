"""Thin async wrapper around boto3 S3."""

import asyncio
import logging
from typing import Any

import boto3

from server.config import Settings

logger = logging.getLogger(__name__)


class S3Client:
    def __init__(self, settings: Settings) -> None:
        self._bucket = settings.s3_bucket_name
        self._client: Any = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

    async def upload_document(
        self,
        file_content: bytes,
        key: str,
        content_type: str = "application/pdf",
    ) -> str:
        """Upload bytes to S3 and return the object key."""
        logger.info("Uploading document to S3: %s", key)
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self._bucket,
            Key=key,
            Body=file_content,
            ContentType=content_type,
        )
        return key

    async def download_document(self, key: str) -> bytes:
        """Download an object from S3 and return its bytes."""
        logger.info("Downloading document from S3: %s", key)
        response: dict[str, Any] = await asyncio.to_thread(
            self._client.get_object,
            Bucket=self._bucket,
            Key=key,
        )
        body: bytes = await asyncio.to_thread(response["Body"].read)
        return body
