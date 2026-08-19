from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.jwt import InvalidRSAPublicKeyError, load_rsa_public_key


Environment = Literal["development", "test", "staging", "production"]


class Settings(BaseSettings):
    environment: Environment = "development"
    jwt_public_key: str | None = None
    jwt_allowed_client_id: int | None = Field(default=None, ge=1)
    jwt_leeway_seconds: int = Field(default=30, ge=0, le=300)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="MOSA_",
        extra="ignore",
    )

    @model_validator(mode="after")
    def require_auth_in_production(self) -> "Settings":
        if self.environment == "production":
            missing = [
                name
                for name, value in (
                    ("MOSA_JWT_PUBLIC_KEY", self.jwt_public_key),
                    ("MOSA_JWT_ALLOWED_CLIENT_ID", self.jwt_allowed_client_id),
                )
                if value is None or (isinstance(value, str) and not value.strip())
            ]
            if missing:
                raise ValueError(
                    "Missing required production authentication settings: "
                    + ", ".join(missing)
                )

            try:
                load_rsa_public_key(
                    self.jwt_public_key.replace("\\n", "\n").strip()
                )
            except InvalidRSAPublicKeyError:
                raise ValueError(
                    "MOSA_JWT_PUBLIC_KEY must contain a valid RSA public PEM key"
                ) from None
        return self

    @property
    def auth_configured(self) -> bool:
        return bool(
            self.jwt_public_key
            and self.jwt_public_key.strip()
            and self.jwt_allowed_client_id is not None
        )

    @property
    def normalized_public_key(self) -> str | None:
        if self.jwt_public_key is None:
            return None
        return self.jwt_public_key.replace("\\n", "\n").strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
