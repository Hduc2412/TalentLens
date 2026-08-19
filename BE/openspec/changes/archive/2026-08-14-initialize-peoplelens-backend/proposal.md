## Why

PeopleLens currently has no application scaffold, dependency metadata, or runnable backend entrypoint. Establishing a small, explicit FastAPI foundation now gives future feature work a consistent modular-monolith structure without prematurely coupling the project to Firestore, GCS, JWT, or business logic.

## What Changes

- Create a new `peoplelens-be/` backend repository with a feature-oriented package layout.
- Add a minimal FastAPI application entrypoint and API wiring placeholders.
- Add Python packaging metadata using Python 3.13, setuptools, FastAPI, and Uvicorn standard dependencies.
- Add empty package markers for core, infrastructure, auth, datasets, imports, organization, search, scoring, scenarios, health, and tests.
- Add a minimal Dockerfile that runs the application with Uvicorn on port 8000.
- Add `.gitignore`, `.env.example`, and a concise English README with local and Docker run instructions.
- Initialize a new Git repository inside `peoplelens-be/`.
- Do not add endpoints, business features, Firestore, GCS, JWT integration, settings management, tests, lockfiles, or pre-created router/service/repository layers.

## Capabilities

### New Capabilities

- `project-bootstrap`: Provides a minimal installable and runnable PeopleLens FastAPI project foundation with a clear feature-oriented package structure.

### Modified Capabilities

None.

## Impact

- Adds the new backend repository under `/home/hieu-anh/Documents/people_lens/peoplelens-be/`.
- Defines the initial Python runtime and dependency constraints: Python `>=3.13,<3.14`, FastAPI `>=0.139.2,<0.140.0`, and Uvicorn `>=0.52.2,<0.53.0` with the `standard` extra.
- Adds a runnable ASGI application at `app.main:app` and Docker startup behavior on port 8000.
- No external cloud resources, authentication providers, database connections, or existing application APIs are affected.
