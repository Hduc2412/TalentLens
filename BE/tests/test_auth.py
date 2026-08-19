import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.auth.dependencies import get_settings
from app.core.config import Settings
from app.main import app


CLIENT_ID = 2093
COMPANY_ID = 3831


@pytest.fixture(autouse=True)
def isolate_mosa_environment(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    for name in tuple(os.environ):
        if name == "MOSA_ENVIRONMENT" or name.startswith("MOSA_JWT_"):
            monkeypatch.delenv(name)

    # Settings reads a relative .env file, so run each test away from any
    # developer-local configuration as well as clearing process variables.
    monkeypatch.chdir(tmp_path)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def rsa_keys() -> tuple[bytes, bytes]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


@pytest.fixture
def configured_settings(rsa_keys: tuple[bytes, bytes]) -> Settings:
    _, public_pem = rsa_keys
    return Settings(
        environment="test",
        jwt_public_key=public_pem.decode(),
        jwt_allowed_client_id=CLIENT_ID,
    )


@pytest.fixture(autouse=True)
def override_settings(configured_settings: Settings):
    app.dependency_overrides[get_settings] = lambda: configured_settings
    yield
    app.dependency_overrides.clear()


def make_token(private_pem: bytes, **claims: object) -> str:
    return jwt.encode(claims, private_pem, algorithm="RS256")


def valid_claims(**overrides: object) -> dict[str, object]:
    claims: dict[str, object] = {
        "uid": "user-123",
        "email": "user@example.com",
        "client_id": CLIENT_ID,
        "company_id": COMPANY_ID,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    claims.update(overrides)
    return claims


def test_auth_me_returns_principal_for_valid_token(
    rsa_keys: tuple[bytes, bytes],
) -> None:
    private_pem, _ = rsa_keys
    token = make_token(private_pem, **valid_claims())

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "uid": "user-123",
        "email": "user@example.com",
        "client_id": CLIENT_ID,
        "company_id": COMPANY_ID,
    }


def test_auth_me_accepts_literal_escaped_pem_from_environment(
    monkeypatch: pytest.MonkeyPatch,
    rsa_keys: tuple[bytes, bytes],
) -> None:
    private_pem, public_pem = rsa_keys
    monkeypatch.setenv("MOSA_ENVIRONMENT", "production")
    monkeypatch.setenv(
        "MOSA_JWT_PUBLIC_KEY",
        public_pem.decode().replace("\n", "\\n"),
    )
    monkeypatch.setenv("MOSA_JWT_ALLOWED_CLIENT_ID", str(CLIENT_ID))
    get_settings.cache_clear()
    app.dependency_overrides.clear()
    token = make_token(private_pem, **valid_claims())

    with TestClient(app) as client:
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "uid": "user-123",
        "email": "user@example.com",
        "client_id": CLIENT_ID,
        "company_id": COMPANY_ID,
    }


def test_auth_me_rejects_missing_token() -> None:
    response = TestClient(app).get("/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_auth_me_does_not_accept_cookie_token(
    rsa_keys: tuple[bytes, bytes],
) -> None:
    private_pem, _ = rsa_keys
    token = make_token(private_pem, **valid_claims())

    response = TestClient(app).get(
        "/auth/me",
        cookies={"access-token": token},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "claims",
    [
        {"exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        {"client_id": CLIENT_ID + 1},
        {"company_id": COMPANY_ID + 1},
        {"uid": None},
    ],
)
def test_auth_me_rejects_invalid_claims(
    rsa_keys: tuple[bytes, bytes],
    claims: dict[str, object],
) -> None:
    private_pem, _ = rsa_keys
    token = make_token(private_pem, **valid_claims(**claims))

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


@pytest.mark.parametrize(
    "missing_claim", ["exp", "uid", "client_id", "company_id"]
)
def test_auth_me_rejects_missing_required_claim(
    rsa_keys: tuple[bytes, bytes],
    missing_claim: str,
) -> None:
    private_pem, _ = rsa_keys
    claims = valid_claims()
    claims.pop(missing_claim)
    token = make_token(private_pem, **claims)

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


@pytest.mark.parametrize("email", [123, [], {"value": "invalid"}])
def test_auth_me_rejects_malformed_email_claim(
    rsa_keys: tuple[bytes, bytes],
    email: object,
) -> None:
    private_pem, _ = rsa_keys
    token = make_token(private_pem, **valid_claims(email=email))

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_auth_me_rejects_non_rs256_token() -> None:
    token = jwt.encode(
        valid_claims(),
        "test-secret-with-at-least-32-bytes",
        algorithm="HS256",
    )

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_auth_me_rejects_malformed_token() -> None:
    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": "Bearer not-a-jwt"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_auth_me_rejects_token_with_wrong_signature(
) -> None:
    other_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    other_private_pem = other_private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    token = make_token(other_private_pem, **valid_claims())

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid authentication credentials"}


def test_auth_me_allows_small_clock_skew(
    rsa_keys: tuple[bytes, bytes],
) -> None:
    private_pem, _ = rsa_keys
    token = make_token(
        private_pem,
        **valid_claims(exp=datetime.now(timezone.utc) - timedelta(seconds=20)),
    )

    response = TestClient(app).get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


def test_auth_me_reports_missing_auth_configuration() -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(environment="development")

    response = TestClient(app).get("/auth/me")

    assert response.status_code == 503
    assert response.json() == {"detail": "Authentication is not configured"}


def test_auth_me_reports_invalid_public_key_configuration() -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(
        environment="test",
        jwt_public_key="not-a-pem-key",
        jwt_allowed_client_id=CLIENT_ID,
    )

    response = TestClient(app).get("/auth/me")

    assert response.status_code == 503
    assert response.json() == {"detail": "Authentication is not configured"}


def test_application_startup_fails_in_production_without_auth_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MOSA_ENVIRONMENT", "production")
    get_settings.cache_clear()
    app.dependency_overrides.clear()

    with pytest.raises(ValidationError, match="Missing required production"):
        with TestClient(app):
            pass


def test_application_startup_fails_in_production_with_invalid_rsa_pem(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MOSA_ENVIRONMENT", "production")
    monkeypatch.setenv("MOSA_JWT_PUBLIC_KEY", "not-a-pem-key")
    monkeypatch.setenv("MOSA_JWT_ALLOWED_CLIENT_ID", str(CLIENT_ID))
    get_settings.cache_clear()
    app.dependency_overrides.clear()

    with pytest.raises(ValidationError, match="valid RSA public PEM key"):
        with TestClient(app):
            pass


def test_health_is_public_without_auth_configuration() -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(environment="development")

    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
