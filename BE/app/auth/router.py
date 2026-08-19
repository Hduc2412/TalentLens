from fastapi import APIRouter

from app.auth.dependencies import CurrentUser
from app.auth.schemas import AuthPrincipal


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=AuthPrincipal)
async def get_current_user(current_user: CurrentUser) -> AuthPrincipal:
    return current_user
