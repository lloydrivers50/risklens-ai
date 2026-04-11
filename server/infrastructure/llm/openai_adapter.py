from typing import Any

from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from server.features.gateway.types import ModelConfig, TokenUsage
from server.infrastructure.llm.base_adapter import BaseLLMAdapter


class OpenAIAdapter(BaseLLMAdapter):
    async def _call_provider(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None,
    ) -> tuple[str, Any, TokenUsage]:
        llm = ChatOpenAI(
            model=model.model_name,
            temperature=model.temperature,
            max_tokens=model.max_tokens,
            api_key=self._api_key,
        )

        if output_schema is not None:
            structured_llm = llm.with_structured_output(output_schema)
            parsed = await structured_llm.ainvoke(prompt)
            content = parsed.model_dump_json() if isinstance(parsed, BaseModel) else str(parsed)

            return (
                content,
                parsed,
                TokenUsage(
                    input_tokens=len(prompt) // 4,
                    output_tokens=len(content) // 4,
                ),
            )

        response = await llm.ainvoke(prompt)
        content = str(response.content)

        usage_meta: dict[str, Any] = (
            dict(response.usage_metadata) if response.usage_metadata else {}
        )
        return (
            content,
            None,
            TokenUsage(
                input_tokens=int(usage_meta.get("input_tokens", 0)),
                output_tokens=int(usage_meta.get("output_tokens", 0)),
            ),
        )
