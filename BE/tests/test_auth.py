from datetime import datetime, timedelta, timezone

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.auth.dependencies import get_settings
from app.core.config import Settings
from app.main import app


ISSUER = "https://issuer.example.test"
AUDIENCE = "peoplelens-api"


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
        jwt_issuer=ISSUER,
        jwt_audience=AUDIENCE,
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
        "sub": "user-123",
        "email": "user@example.com",
        "iss": ISSUER,
        "aud": AUDIENCE,
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
        "sub": "user-123",
        "email": "user@example.com",
        "issuer": ISSUER,
    }


def test_auth_me_rejects_missing_token() -> None:
    response = TestClient(app).get("/auth/me")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "claims",
    [
        {"exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        {"iss": "https://wrong-issuer.example.test"},
        {"aud": "wrong-audience"},
        {"sub": None},
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
        jwt_issuer=ISSUER,
        jwt_audience=AUDIENCE,
    )

    response = TestClient(app).get("/auth/me")

    assert response.status_code == 503
    assert response.json() == {"detail": "Authentication is not configured"}


def test_production_settings_require_auth_configuration() -> None:
    with pytest.raises(ValidationError):
        Settings(environment="production")


def test_health_is_public_without_auth_configuration() -> None:
    app.dependency_overrides[get_settings] = lambda: Settings(environment="development")

    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
