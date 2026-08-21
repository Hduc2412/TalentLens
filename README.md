# TalentLens

TalentLens turns a static Excel personality assessment into a live view of an
organisation: who sits where, how well each person fits the job model their
department implies, and what a proposed transfer would do to that fit — without
touching the real records.

## Workspace structure

```text
TalentLens/
|-- BE/  # FastAPI, Firestore integration, and business APIs
`-- FE/  # React + TypeScript board, profiles and simulation
```

## Run the frontend

```bash
cd FE
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and starts on mock data, so it
needs no backend to be useful. See [FE/README.md](FE/README.md) for the feature
walkthrough and the quality gate.

## Run the backend

Python 3.13 is recommended.

```bash
cd BE
python -m venv .venv
python -m pip install -e ".[dev]"
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend runs at `http://127.0.0.1:8000`, with API documentation at
`http://127.0.0.1:8000/docs`.

## Firestore setup

Copy `BE/.env.example` to `BE/.env`, configure `GOOGLE_CLOUD_PROJECT`, and
authenticate with Application Default Credentials:

```bash
gcloud auth application-default login
```

Never commit service-account keys or other credentials.

## Current status

**Frontend — feature complete on mock data.**

Five feature modules (`auth`, `orgChart`, `employeeProfile`, `comparison`, plus
a shared data layer), each behind a public barrel. TypeScript throughout,
Tailwind v4 on the Mosa design tokens, Zustand for state, and every string in
Japanese and English. Quality gate: Prettier, `tsc -b`, ESLint, 87 tests and a
custom architecture audit — all green.

**Backend — data layer done, API layer not started.**

The Excel parser is complete and verified against the real workbook: 318 people,
218 columns, 36 traits, 8 culture scales, 5 Big Five aggregates and a protected
psychometric block. RS256 token verification works. What is missing is
everything between the two: nothing writes to Firestore yet, and none of the
endpoints the frontend calls exist.

**Not yet connected.** The two halves cannot talk to each other today. The
blockers are written up in
[FE/docs/backend-contract-gaps.md](FE/docs/backend-contract-gaps.md) — the
first one is that the two JWT contracts share no claim, so each side rejects the
other's token.

## Data handling

The frontend ships **synthetic** fixtures. The production dataset carries
protected psychometric scores — Machiavellianism, psychopathy, narcissism,
stress and mental-status indicators — that must never reach a browser bundle;
only the real department names are reused.

The UI's role picker is a demo convenience, not an authorisation boundary. A
frontend cannot protect a field the backend already sent, so the API has to
verify the token and omit protected attributes before responding. The profile
drawer is written for that model already: it stays locked unless the principal
holds `employees:read_sensitive` **and** the payload actually arrived.

Internal Word documents and Excel source files are kept outside Git.
