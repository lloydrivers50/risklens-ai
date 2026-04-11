"""Shared in-memory task store (temporary — will be replaced by a database)."""

from server.features.extraction.models import TaskResponse

task_store: dict[str, TaskResponse] = {}
