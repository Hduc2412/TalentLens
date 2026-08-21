import { DEMO_IDENTITIES, DEMO_PASSWORD, createDevToken } from '../utils/devToken'
import type { Role } from '../types/auth.types'
import { ROLES } from '../data/auth.constants'
import { USE_MOCK } from '@/services/organizationService'

/**
 * Credential endpoints.
 *
 * PeopleLens verifies tokens but does not issue them: signing in, registering
 * and resetting a password all belong to the identity provider. This module is
 * the seam to it — the shapes below are what the UI needs, so the forms can be
 * built and driven now and repointed at the real service later without
 * touching a component.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/+$/,
  '',
)

export interface Credentials {
  /** Company email or employee id — the user picks, the service resolves. */
  identifier: string
  password: string
  remember: boolean
}

export interface RegistrationDetails {
  employeeId: string
  tenantId: string
  nameKanji: string
  nameKana: string
  email: string
  password: string
}

/** i18n keys, so the caller never assembles a user-facing string itself. */
export type AuthErrorKey =
  | 'error_invalid_credentials'
  | 'error_account_exists'
  | 'error_service_unavailable'
  | 'error_unexpected'

export type AuthOutcome<T = void> =
  | ({ ok: true } & (T extends void ? { token?: string } : { data: T }))
  | { ok: false; error: AuthErrorKey }

const failure = (error: AuthErrorKey): { ok: false; error: AuthErrorKey } => ({ ok: false, error })

const matchesIdentifier = (role: Role, identifier: string): boolean => {
  const account = DEMO_IDENTITIES[role]
  const needle = identifier.trim().toLowerCase()
  return account.employee_id.toLowerCase() === needle || account.email.toLowerCase() === needle
}

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (response.status === 401 || response.status === 403) throw new Error('invalid_credentials')
  if (response.status === 409) throw new Error('account_exists')
  if (!response.ok) throw new Error('service_unavailable')

  return response.json() as Promise<T>
}

/** Maps a thrown reason onto the message the form should show. */
const toErrorKey = (reason: unknown): AuthErrorKey => {
  const code = reason instanceof Error ? reason.message : ''
  if (code === 'invalid_credentials') return 'error_invalid_credentials'
  if (code === 'account_exists') return 'error_account_exists'
  // A network failure and a 5xx are the same thing to the person signing in:
  // the service is not answering, and retrying later is the only move.
  return 'error_service_unavailable'
}

export const signInWithCredentials = async ({
  identifier,
  password,
}: Credentials): Promise<AuthOutcome> => {
  if (USE_MOCK) {
    const role = ROLES.find((candidate) => matchesIdentifier(candidate, identifier))
    if (!role || password !== DEMO_PASSWORD) return failure('error_invalid_credentials')
    return { ok: true, token: createDevToken(role) }
  }

  try {
    const { access_token } = await post<{ access_token: string }>('/api/v1/auth/login', {
      identifier: identifier.trim(),
      password,
    })
    return { ok: true, token: access_token }
  } catch (reason) {
    return failure(toErrorKey(reason))
  }
}

export const registerAccount = async (details: RegistrationDetails): Promise<AuthOutcome> => {
  if (USE_MOCK) {
    const taken = ROLES.some((role) => matchesIdentifier(role, details.email))
    return taken ? failure('error_account_exists') : { ok: true }
  }

  try {
    await post('/api/v1/auth/register', {
      employee_id: details.employeeId.trim(),
      tenant_id: details.tenantId.trim(),
      name_kanji: details.nameKanji.trim(),
      name_kana: details.nameKana.trim(),
      email: details.email.trim(),
      password: details.password,
    })
    return { ok: true }
  } catch (reason) {
    return failure(toErrorKey(reason))
  }
}

export const requestPasswordReset = async (email: string): Promise<AuthOutcome> => {
  // Deliberately indistinguishable from success for an unknown address: telling
  // a stranger which emails are registered is an account-enumeration leak.
  if (USE_MOCK) return { ok: true }

  try {
    await post('/api/v1/auth/password-reset', { email: email.trim() })
    return { ok: true }
  } catch (reason) {
    return failure(toErrorKey(reason))
  }
}
