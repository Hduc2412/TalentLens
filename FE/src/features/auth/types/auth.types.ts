/**
 * TalentLens access-token contract.
 *
 * The frontend never verifies a token — RS256 signature checking belongs to the
 * API. What lives here is the read model: the claims the UI is allowed to trust
 * for rendering decisions, mirrored from the shared backend contract.
 */

import type { Permission, UserRole } from '@/types/domain.types'

/** Roles and permissions are shared with the data layer, not owned here. */
export type Role = UserRole

export type { Permission }

/** Minimal identity block carried in the token so the header needs no /me call. */
export interface TokenUser {
  employee_id: string
  email: string
  name_kanji: string
  name_kana: string
  department_id: string
}

export interface JWTPayload {
  // Registered claims (RFC 7519)
  iss: string
  sub: string
  aud: string
  exp: number
  nbf?: number
  iat: number
  jti: string

  // Application context claims
  tenant_id: string
  roles: Role[]
  permissions?: Permission[]
  user: TokenUser
}

/** The decoded principal the UI renders and guards against. */
export interface AuthUser extends TokenUser {
  /** Token `sub`: the identity primary key, distinct from `employee_id`. */
  user_id: string
  tenant_id: string
  roles: Role[]
  permissions: Permission[]
}

/**
 * `anonymous` is the cold start — nobody has signed in this page load.
 * `signed_out` is a deliberate exit, and is deliberately distinct: a
 * convenience sign-in may greet the first state but must never undo the
 * second.
 */
export type AuthStatus = 'anonymous' | 'authenticated' | 'expired' | 'signed_out'
