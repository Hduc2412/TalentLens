import { create } from 'zustand'

import { TOKEN_STORAGE_KEY } from '../data/auth.constants'
import type { AuthStatus, AuthUser, JWTPayload, Permission, Role } from '../types/auth.types'
import { decodeToken, isExpired, isUsable, toAuthUser } from '../utils/jwt'
import { setAuthContext } from '@/services/organizationService'

interface AuthState {
  token: string
  payload: JWTPayload | null
  user: AuthUser | null
  status: AuthStatus
  /** Accepts a token and returns whether it was usable. */
  signIn: (token: string, options?: { remember?: boolean }) => boolean
  signOut: () => void
  /** Re-reads stored credentials; used once on mount and on cross-tab changes. */
  restore: () => void
  /** Drops the principal without clearing storage, for a 401 from the API. */
  expire: () => void
}

const ANONYMOUS = { token: '', payload: null, user: null, status: 'anonymous' as const }

/**
 * "Remember me" is the difference between the two web storages, not a longer
 * token: `localStorage` survives closing the browser, `sessionStorage` dies
 * with the tab. Expiry is still the token's own `exp` either way.
 */
const stores = (): Storage[] => {
  try {
    return [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean)
  } catch {
    // Private-mode or blocked storage: run token-in-memory rather than crash.
    return []
  }
}

const readStoredToken = (): string => {
  for (const store of stores()) {
    const token = store.getItem(TOKEN_STORAGE_KEY)
    if (token) return token
  }
  return ''
}

const writeStoredToken = (token: string, remember = false): void => {
  try {
    // Always clear both first, so toggling "remember me" cannot leave a stale
    // copy behind in the store that is no longer being written to.
    stores().forEach((store) => store.removeItem(TOKEN_STORAGE_KEY))
    if (!token) return
    const target = remember ? globalThis.localStorage : globalThis.sessionStorage
    target?.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* Storage is a convenience here; the store stays the source of truth. */
  }
}

const principalFrom = (token: string): Pick<AuthState, 'token' | 'payload' | 'user' | 'status'> => {
  const payload = decodeToken(token)
  if (!payload) return ANONYMOUS
  if (!isUsable(payload)) {
    // An expired token is a distinct state from never having signed in: the UI
    // shows "session ended" rather than a cold login.
    return { ...ANONYMOUS, status: isExpired(payload) ? 'expired' : 'anonymous' }
  }
  return { token, payload, user: toAuthUser(payload), status: 'authenticated' }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...ANONYMOUS,

  signIn: (token, { remember = false } = {}) => {
    const next = principalFrom(token)
    writeStoredToken(next.status === 'authenticated' ? token : '', remember)
    set(next)
    return next.status === 'authenticated'
  },

  signOut: () => {
    writeStoredToken('')
    // Not plain ANONYMOUS: leaving on purpose has to outrank any automatic
    // sign-in, or the exit is undone on the next render.
    set({ ...ANONYMOUS, status: 'signed_out' })
  },

  restore: () => {
    const stored = readStoredToken()
    if (stored === get().token) return
    const next = principalFrom(stored)
    if (stored && next.status !== 'authenticated') writeStoredToken('')
    set(next)
  },

  expire: () => {
    writeStoredToken('')
    const cold = get().status === 'anonymous'
    set({ ...ANONYMOUS, status: cold ? 'anonymous' : 'expired' })
  },
}))

/**
 * One-way sync into the data layer.
 *
 * Components read roles from this store, but the service module is plain
 * functions with no React context, so it keeps its own copy. Pushing on every
 * change — rather than from an effect — means a request fired during the first
 * paint already carries the right principal.
 */
const syncServiceAuthContext = (state: AuthState): void => {
  setAuthContext({
    token: state.token,
    roles: state.user?.roles ?? [],
    permissions: state.user?.permissions ?? [],
  })
}

syncServiceAuthContext(useAuthStore.getState())
useAuthStore.subscribe(syncServiceAuthContext)

export const selectRoles = (state: AuthState): Role[] => state.user?.roles ?? []

export const selectPermissions = (state: AuthState): Permission[] => state.user?.permissions ?? []

export const hasRole = (state: AuthState, role: Role): boolean =>
  Boolean(state.user?.roles.includes(role))

export const hasPermission = (state: AuthState, permission: Permission): boolean =>
  Boolean(state.user?.permissions.includes(permission))
