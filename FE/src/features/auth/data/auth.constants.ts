import type { Permission, Role } from '../types/auth.types'

export const ROLES: readonly Role[] = ['HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] as const

export const PERMISSIONS: readonly Permission[] = [
  'employees:read',
  'employees:read_sensitive',
  'scenarios:write',
  'scenarios:approve',
  'excel:import',
] as const

/**
 * RBAC matrix — the fallback used when a token carries no `permissions` claim.
 *
 * A token that does carry the claim wins, because the issuer may narrow a role
 * per tenant. This table only ever grants what the role already implies, so a
 * missing claim degrades to the documented role capability rather than to
 * nothing (which would lock out every legacy token) or to everything.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  HR_ADMIN: [
    'employees:read',
    'employees:read_sensitive',
    'scenarios:write',
    'scenarios:approve',
    'excel:import',
  ],
  HR_MANAGER: ['employees:read', 'scenarios:write'],
  EMPLOYEE: ['employees:read'],
}

export const ROLE_LABEL_KEYS: Record<Role, string> = {
  HR_ADMIN: 'role_hr_admin',
  HR_MANAGER: 'role_hr_manager',
  EMPLOYEE: 'role_employee',
}

/**
 * Where the credential lives. "Remember me" decides which web storage is
 * written: localStorage survives closing the browser, sessionStorage dies with
 * the tab. Either way the token's own `exp` still ends the session.
 */
export const TOKEN_STORAGE_KEY = 'talentlens.access_token'

/** Matches the backend's clock leeway so both ends expire a token together. */
export const CLOCK_SKEW_SECONDS = 30

/** Most-privileged first: the badge shows one role, not a list. */
export const ROLE_PRIORITY: readonly Role[] = ['HR_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] as const
