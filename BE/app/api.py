from fastapi import APIRouter

from app.health.firestore_router import router as firestore_health_router
from app.health.router import router as health_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(firestore_health_router)
