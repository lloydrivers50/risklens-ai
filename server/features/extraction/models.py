"""Pydantic models for extraction task responses."""

from typing import Any

from pydantic import BaseModel


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
