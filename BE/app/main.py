from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import api_router
from app.auth.verifier import build_jwt_verifier
from app.core.config import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if settings.auth_configured:
        build_jwt_verifier(settings)
    yield


app = FastAPI(title="PeopleLens API", version="0.1.0", lifespan=lifespan)
app.include_router(api_router)
