import logging
import time
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel

from server.features.gateway.types import (
    LLMResponse,
    ModelConfig,
    TokenUsage,
    calculate_cost,
)

logger = logging.getLogger(__name__)


class BaseLLMAdapter(ABC):
    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    async def complete(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None = None,
    ) -> LLMResponse:
        start = time.perf_counter()

        content, parsed, token_usage = await self._call_provider(
            prompt, model, output_schema
        )

        latency_ms = (time.perf_counter() - start) * 1000
        cost_usd = calculate_cost(model.model_name, token_usage)

        logger.info(
            "LLM call: model=%s latency=%.0fms tokens=%d cost=$%.4f",
            model.model_name,
            latency_ms,
            token_usage.total_tokens,
            cost_usd,
        )

        return LLMResponse(
            content=content,
            parsed=parsed,
            model_config_used=model,
            token_usage=token_usage,
            latency_ms=round(latency_ms, 1),
            cost_usd=cost_usd,
        )

    @abstractmethod
    async def _call_provider(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None,
    ) -> tuple[str, Any, TokenUsage]:
        """Returns (content, parsed_or_none, token_usage)."""
        ...
