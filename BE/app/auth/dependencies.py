from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.schemas import AuthPrincipal
from app.auth.verifier import (
    AuthenticationConfigurationError,
    JWTVerifier,
    TokenVerificationError,
    build_jwt_verifier,
)
from app.core.config import Settings, get_settings


bearer_scheme = HTTPBearer(auto_error=False)


def _authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _configuration_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Authentication is not configured",
    )


def get_jwt_verifier(
    settings: Annotated[Settings, Depends(get_settings)],
) -> JWTVerifier:
    try:
        return build_jwt_verifier(settings)
    except AuthenticationConfigurationError:
        raise _configuration_error() from None


def require_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Security(bearer_scheme),
    ],
    verifier: Annotated[JWTVerifier, Depends(get_jwt_verifier)],
) -> AuthPrincipal:
    if credentials is None:
        raise _authentication_error()

    try:
        return verifier.verify(credentials.credentials)
    except TokenVerificationError:
        raise _authentication_error() from None


CurrentUser = Annotated[AuthPrincipal, Depends(require_current_user)]
