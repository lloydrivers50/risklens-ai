"""
Gateway Service — single entry point for all LLM calls.

Feature code never imports adapters directly. It calls this service,
which routes to the correct provider based on ModelConfig.provider.
Centralises observability, error handling, and provider registration.
"""

import logging

from pydantic import BaseModel

from server.config import Settings
from server.features.gateway.types import LLMResponse, ModelConfig, ModelProvider
from server.infrastructure.llm.anthropic_adapter import AnthropicAdapter
from server.infrastructure.llm.base_adapter import BaseLLMAdapter
from server.infrastructure.llm.openai_adapter import OpenAIAdapter

logger = logging.getLogger(__name__)


class GatewayService:
    def __init__(self, settings: Settings) -> None:
        self._adapters: dict[ModelProvider, BaseLLMAdapter] = {}

        if settings.anthropic_api_key:
            self._adapters[ModelProvider.ANTHROPIC] = AnthropicAdapter(
                settings.anthropic_api_key
            )
            logger.info("Registered Anthropic adapter")

        if settings.openai_api_key:
            self._adapters[ModelProvider.OPENAI] = OpenAIAdapter(
                settings.openai_api_key
            )
            logger.info("Registered OpenAI adapter")

        if not self._adapters:
            logger.warning("No LLM providers configured — set API keys in .env")

    async def complete(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None = None,
    ) -> LLMResponse:
        adapter = self._adapters.get(model.provider)
        if adapter is None:
            available = [p.value for p in self._adapters]
            raise ValueError(
                f"No adapter for provider '{model.provider}'. "
                f"Available: {available}"
            )
        return await adapter.complete(prompt, model, output_schema)

    def available_providers(self) -> list[ModelProvider]:
        return list(self._adapters.keys())
