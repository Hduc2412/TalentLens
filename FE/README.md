# TalentLens Frontend

The React client for TalentLens: an organisation board, 360° talent profiles,
transfer simulation and period-over-period comparison. It runs on mock data by
default, so nothing here needs a backend to be useful.

## Technology stack

- React 19 + TypeScript 6, Vite 8
- Tailwind CSS v4 — the Mosa palette is declared as `@theme` tokens, so utility
  classes stay canonical and no arbitrary values appear in the codebase
- Zustand for feature state
- i18next — Japanese (default) and English
- Phosphor Icons
- Vitest + Testing Library, ESLint, Prettier

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm, included with Node.js

## Installation and local development

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Configuration

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` on PowerShell):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK=true
VITE_AUTO_SIGN_IN=true
```

- `VITE_USE_MOCK` — `true` serves synthetic fixtures from the browser. Set it to
  `false` to read from the API. Note the backend endpoints do not exist yet; see
  [docs/backend-contract-gaps.md](docs/backend-contract-gaps.md).
- `VITE_AUTO_SIGN_IN` — mock mode signs itself in as HR Admin so the demo opens
  straight on the board. Set it to `false` to face the real sign-in page while
  still reading mock data; that is how the login, register and password-reset
  flows get exercised without an identity provider.

The demo directory and its shared password are printed on the sign-in page in
mock mode, so nothing has to be guessed.

## Features

- **Org chart** — department lanes with headcount and average fit, employee
  cards colour-coded by tiered rank (S/A/B/C/Z), transfer by drag-and-drop or an
  accessible select, undo/redo over a baseline that is never overwritten.
- **Search** — one box across employee id, Kanji name, Kana name, role, MBTI
  type and social style. Hiragana input matches katakana names and full-width
  Latin matches its ASCII form, so `やまだ` finds `ヤマダ` and `ｅ１００１` finds
  `E1001`.
- **Employee profile** — an SVG radar over the eight core competencies, Big
  Five, organisational culture, the full trait sheet, fit across all 14 job
  models, and a protected tab that stays locked without the right permission.
- **Comparison** — diff two evaluation periods: who joined, who left, who moved,
  and which scores rose or fell.
- **Auth** — RS256 token read model with permission-based RBAC.

## Architecture

Feature-based. Everything a feature owns lives under `src/features/<name>/` in
`components/`, `hooks/`, `store/`, `data/` and `types/`, and the outside world
reaches it only through that feature's `index.ts`. Domain data shared by several
features sits in `src/data/`.

```text
src/
|-- features/       # auth, orgChart, employeeProfile, comparison
|-- components/     # app shell (layout/) and shared UI (ui/)
|-- data/           # trait keys and job models, shared across features
|-- services/       # HTTP + mock boundary
|-- locales/        # ja and en, one JSON per namespace
|-- i18n/, types/, utils/, mocks/
```

## Quality checks

```bash
npm run verify
```

Runs the whole gate in order: `format:check`, `typecheck`, `lint`, `test`,
`build`, `audit`. Each is also available on its own.

`npm run audit` is a project-specific check for the rules a linter cannot
express: file-size budgets, named exports only, zero Tailwind arbitrary values,
every `className` wrapped in `cn()`, no hardcoded UI text, matching `ja`/`en`
locale keys, and no cross-feature import that bypasses a barrel.

## Data handling

Mock fixtures are **synthetic**. The production dataset carries protected
psychometric scores that must never be bundled into a browser build; only the
real department names are reused.

The role picker simulates a workflow — it is not an authorisation boundary. A
frontend cannot protect a field the backend already sent, so the API must verify
the token and omit protected attributes before responding.

Never commit `.env`, access tokens, service-account keys or credentials.

## Troubleshooting

- **Port 5173 busy** — stop the other Vite process, or run
  `npm run dev -- --port 5174`.
- **The API is not reachable** — check `VITE_API_BASE_URL`, that the backend is
  listening on 8000, and that it sends CORS headers. It does not yet; see the
  contract gaps document.
- **`.env` changes have no effect** — Vite reads it at startup; restart the dev
  server.
- **`npm ci` fails** — check the Node version and do not hand-edit
  `package-lock.json`.
