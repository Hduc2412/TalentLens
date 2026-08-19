# Project Bootstrap Specification

## Purpose

Provide a minimal, installable, and runnable PeopleLens backend foundation that makes future feature work predictable without introducing business behavior or external-service coupling.

## Requirements

### Requirement: Backend foundation is installable

The project SHALL declare a supported Python 3.13 runtime and the minimum runtime dependencies needed to install and serve the application. A developer SHALL be able to install the project from the `peoplelens-be/` repository using standard Python packaging tooling.

#### Scenario: Editable installation succeeds

- **WHEN** a developer runs `pip install -e .` from `peoplelens-be/` with a supported Python 3.13 interpreter
- **THEN** the project and its declared runtime dependencies install successfully without requiring cloud credentials

### Requirement: Application is importable and runnable

The project SHALL expose the application entrypoint `app.main:app`. The application SHALL start as an HTTP server on the configured default port without requiring Firestore, Google Cloud Storage, or production JWT configuration in development and test environments.

#### Scenario: Application starts without integrations in development

- **WHEN** the server is started from the project using the documented Uvicorn command in a development environment without GCP credentials or JWT configuration
- **THEN** the process starts successfully and listens on port 8000

#### Scenario: Production requires authentication configuration

- **WHEN** the server is started with `MOSA_ENVIRONMENT=production` and required JWT configuration is missing or invalid
- **THEN** startup fails with a configuration error

### Requirement: Repository structure is feature-oriented

The project SHALL provide Python package markers for the application root, shared core, infrastructure, authentication, datasets, imports, organization, search, scoring, scenarios, health, and tests. The foundation SHALL leave feature behavior and Router → Service → Repository layers unimplemented until a feature requires them.

#### Scenario: Initial package structure is present

- **WHEN** a developer inspects the new backend repository
- **THEN** the requested package directories and their `__init__.py` markers are present, while no feature router, service, repository, or business-logic module has been added

### Requirement: Initial runtime has no business or cloud behavior

The initial application SHALL provide no business endpoints and SHALL not initialize Firestore or Google Cloud Storage. Authentication validation SHALL be limited to protected routes and SHALL not require the external issuer to be reachable when a static PEM public key is configured. Starting the application in development and test SHALL not depend on cloud credentials or JWT configuration.

#### Scenario: Empty integration environment remains supported

- **WHEN** the application is started in development with no Firestore, GCS, or JWT environment variables and no external service access
- **THEN** startup succeeds without creating cloud clients or exposing business functionality, `/health` remains available, and protected routes report that authentication is not configured
