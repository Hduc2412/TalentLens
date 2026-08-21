import { CLOCK_SKEW_SECONDS, PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '../data/auth.constants'
import type { AuthUser, JWTPayload, Permission, Role } from '../types/auth.types'

/**
 * Decoding is not verification.
 *
 * Everything here reads a token the API has already vouched for (or will, on
 * the next request). A tampered token decodes fine — it just fails at the API.
 * So the UI treats these claims as a rendering hint, never as the access
 * decision itself, and the API stays the single enforcement point.
 */

const KNOWN_ROLES = new Set<string>(ROLES)
const KNOWN_PERMISSIONS = new Set<string>(PERMISSIONS)

/** `atob` yields latin-1, which mangles 山田. Re-decode the bytes as UTF-8. */
const decodeBase64Url = (segment: string): string => {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

const isTokenUser = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Record<string, unknown>
  return (
    isNonEmptyString(user.employee_id) &&
    typeof user.email === 'string' &&
    typeof user.name_kanji === 'string' &&
    typeof user.name_kana === 'string' &&
    typeof user.department_id === 'string'
  )
}

/**
 * Unknown role and permission names are dropped rather than rejected, so a role
 * added upstream can never grant anything in a UI that has not shipped support
 * for it yet.
 */
const knownOnly = <T extends string>(raw: unknown, known: Set<string>): T[] => {
  if (!Array.isArray(raw)) return []
  const kept = raw.filter((item): item is T => typeof item === 'string' && known.has(item))
  return [...new Set(kept)]
}

const isJWTPayload = (value: unknown): value is JWTPayload => {
  if (typeof value !== 'object' || value === null) return false
  const claims = value as Record<string, unknown>
  return (
    isNonEmptyString(claims.iss) &&
    isNonEmptyString(claims.sub) &&
    isNonEmptyString(claims.aud) &&
    isNonEmptyString(claims.jti) &&
    isNonEmptyString(claims.tenant_id) &&
    typeof claims.exp === 'number' &&
    typeof claims.iat === 'number' &&
    (claims.nbf === undefined || typeof claims.nbf === 'number') &&
    Array.isArray(claims.roles) &&
    isTokenUser(claims.user)
  )
}

/** Returns the payload of a well-formed token, or null for anything else. */
export const decodeToken = (token: string): JWTPayload | null => {
  const segments = token.split('.')
  if (segments.length !== 3) return null

  try {
    const claims: unknown = JSON.parse(decodeBase64Url(segments[1]))
    if (!isJWTPayload(claims)) return null

    return {
      ...claims,
      roles: knownOnly<Role>(claims.roles, KNOWN_ROLES),
      permissions: knownOnly<Permission>(claims.permissions, KNOWN_PERMISSIONS),
    }
  } catch {
    return null
  }
}

const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

export const isExpired = (payload: JWTPayload, now = nowInSeconds()): boolean =>
  payload.exp + CLOCK_SKEW_SECONDS <= now

/** `nbf` tokens are valid only once their activation time has passed. */
export const isNotYetValid = (payload: JWTPayload, now = nowInSeconds()): boolean =>
  payload.nbf !== undefined && now + CLOCK_SKEW_SECONDS < payload.nbf

export const isUsable = (payload: JWTPayload, now = nowInSeconds()): boolean =>
  !isExpired(payload, now) && !isNotYetValid(payload, now)

/** Seconds until expiry, floored at zero. Used to schedule the sign-out timer. */
export const secondsUntilExpiry = (payload: JWTPayload, now = nowInSeconds()): number =>
  Math.max(0, payload.exp - now)

/**
 * Effective permissions: the explicit claim when present, else the RBAC matrix
 * for the roles the token carries.
 */
export const resolvePermissions = (payload: JWTPayload): Permission[] => {
  if (payload.permissions && payload.permissions.length > 0) return [...payload.permissions]
  return [...new Set(payload.roles.flatMap((role) => ROLE_PERMISSIONS[role]))]
}

export const toAuthUser = (payload: JWTPayload): AuthUser => ({
  ...payload.user,
  user_id: payload.sub,
  tenant_id: payload.tenant_id,
  roles: [...payload.roles],
  permissions: resolvePermissions(payload),
})
