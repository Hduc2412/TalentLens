import { afterEach, describe, expect, it } from 'vitest'

import { useAuthStore } from './auth.store'
import { CLOCK_SKEW_SECONDS, TOKEN_STORAGE_KEY } from '../data/auth.constants'
import { createDevToken } from '../utils/devToken'
import { getAuthContext } from '@/services/organizationService'

afterEach(() => {
  useAuthStore.getState().signOut()
  sessionStorage.clear()
})

describe('auth store', () => {
  it('accepts a usable token and pushes the principal into the data layer', () => {
    expect(useAuthStore.getState().signIn(createDevToken('HR_ADMIN'))).toBe(true)

    const state = useAuthStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.user?.employee_id).toBe('E1001')
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBe(state.token)

    const context = getAuthContext()
    expect(context.token).toBe(state.token)
    expect(context.roles).toEqual(['HR_ADMIN'])
    expect(context.permissions).toContain('employees:read_sensitive')
  })

  it('refuses an expired token and stores nothing', () => {
    const issued = Math.floor(Date.now() / 1000) - 60 * 60 - CLOCK_SKEW_SECONDS - 1

    expect(useAuthStore.getState().signIn(createDevToken('HR_ADMIN', issued))).toBe(false)
    expect(useAuthStore.getState().status).toBe('expired')
    expect(useAuthStore.getState().user).toBeNull()
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('clears the data layer principal on sign out', () => {
    useAuthStore.getState().signIn(createDevToken('HR_MANAGER'))
    useAuthStore.getState().signOut()

    expect(getAuthContext()).toEqual({ token: '', roles: [], permissions: [] })
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('discards a stored token that is no longer usable when restoring', () => {
    const issued = Math.floor(Date.now() / 1000) - 60 * 60 - CLOCK_SKEW_SECONDS - 1
    sessionStorage.setItem(TOKEN_STORAGE_KEY, createDevToken('HR_ADMIN', issued))

    useAuthStore.getState().restore()

    expect(useAuthStore.getState().status).toBe('expired')
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})
