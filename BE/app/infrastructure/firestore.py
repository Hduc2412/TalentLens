import os
from functools import lru_cache

from google.cloud import firestore


class FirestoreConfigurationError(RuntimeError):
    """Raised when the Firestore connection is not configured."""


def _project_id() -> str:
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "").strip()
    if not project_id:
        raise FirestoreConfigurationError(
            "GOOGLE_CLOUD_PROJECT is required to connect to Firestore"
        )
    return project_id


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.AsyncClient:
    """Return one async Firestore client backed by Application Default Credentials."""
    return firestore.AsyncClient(
        project=_project_id(),
        database=os.getenv("FIRESTORE_DATABASE", "(default)"),
    )


async def ping_firestore() -> None:
    """Perform a read-only request to verify credentials and connectivity."""
    await (
        get_firestore_client()
        .collection("_peoplelens_health")
        .limit(1)
        .get()
    )
