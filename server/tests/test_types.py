from server.features.gateway.types import (
    COST_PER_1K_TOKENS,
    LLMResponse,
    ModelConfig,
    ModelProvider,
    TokenUsage,
    calculate_cost,
)


def test_model_config_creation() -> None:
    config = ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
    )
    assert config.provider == ModelProvider.ANTHROPIC
    assert config.model_name == "claude-sonnet-4-20250514"
    assert config.temperature == 0.0
    assert config.max_tokens == 4096


def test_model_config_serialization() -> None:
    config = ModelConfig(
        provider=ModelProvider.OPENAI,
        model_name="gpt-4o",
        temperature=0.7,
        max_tokens=2048,
    )
    data = config.model_dump()
    assert data["provider"] == "openai"
    assert data["temperature"] == 0.7


def test_model_provider_serializes_as_string() -> None:
    assert str(ModelProvider.ANTHROPIC) == "anthropic"
    assert str(ModelProvider.OPENAI) == "openai"
    assert str(ModelProvider.LOCAL) == "local"


def test_token_usage_total_tokens() -> None:
    usage = TokenUsage(input_tokens=100, output_tokens=50)
    assert usage.total_tokens == 150


def test_llm_response_creation() -> None:
    config = ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
    )
    usage = TokenUsage(input_tokens=10, output_tokens=20)
    response = LLMResponse(
        content="Hello",
        parsed=None,
        model_config_used=config,
        token_usage=usage,
        latency_ms=42.5,
        cost_usd=0.001,
    )
    assert response.content == "Hello"
    assert response.token_usage.total_tokens == 30
    assert response.cost_usd == 0.001


def test_calculate_cost_known_model() -> None:
    usage = TokenUsage(input_tokens=1000, output_tokens=1000)
    cost = calculate_cost("claude-sonnet-4-20250514", usage)
    rates = COST_PER_1K_TOKENS["claude-sonnet-4-20250514"]
    expected = rates["input"] + rates["output"]
    assert cost == round(expected, 6)


def test_calculate_cost_unknown_model() -> None:
    usage = TokenUsage(input_tokens=500, output_tokens=500)
    assert calculate_cost("nonexistent-model", usage) == 0.0
