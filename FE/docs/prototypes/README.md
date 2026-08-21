# Prototypes

Reference material only. Nothing here is imported, type-checked, linted or built —
`tsconfig` includes `src` only, and the Vite entry never reaches this folder.

## OrgChartBoard.legacy.jsx

The original single-file Mosa prototype (2026-08-18), rescued from
`peoplelens-fe-backup-20260819/` before that folder was removed on 2026-08-20.

Kept because it is the **only written record of the three-tier data-masking rules**
that shaped the current RBAC implementation:

| Tier | Sees |
| --- | --- |
| Viewer | name, job title, headline score only — no traits, no fit warnings |
| Manager | business competencies + base personality; **no** Stress / Mental / Dark Triad |
| HR Admin | the full 360° profile |

It also records two workflow rules now implemented in `useScenarioShell`:
a manager may only save a draft or submit for approval, and only an HR admin
commits a scenario to the real org chart.

Everything else in that prototype — the mock dataset, the inline design tokens,
the board layout — has been superseded by `src/features/orgChart`,
`src/features/employeeProfile` and the `@theme` tokens in `src/index.css`.

Note the prototype's third role is `viewer`; the shipped contract renamed it to
`EMPLOYEE`.
