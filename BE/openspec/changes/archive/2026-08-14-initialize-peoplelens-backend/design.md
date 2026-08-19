## Context

The proposal creates a new `peoplelens-be/` repository inside the current workspace. The repository is empty apart from its OpenSpec metadata, so the design must establish only the smallest conventional Python application foundation. The requested flat `app/` layout is intentional and should remain easy to run directly from the repository.

## Goals / Non-Goals

**Goals:**

- Make the project installable with standard `pip` packaging and `pip install -e .`.
- Provide an importable application at `app.main:app` that starts on port 8000.
- Preserve a feature-oriented package layout without prebuilding unused layers.
- Keep local and Docker startup commands identical in application behavior.

**Non-Goals:**

- Implementing business endpoints, health behavior, or feature workflows.
- Connecting to Firestore, Google Cloud Storage, or an external JWT provider.
- Adding settings management, dependency injection frameworks, generic repositories, tests, lockfiles, Compose, or production hardening.

## Decisions

### Use Python 3.13

Python 3.13 is selected over 3.11 and 3.12 because it remains in the bugfix/maintenance phase, while 3.11 and 3.12 are in security-only support. The project constraint will be `>=3.13,<3.14` so patch releases remain available without silently moving to the next feature series.

### Use FastAPI with Uvicorn standard extras

FastAPI is the requested web framework and Uvicorn is the minimal ASGI server needed to run it. The runtime dependency set contains only FastAPI and `uvicorn[standard]`; Pydantic is not declared directly because no application code imports it yet and FastAPI already supplies it transitively.

### Use setuptools with PEP 621 metadata

The project will use a standard `[build-system]` table with `setuptools.build_meta` and a `[project]` table. This supports editable installation without introducing a project-specific dependency manager. Package discovery will include `app*` and exclude unrelated root packages such as `tests` from the installed application.

### Keep the flat `app/` package layout

The requested tree places `app/` beside `pyproject.toml`, so the implementation will use a flat layout rather than adding an unrequested `src/` directory. Each requested folder receives only `__init__.py`; Router → Service → Repository files are created later alongside the feature that needs them.

### Keep application wiring intentionally minimal

`main.py` will construct the FastAPI application with the project title and version. `api.py` will remain a placeholder module without routes or an empty router. This preserves the requested file shape while avoiding artificial abstractions before the first feature exists.

### Use a single-stage minimal Docker image

The Dockerfile will use the official `python:3.13-slim` image, install the package from `pyproject.toml`, expose port 8000, and run `uvicorn app.main:app --host 0.0.0.0 --port 8000`. It will not add reload mode, Compose, healthchecks, or multi-stage complexity at this stage.

### Initialize Git inside the nested repository

`git init` will run from `peoplelens-be/`, keeping the application repository boundary separate from the outer workspace that owns OpenSpec metadata.

## Risks / Trade-offs

- [Risk] Python 3.13 may not be installed on every developer machine. → Mitigation: document the exact supported range and use the same minor version in Docker.
- [Risk] Floating patch-level dependency resolution can produce different environments over time because no lockfile is created. → Mitigation: constrain FastAPI and Uvicorn to their current minor ranges; add a lockfile later when reproducible deployments become in scope.
- [Risk] The empty `api.py` and feature packages may look inactive. → Mitigation: document that they are intentional structural placeholders and defer layers until a real feature is implemented.
- [Risk] The slim Docker image can lack build tools for future packages with native extensions. → Mitigation: keep the initial dependency set pure enough for the official image and revisit the base/build strategy when integrations are added.

## Migration Plan

No migration or deployment cutover is required. Create the nested repository, install the declared dependencies, verify local startup and Docker startup, and use the resulting repository as the baseline for later feature changes. Rollback consists of removing the new nested repository or reverting its initial commit.

## Open Questions

None for this bootstrap. Future feature changes can decide endpoint conventions, settings management, integration clients, and testing strategy when those behaviors are actually introduced.
