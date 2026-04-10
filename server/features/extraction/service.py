"""Extraction service — orchestrates LLM-based document field extraction."""

from server.features.extraction.prompts import build_extraction_prompt
from server.features.extraction.schemas import ExtractionResult
from server.features.gateway.service import GatewayService
from server.features.gateway.types import LLMResponse, ModelConfig, ModelProvider


DEFAULT_MODEL = ModelConfig(
    provider=ModelProvider.ANTHROPIC,
    model_name="claude-sonnet-4-20250514",
    temperature=0.0,
    max_tokens=4096,
)


class ExtractionService:
    def __init__(self, gateway: GatewayService) -> None:
        self._gateway = gateway

    async def extract(
        self,
        document_text: str,
        model: ModelConfig | None = None,
    ) -> tuple[ExtractionResult, LLMResponse]:
        """Extract structured insurance data from document text.

        Returns the parsed result and the raw LLM response (for metrics).
        """
        prompt = build_extraction_prompt(document_text)
        config = model or DEFAULT_MODEL
        response = await self._gateway.complete(prompt, config, output_schema=ExtractionResult)
        result = ExtractionResult.model_validate(response.parsed)
        return result, response
