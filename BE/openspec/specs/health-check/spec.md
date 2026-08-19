# Health Check Specification

## Purpose

Provide operators and automated probes with a stable HTTP liveness signal that confirms the PeopleLens application process is running.

## Requirements

### Requirement: Health endpoint reports application liveness

The system SHALL expose `GET /health` and SHALL respond with HTTP 200 and the exact JSON body `{"status": "ok"}` while the application process is running.

#### Scenario: Successful health check

- **WHEN** a client sends a GET request to `/health`
- **THEN** the system responds with HTTP 200 and JSON `{"status": "ok"}`

### Requirement: Health endpoint is independent of authentication and external services

The health endpoint SHALL be accessible without authentication and SHALL determine liveness without contacting Firestore, Google Cloud Storage, JWT providers, or other external systems.

#### Scenario: Request without credentials

- **WHEN** a client sends a GET request to `/health` without authentication credentials
- **THEN** the system responds with the normal successful health response

#### Scenario: External integrations are unconfigured

- **WHEN** the application is running without Firestore, GCS, or JWT configuration
- **THEN** `GET /health` still responds with HTTP 200 and JSON `{"status": "ok"}`
