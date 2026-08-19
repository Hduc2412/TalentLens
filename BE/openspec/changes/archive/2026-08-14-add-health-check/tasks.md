## 1. Test setup and behavior contract

- [x] 1.1 Add a `dev` optional-dependency group to `pyproject.toml` with pytest `>=9.1.1,<10.0.0` and HTTPX2 `>=2.9.0,<3.0.0`.
- [x] 1.2 Add `tests/test_health.py` using FastAPI `TestClient` to assert that unauthenticated `GET /health` returns HTTP 200 and exact JSON `{"status": "ok"}`.

## 2. Health endpoint and router composition

- [x] 2.1 Add `app/health/router.py` with a minimal `APIRouter` and static `GET /health` liveness handler, without Service, Repository, authentication, or external-service calls.
- [x] 2.2 Replace the placeholder in `app/api.py` with an application router that includes the health router.
- [x] 2.3 Include the application router in `app/main.py` while preserving the existing FastAPI metadata.

## 3. Documentation and verification

- [x] 3.1 Update `README.md` with development dependency installation, the pytest command, and the liveness-only semantics of `/health`.
- [x] 3.2 Install the project with development extras under Python 3.13 and run pytest successfully without TestClient dependency deprecation warnings.
- [x] 3.3 Build and run the Docker image, then verify `GET /health` returns HTTP 200 and exact JSON `{"status": "ok"}` without external configuration.
- [x] 3.4 Verify the change adds no Firestore, GCS, JWT, Service, Repository, readiness, or Docker `HEALTHCHECK` behavior.
