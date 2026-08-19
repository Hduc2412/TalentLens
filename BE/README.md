# PeopleLens Backend

PeopleLens is a Python backend foundation built with FastAPI. The project uses a modular-monolith layout organized by feature.

## Requirements

- Python 3.13
- Docker (optional)

## Local setup

```bash
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The application is available on port `8000`.

## Development and tests

Install the project with its development dependencies and run the test suite:

```bash
python -m pip install -e ".[dev]"
pytest
```

## Health check

`GET /health` returns HTTP 200 with `{"status": "ok"}` when the application process is running. This endpoint is a liveness check only: it does not require authentication or check Firestore, Google Cloud Storage, JWT providers, or other external services.

## Authentication

PeopleLens does not handle user passwords. Clients authenticate with the external `mrag-user-be` service and send its RS256-signed access token to PeopleLens using:

```text
Authorization: Bearer <access-token>
```

PeopleLens reads only the bearer token from the `Authorization` header. Do not send the mrag refresh token to protected API routes.

`GET /auth/me` is the protected authentication smoke-test endpoint. It verifies the token signature with `MOSA_JWT_PUBLIC_KEY` and validates the mrag-user-be token contract: `RS256`, `exp`, `uid`, `client_id`, and `company_id`. It returns the authenticated `uid`, optional email, client ID, and company ID without returning the token or raw claims.

Authentication settings are read from environment variables:

```text
MOSA_ENVIRONMENT=development|test|staging|production
MOSA_JWT_PUBLIC_KEY=<PEM public key>
MOSA_JWT_ALLOWED_CLIENT_ID=<allowed mrag client_id>
MOSA_JWT_LEEWAY_SECONDS=30
```

Development and test environments may run without JWT settings so `/health` remains available. A protected endpoint returns `503` until authentication is configured. Production startup fails when the public key or allowed client ID is missing. The mrag-user-be contract does not provide `iss` or `aud`; the verifier therefore uses the signed `client_id` allowlist as the service binding and keeps the upstream `uid` claim unchanged.

## Docker

```bash
docker build -t peoplelens-be .
docker run --rm -p 8000:8000 peoplelens-be
```

## Project structure

```text
peoplelens-be/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── api.py
│   ├── core/
│   │   └── __init__.py
│   ├── infrastructure/
│   │   └── __init__.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   ├── router.py
│   │   └── schemas.py
│   ├── datasets/
│   │   └── __init__.py
│   ├── imports/
│   │   └── __init__.py
│   ├── organization/
│   │   └── __init__.py
│   ├── search/
│   │   └── __init__.py
│   ├── scoring/
│   │   └── __init__.py
│   ├── scenarios/
│   │   └── __init__.py
│   └── health/
│       ├── __init__.py
│       └── router.py
├── openspec/
│   ├── config.yaml
│   ├── specs/
│   └── changes/
├── tests/
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_health.py
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
└── pyproject.toml
```

The `openspec/` directory contains the current project specifications and archived change artifacts.

## Current scope

The current scope includes liveness and external JWT authentication. It does not connect to Firestore or Google Cloud Storage, manage user passwords, implement role/permission authorization, or add business Service and Repository layers. Those pieces will be introduced with the features that need them.
