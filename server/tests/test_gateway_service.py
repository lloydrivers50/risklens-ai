from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from server.config import Settings
from server.features.gateway.types import (
    LLMResponse,
    ModelConfig,
    ModelProvider,
    TokenUsage,
)


def _make_settings(
    anthropic_key: str | None = None,
    openai_key: str | None = None,
) -> Settings:
    return Settings(
        anthropic_api_key=anthropic_key,
        openai_api_key=openai_key,
        _env_file=None,
    )


def _canned_response(provider: ModelProvider = ModelProvider.ANTHROPIC) -> LLMResponse:
    return LLMResponse(
        content="ok",
        parsed=None,
        model_config_used=ModelConfig(provider=provider, model_name="test-model"),
        token_usage=TokenUsage(input_tokens=5, output_tokens=5),
        latency_ms=10.0,
        cost_usd=0.0,
    )


@patch("server.features.gateway.service.AnthropicAdapter")
@patch("server.features.gateway.service.OpenAIAdapter")
def test_no_keys_empty_providers(
    mock_openai_cls: MagicMock,
    mock_anthropic_cls: MagicMock,
) -> None:
    from server.features.gateway.service import GatewayService

    gw = GatewayService(_make_settings())
    assert gw.available_providers() == []


@patch("server.features.gateway.service.AnthropicAdapter")
@patch("server.features.gateway.service.OpenAIAdapter")
def test_anthropic_key_registers_anthropic(
    mock_openai_cls: MagicMock,
    mock_anthropic_cls: MagicMock,
) -> None:
    from server.features.gateway.service import GatewayService

    gw = GatewayService(_make_settings(anthropic_key="fake-key"))
    assert ModelProvider.ANTHROPIC in gw.available_providers()
    assert ModelProvider.OPENAI not in gw.available_providers()


@patch("server.features.gateway.service.AnthropicAdapter")
@patch("server.features.gateway.service.OpenAIAdapter")
def test_both_keys_registers_both(
    mock_openai_cls: MagicMock,
    mock_anthropic_cls: MagicMock,
) -> None:
    from server.features.gateway.service import GatewayService

    gw = GatewayService(_make_settings(anthropic_key="a-key", openai_key="o-key"))
    providers = gw.available_providers()
    assert ModelProvider.ANTHROPIC in providers
    assert ModelProvider.OPENAI in providers


@patch("server.features.gateway.service.AnthropicAdapter")
@patch("server.features.gateway.service.OpenAIAdapter")
async def test_complete_raises_for_unregistered_provider(
    mock_openai_cls: MagicMock,
    mock_anthropic_cls: MagicMock,
) -> None:
    from server.features.gateway.service import GatewayService

    gw = GatewayService(_make_settings())
    model = ModelConfig(provider=ModelProvider.ANTHROPIC, model_name="test")
    with pytest.raises(ValueError, match="No adapter for provider"):
        await gw.complete("hello", model)


@patch("server.features.gateway.service.AnthropicAdapter")
@patch("server.features.gateway.service.OpenAIAdapter")
async def test_complete_delegates_to_correct_adapter(
    mock_openai_cls: MagicMock,
    mock_anthropic_cls: MagicMock,
) -> None:
    from server.features.gateway.service import GatewayService

    expected = _canned_response()
    mock_adapter = MagicMock()
    mock_adapter.complete = AsyncMock(return_value=expected)
    mock_anthropic_cls.return_value = mock_adapter

    gw = GatewayService(_make_settings(anthropic_key="fake-key"))
    model = ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
    )
    result = await gw.complete("test prompt", model)

    mock_adapter.complete.assert_awaited_once_with("test prompt", model, None)
    assert result.content == "ok"
