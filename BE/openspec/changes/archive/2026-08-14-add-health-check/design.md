## Context

The current application creates `app.main:app` directly, while `app/api.py` and `app/health/` are placeholders. This change introduces the first feature route and therefore establishes the minimal router-composition pattern that later features can follow. See `proposal.md` for motivation and `specs/health-check/spec.md` for observable behavior.

## Goals / Non-Goals

**Goals:**

- Keep health behavior isolated in the existing health feature package.
- Establish simple composition from feature router → application API router → FastAPI app.
- Test the public behavior without starting an external server.
- Keep test dependencies separate from production runtime dependencies.

**Non-Goals:**

- Readiness checks for Firestore, GCS, JWT providers, or other dependencies.
- A Service or Repository layer for a static liveness response.
- Authentication, API versioning, metrics, build metadata, or diagnostic details in the response.
- Docker-level `HEALTHCHECK` configuration.

## Decisions

### Define the endpoint in a feature router

Add `app/health/router.py` with a FastAPI `APIRouter` and `GET /health`. This keeps the route owned by its feature package. Defining the route directly in `main.py` was rejected because it would bypass the feature-oriented structure.

### Compose routers through `app/api.py`

Replace the placeholder in `app/api.py` with an application-level `APIRouter`, include the health router there, and include the application router from `main.py`. This introduces only the composition needed now and does not create a custom dependency-injection layer.

### Return a static typed mapping

The handler will return `{"status": "ok"}` directly with an explicit return annotation. A dedicated Pydantic model, Service, and Repository are unnecessary because the endpoint has no input, persistence, or domain behavior.

### Treat `/health` as liveness only

The route will perform no network calls and require no credentials. Readiness has different failure semantics and can be introduced later as a separate capability if deployment requirements demand it.

### Use FastAPI TestClient with pytest and HTTPX2

Add `tests/test_health.py` using `fastapi.testclient.TestClient`, following FastAPI's documented synchronous testing pattern. Starlette's current `TestClient` prefers HTTPX2 and deprecates its HTTPX fallback, so add a `dev` optional-dependency group with pytest `>=9.1.1,<10.0.0` and HTTPX2 `>=2.9.0,<3.0.0`. Document `pip install -e ".[dev]"` and `pytest` in the README. Runtime dependencies remain unchanged.

## Risks / Trade-offs

- [Risk] Consumers may mistake liveness for dependency readiness. → Mitigation: keep the response intentionally minimal and document that no external systems are checked.
- [Risk] A public endpoint adds a small amount of observable surface area. → Mitigation: return no environment, version, host, or dependency details.
- [Risk] Router composition adds indirection to a tiny app. → Mitigation: keep it to one feature router and one application router, with no additional abstractions.

## Migration Plan

No data or infrastructure migration is required. Add the router and test dependencies, run the test suite, and verify `GET /health` returns the specified response. Rollback removes the health router inclusion, test, and development dependencies.

## Open Questions

None. Readiness probes and Docker healthcheck configuration remain separate future decisions.
