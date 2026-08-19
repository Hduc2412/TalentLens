from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.auth.schemas import AuthPrincipal
from app.core.config import Settings
from app.core.jwt import InvalidRSAPublicKeyError, load_rsa_public_key


class AuthenticationConfigurationError(ValueError):
    """Raised when a JWT verifier cannot be built from application settings."""


class TokenVerificationError(ValueError):
    """Raised when a bearer token cannot be verified or mapped to a principal."""


@dataclass(frozen=True, slots=True)
class JWTVerifier:
    public_key: RSAPublicKey
    allowed_client_id: int
    leeway_seconds: int

    def verify(self, token: str) -> AuthPrincipal:
        try:
            claims: dict[str, Any] = jwt.decode(
                token,
                self.public_key,
                algorithms=["RS256"],
                leeway=self.leeway_seconds,
                options={"require": ["exp", "uid", "client_id", "company_id"]},
            )

            uid = claims.get("uid")
            client_id = claims.get("client_id")
            company_id = claims.get("company_id")
            email = claims.get("email")

            if (
                not isinstance(uid, str)
                or not uid.strip()
                or isinstance(client_id, bool)
                or not isinstance(client_id, int)
                or client_id < 1
                or isinstance(company_id, bool)
                or not isinstance(company_id, int)
                or company_id < 1
                or (email is not None and not isinstance(email, str))
                or client_id != self.allowed_client_id
            ):
                raise TokenVerificationError from None

            return AuthPrincipal(
                uid=uid,
                email=email,
                client_id=client_id,
                company_id=company_id,
            )
        except (
            InvalidTokenError,
            KeyError,
            TypeError,
            ValueError,
            ValidationError,
        ):
            raise TokenVerificationError from None


@lru_cache(maxsize=8)
def _build_jwt_verifier(
    public_key_pem: str,
    allowed_client_id: int,
    leeway_seconds: int,
) -> JWTVerifier:
    try:
        public_key = load_rsa_public_key(public_key_pem)
    except InvalidRSAPublicKeyError:
        raise AuthenticationConfigurationError from None

    return JWTVerifier(
        public_key=public_key,
        allowed_client_id=allowed_client_id,
        leeway_seconds=leeway_seconds,
    )


def build_jwt_verifier(settings: Settings) -> JWTVerifier:
    if not settings.auth_configured:
        raise AuthenticationConfigurationError

    public_key_pem = settings.normalized_public_key
    allowed_client_id = settings.jwt_allowed_client_id
    if public_key_pem is None or allowed_client_id is None:
        raise AuthenticationConfigurationError

    return _build_jwt_verifier(
        public_key_pem,
        allowed_client_id,
        settings.jwt_leeway_seconds,
    )
