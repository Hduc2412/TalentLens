from pydantic import BaseModel


class AuthPrincipal(BaseModel):
    uid: str
    email: str | None = None
    client_id: int
    company_id: int
