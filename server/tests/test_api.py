from unittest.mock import MagicMock

from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient, mock_gateway: MagicMock) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "0.1.0"
    assert "providers" in data


def test_playground_returns_200(client: TestClient) -> None:
    payload = {
        "prompt": "Summarise this document",
        "model": "claude-sonnet-4-20250514",
        "provider": "anthropic",
        "task_type": "summarisation",
    }
    response = client.post("/api/v1/playground", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "result" in data
    assert "latency_ms" in data
    assert "token_usage" in data
    assert "cost_usd" in data


def test_playground_invalid_provider_returns_422(client: TestClient) -> None:
    payload = {
        "prompt": "Hello",
        "model": "some-model",
        "provider": "not_a_real_provider",
        "task_type": "extraction",
    }
    response = client.post("/api/v1/playground", json=payload)
    assert response.status_code == 422
