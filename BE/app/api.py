from fastapi import APIRouter, Depends

from app.auth.dependencies import require_current_user
from app.auth.router import router as auth_router
from app.health.firestore_router import router as firestore_health_router
from app.health.router import router as health_router


api_router = APIRouter()
protected_api_router = APIRouter(dependencies=[Depends(require_current_user)])

protected_api_router.include_router(auth_router)

api_router.include_router(health_router)
api_router.include_router(firestore_health_router)
api_router.include_router(protected_api_router)
