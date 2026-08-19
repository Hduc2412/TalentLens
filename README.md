# TalentLens

TalentLens is a personal workspace for building an employee visualization, analysis, and transfer-simulation platform backed by Excel imports and Firestore.

## Workspace structure

```text
TalentLens/
|-- BE/  # FastAPI, Firestore integration, and business APIs
`-- FE/  # React + Vite simulation board
```

## Run the frontend

```bash
cd FE
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` by default.

## Run the backend

Python 3.13 is recommended.

```bash
cd BE
python -m venv .venv
python -m pip install -e ".[dev]"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend runs at `http://127.0.0.1:8000` by default. API documentation is available at `http://127.0.0.1:8000/docs`.

## Firestore setup

Copy `BE/.env.example` to `BE/.env`, configure `GOOGLE_CLOUD_PROJECT`, and authenticate with Application Default Credentials:

```bash
gcloud auth application-default login
```

Never commit service-account keys or other credentials.

## Current status

- The simulation board currently uses mock employee and department data.
- The frontend contains an API-ready data adapter for future organization endpoints.
- The backend provides authentication foundations, health checks, and Firestore connectivity.
- Excel import, Firestore persistence, and business endpoints remain planned work.

Internal Word documents and Excel source files are kept outside Git to avoid publishing sensitive data.
