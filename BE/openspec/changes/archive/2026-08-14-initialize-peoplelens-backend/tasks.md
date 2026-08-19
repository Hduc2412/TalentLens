## 1. Repository and package structure

- [x] 1.1 Create the `peoplelens-be/` directory and initialize a new Git repository inside it.
- [x] 1.2 Create the requested `app/`, feature, infrastructure, and `tests/` directories with only the required `__init__.py` package markers.

## 2. Python project and application entrypoint

- [x] 2.1 Add `pyproject.toml` with Python `>=3.13,<3.14`, setuptools build metadata, FastAPI `>=0.139.2,<0.140.0`, and Uvicorn `>=0.52.2,<0.53.0` with the `standard` extra; configure package discovery for `app*`.
- [x] 2.2 Add `app/main.py` with the minimal FastAPI application named `app` and `app/api.py` as a placeholder without routes.

## 3. Local and container developer experience

- [x] 3.1 Add the minimal Python `.gitignore` and placeholder `.env.example` without unused GCP or JWT variables.
- [x] 3.2 Add a minimal `Dockerfile` based on `python:3.13-slim` that installs the package and runs `uvicorn app.main:app` on port 8000.
- [x] 3.3 Add an English `README.md` covering project purpose, Python 3.13 setup, local startup, Docker startup, project tree, and current non-goals.

## 4. Verification

- [x] 4.1 Verify `pip install -e .` succeeds from `peoplelens-be/` with Python 3.13.
- [x] 4.2 Verify the application imports and the documented Uvicorn command starts successfully without external-service configuration.
- [x] 4.3 Verify the Docker image builds and the container starts on port 8000.
- [x] 4.4 Verify the final project tree contains no business endpoints, cloud clients, JWT implementation, pre-created router/service/repository layers, lockfile, or extra deployment files.
