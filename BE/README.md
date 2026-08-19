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
│   │   └── __init__.py
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
├── tests/
│   ├── __init__.py
│   └── test_health.py
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
└── pyproject.toml
```

## Current scope

The current scope adds only the liveness route. It does not connect to Firestore or Google Cloud Storage, implement JWT validation, expose business endpoints, or add business Service and Repository layers. Those pieces will be introduced with the features that need them.
