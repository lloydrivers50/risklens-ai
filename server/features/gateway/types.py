from enum import StrEnum
from typing import Any

from pydantic import BaseModel, computed_field


class ModelProvider(StrEnum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    LOCAL = "local"


class ModelConfig(BaseModel):
    provider: ModelProvider
    model_name: str
    temperature: float = 0.0
    max_tokens: int = 4096


class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


class LLMResponse(BaseModel):
    content: str
    parsed: Any = None
    model_config_used: ModelConfig
    token_usage: TokenUsage
    latency_ms: float
    cost_usd: float


# Cost per 1K tokens (input/output) — update as pricing changes
COST_PER_1K_TOKENS: dict[str, dict[str, float]] = {
    "claude-sonnet-4-20250514": {"input": 0.003, "output": 0.015},
    "claude-haiku-4-5-20251001": {"input": 0.0008, "output": 0.004},
    "gpt-4o": {"input": 0.0025, "output": 0.01},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
}


def calculate_cost(model_name: str, usage: TokenUsage) -> float:
    rates = COST_PER_1K_TOKENS.get(model_name)
    if not rates:
        return 0.0
    input_cost = (usage.input_tokens / 1000) * rates["input"]
    output_cost = (usage.output_tokens / 1000) * rates["output"]
    return round(input_cost + output_cost, 6)
