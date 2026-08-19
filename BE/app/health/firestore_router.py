from fastapi import APIRouter, HTTPException, status
from google.api_core.exceptions import GoogleAPICallError
from google.auth.exceptions import DefaultCredentialsError

from app.infrastructure.firestore import (
    FirestoreConfigurationError,
    ping_firestore,
)

router = APIRouter()


@router.get("/health/firestore")
async def firestore_health() -> dict[str, str]:
    """Report whether Firestore configuration, credentials and network are ready."""
    try:
        await ping_firestore()
    except (FirestoreConfigurationError, DefaultCredentialsError, GoogleAPICallError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Firestore unavailable: {exc}",
        ) from exc

    return {"status": "ok", "service": "firestore"}
