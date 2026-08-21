# Backend contract gaps

Everything the frontend needs from `peoplelens-be` that is missing or does not
line up, gathered by reading both codebases side by side on 2026-08-21.

Nothing here is a frontend bug. The UI runs entirely on mock fixtures today; the
list is what has to be settled before `VITE_USE_MOCK=false` can work, and the
first item is the one that blocks all the others.

Backend reference: `peoplelen-be/peoplelens` (remote `kiendt2312/peoplelens`).

---

## 1. 🔴 The token contracts have no claim in common

`app/auth/verifier.py` requires `uid`, `client_id`, `company_id` and `exp`. The
frontend issues and reads `sub`, `tenant_id`, `user{…}`, `roles`, `permissions`.

| Purpose           | Backend                          | Frontend                                                                |
| ----------------- | -------------------------------- | ----------------------------------------------------------------------- |
| Identity          | `uid` (string)                   | `sub` (string)                                                          |
| Tenant            | `client_id` + `company_id` (int) | `tenant_id` (string)                                                    |
| Profile           | —                                | `user.employee_id`, `email`, `name_kanji`, `name_kana`, `department_id` |
| Authorisation     | `roles`                          | `roles` + `permissions`                                                 |
| Registered claims | `exp`                            | `iss`, `sub`, `aud`, `jti`, `iat`, `exp`, `nbf?`                        |

Consequences in both directions:

- A token the backend accepts fails `isJWTPayload` in `src/features/auth/utils/jwt.ts`,
  so `decodeToken` returns `null`, `signIn` returns `false`, and the form shows
  `error_unexpected` — a person who typed the right password is told something
  went wrong for no visible reason.
- A token the frontend mints has no `uid`/`client_id`, so every protected call
  answers `401`.

The frontend shape is the one the UI actually needs: the header renders
`name_kanji` and the profile drawer needs `employee_id` without a second
round-trip. Either the issuer adds those claims or the frontend adds a `/auth/me`
call after sign-in — worth deciding explicitly rather than by default.

## 2. 🔴 The third role is named differently on each side

`app/auth/schemas.py` has `Role = HR_ADMIN | HR_MANAGER | VIEWER`.
`src/types/domain.types.ts` has `UserRole = 'HR_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'`.

`knownOnly()` drops role names the UI does not implement, so a token carrying
`VIEWER` yields a principal with **no roles at all** — not an error, just a user
who can see nothing. It fails quietly, which is the awkward part.

The original prototype called it `viewer`; see
`docs/prototypes/OrgChartBoard.legacy.jsx` for the three-tier masking rules the
name came from. One side has to move.

## 3. 🔴 No CORS middleware

`app/main.py` mounts routers and nothing else. The browser will refuse every
cross-origin call from the Vite dev server (`:5173`) to the API (`:8000`) at the
preflight, before any handler runs.

This will be the first thing that breaks on the day the endpoints land, and it
is a four-line fix — worth doing alongside the first endpoint rather than after.

## 4. 🟠 None of the endpoints the frontend calls exist

The backend serves `GET /health`, `GET /health/firestore` and `GET /auth/me`.

| Called from              | Endpoint                                                        | Backend |
| ------------------------ | --------------------------------------------------------------- | ------- |
| `organizationService.ts` | `GET /api/v1/departments`                                       | missing |
| `organizationService.ts` | `GET /api/v1/employees` (`department_id`, `q`, `page`, `limit`) | missing |
| `organizationService.ts` | `GET /api/v1/employees/{id}`                                    | missing |
| `evaluationService.ts`   | `GET /api/v1/evaluation-periods`                                | missing |
| `evaluationService.ts`   | `GET /api/v1/evaluation-periods/{id}/snapshot`                  | missing |
| `auth.service.ts`        | `POST /api/v1/auth/login`                                       | missing |
| `auth.service.ts`        | `POST /api/v1/auth/register`                                    | missing |
| `auth.service.ts`        | `POST /api/v1/auth/password-reset`                              | missing |

`app/organization/`, `app/scenarios/` and `app/search/` are empty packages.
`app/scoring/engine.py` holds the full scoring algorithm but no router calls it.

The auth endpoints may well not belong to this service at all — PeopleLens
verifies tokens rather than issuing them. If an external identity provider owns
them, `auth.service.ts` should point at that host instead.

## 5. 🟠 Ingestion never reaches Firestore

The parsing layer is complete and correct — verified against the real workbook:
318 rows, 218 columns, 36 traits, 8 culture scales, 5 Big Five aggregates, and a
`sensitive_data` block with all eight keys.

What is missing is the writer:

- `app/imports/excel_service.py` does not exist, so nothing orchestrates
  parse → batch write.
- `app/infrastructure/firestore.py` has `write_documents` and `delete_collection`
  with no caller.
- `app/infrastructure/audit.py` has `record_audit_entry` with no caller, so
  `peoplelens_audit_logs` is never written.
- `app/core/collections.py` derives every collection name from the configured
  prefix and is likewise unused.
- Nothing builds documents for `peoplelens_jobs`.

## 6. 🟠 Data masking is scaffolding, not behaviour

`app/auth/dependencies.py` defines `require_hr_admin` and `HRAdminUser`, and
neither is attached to anything — there is no endpoint to attach them to.

Until that lands, the rule that protected psychometrics require `HR_ADMIN` is
enforced **only in the frontend**, which is not an enforcement point. The UI is
already written for the correct model: `SensitiveDataTab` shows the lock unless
the role permits **and** the payload actually arrived, so a backend that starts
withholding the block needs no frontend change.

## 7. 🟡 The backend has no permission concept

The frontend authorises on capabilities, not role names —
`employees:read`, `employees:read_sensitive`, `scenarios:write`,
`scenarios:approve`, `excel:import` — with `ROLE_PERMISSIONS` as the fallback
when a token omits the claim.

The backend has roles only. If the issuer never sends `permissions`, the
fallback covers it and nothing breaks; this is recorded so the two models are
reconciled deliberately rather than drifting further apart.

## 8. 🟡 Fields the backend emits that the frontend ignores

Harmless — extra fields do not break TypeScript — but worth knowing they exist
before someone reimplements them:

- Employee: `department_path`, `first_name_kanji`, `last_name_kanji`,
  `first_name_kana`, `last_name_kana`, `mbti_subtype`, `social_substyle`
- Department: `ideal_traits`, `ideal_culture` (per-department benchmark averages)

Checked in the other direction too: **every field the frontend reads is produced
by the backend.** The data contract itself is sound. It is transport, auth and
naming that are not.

---

## Suggested order

1. Settle the token contract (§1) and the role name (§2). Everything else waits.
2. Add CORS (§3) — trivial, and blocks the first integration attempt otherwise.
3. Ship the Excel writer (§5) so there is real data to serve.
4. Ship `departments` / `employees` / `employees/{id}` (§4) with masking wired
   through `HRAdminUser` (§6).
5. Revisit permissions (§7) and the unused fields (§8) once the above is live.
