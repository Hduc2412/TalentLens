# PeopleLens Frontend

This repository contains the standalone frontend for PeopleLens. The backend is developed and deployed in a separate repository.

## Technology stack

- React 19
- Vite 8
- Lucide React
- Vitest and Testing Library
- Oxlint

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm, included with Node.js

## Installation and local development

```bash
git clone https://github.com/Hduc2412/PeopleLens.git
cd PeopleLens
npm ci
npm run dev -- --host 127.0.0.1
```

Open the frontend at:

```text
http://127.0.0.1:5173/
```

The backend and its Swagger documentation usually run at:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/docs
```

`/docs` is the backend API documentation, not the frontend website.

## Backend configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Available environment variables:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DATA_SOURCE=mock
```

The Simulation Board currently uses mock data. Set `VITE_DATA_SOURCE=api` only after the backend API adapter has been implemented.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Current scope

- Department-based Simulation Board.
- Employee search.
- Employee transfers through drag and drop or an accessible select control.
- Mock Undo/Redo, save draft, submit, and commit workflows.
- HR Admin, Manager, and Viewer workflow simulation roles.
- A non-sensitive mock dataset for local UI development.

The client role selector is only a workflow simulation control and is not an authorization boundary. In API mode, the backend must derive permissions from verified JWT claims and omit sensitive fields entirely for unauthorized principals before returning a response.
