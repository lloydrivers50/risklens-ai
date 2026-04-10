from typing import Protocol

from pydantic import BaseModel

from server.features.gateway.types import LLMResponse, ModelConfig


class LLMGateway(Protocol):
    async def complete(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None = None,
    ) -> LLMResponse: ...
