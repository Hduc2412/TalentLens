## Why

PeopleLens can start, but operators and automated checks have no stable HTTP signal that the process is alive. A minimal health endpoint provides that signal while establishing the first tested feature-router integration without introducing business or infrastructure dependencies.

## What Changes

- Add an unauthenticated `GET /health` endpoint.
- Return HTTP 200 with the exact JSON body `{"status": "ok"}` while the application process is running.
- Wire the health feature router through the application-level API router into the FastAPI app.
- Add a focused endpoint test using FastAPI's `TestClient` and pytest.
- Add pytest and HTTPX2 as development-only dependencies.
- Keep the endpoint as a liveness check only; it will not contact Firestore, Google Cloud Storage, JWT providers, or other external systems.

## Capabilities

### New Capabilities

- `health-check`: Provides a stable, unauthenticated liveness endpoint for operators and automated probes.

### Modified Capabilities

None.

## Impact

- Adds health routing under `peoplelens-be/app/health/` and updates application router composition.
- Adds one public HTTP endpoint, `GET /health`, with no version prefix.
- Adds a health endpoint test under `peoplelens-be/tests/`.
- Extends `pyproject.toml` with development-only pytest and HTTPX2 dependencies; runtime dependencies and external integrations remain unchanged.
