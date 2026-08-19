# Authentication Specification

## Purpose

Authenticate PeopleLens API callers using RS256 access tokens issued by the external `mrag-user-be` service. PeopleLens verifies tokens but does not handle user passwords or issue tokens.

## Requirements

### Requirement: Protected routes validate external bearer tokens

Protected routes SHALL accept a JWT in the `Authorization: Bearer <token>` header and SHALL verify it with the configured RSA public key. The verifier SHALL allow only `RS256` and SHALL require valid `exp`, `uid`, `client_id`, and `company_id` claims. A configured 30-second clock leeway SHALL be allowed.

#### Scenario: Valid access token

- **WHEN** a caller sends a valid RS256 access token with the configured client ID and company ID
- **THEN** the protected route responds successfully with the authenticated principal

#### Scenario: Invalid access token

- **WHEN** a caller sends a missing, malformed, expired, incorrectly signed, disallowed-client, or non-RS256 token
- **THEN** the protected route responds with HTTP 401 and a generic authentication error

### Requirement: Authentication configuration is externalized

The service SHALL read `MOSA_JWT_PUBLIC_KEY`, `MOSA_JWT_ALLOWED_CLIENT_ID`, and `MOSA_JWT_LEEWAY_SECONDS` from environment configuration. PEM values containing literal `\\n` SHALL be normalized before parsing. Production SHALL fail during startup when required authentication settings are missing.

#### Scenario: Development without auth configuration

- **WHEN** the service runs in development without JWT configuration
- **THEN** the application starts, `/health` remains available, and a protected route responds with HTTP 503 until auth is configured

### Requirement: Authentication exposes a typed principal

The auth dependency SHALL expose a typed principal containing `uid`, optional `email`, `client_id`, and `company_id`. It SHALL not expose the raw token or all decoded claims as the public response.

#### Scenario: Authenticated identity endpoint

- **WHEN** a caller sends a valid access token to `GET /auth/me`
- **THEN** the response contains `uid`, optional `email`, `client_id`, and `company_id`

### Requirement: Health remains public

`GET /health` SHALL remain independent of authentication and external services.

#### Scenario: Health without credentials

- **WHEN** a caller sends `GET /health` without an Authorization header
- **THEN** the service responds with HTTP 200 and `{"status": "ok"}`
