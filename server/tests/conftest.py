from collections.abc import Iterator
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from server.features.gateway.types import (
    LLMResponse,
    ModelConfig,
    ModelProvider,
    TokenUsage,
)
from server.main import app


def _canned_response() -> LLMResponse:
    return LLMResponse(
        content="Test response",
        parsed=None,
        model_config_used=ModelConfig(
            provider=ModelProvider.ANTHROPIC,
            model_name="claude-sonnet-4-20250514",
        ),
        token_usage=TokenUsage(input_tokens=10, output_tokens=20),
        latency_ms=100.0,
        cost_usd=0.0003,
    )


@pytest.fixture()
def mock_settings() -> MagicMock:
    settings = MagicMock()
    settings.anthropic_api_key = "fake-anthropic-key"
    settings.openai_api_key = "fake-openai-key"
    settings.app_env = "test"
    settings.log_level = "WARNING"
    return settings


@pytest.fixture()
def mock_gateway() -> MagicMock:
    gw = MagicMock()
    gw.complete = AsyncMock(return_value=_canned_response())
    gw.available_providers.return_value = [ModelProvider.ANTHROPIC]
    return gw


@pytest.fixture()
def client(mock_gateway: MagicMock) -> Iterator[TestClient]:
    with TestClient(app, raise_server_exceptions=False) as tc:
        app.state.gateway = mock_gateway
        app.state.task_store = MagicMock()
        yield tc
