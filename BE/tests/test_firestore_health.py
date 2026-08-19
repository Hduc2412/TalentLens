from fastapi.testclient import TestClient

from app.health import firestore_router
from app.main import app

client = TestClient(app)


def test_firestore_health_returns_ok_when_ping_succeeds(monkeypatch) -> None:
    async def successful_ping() -> None:
        return None

    monkeypatch.setattr(firestore_router, "ping_firestore", successful_ping)

    response = client.get("/health/firestore")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "firestore"}


def test_firestore_health_returns_503_without_project(monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_CLOUD_PROJECT", raising=False)
    response = client.get("/health/firestore")
    assert response.status_code == 503
