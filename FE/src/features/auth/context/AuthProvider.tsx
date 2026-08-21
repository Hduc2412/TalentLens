import { useCallback, useEffect, useMemo, type ReactNode } from 'react'

import { AuthContext, type AuthContextValue } from './auth.context'
import { useAuthStore } from '../store/auth.store'
import type { Permission, Role } from '../types/auth.types'
import { secondsUntilExpiry } from '../utils/jwt'
import { setUnauthorizedHandler } from '@/services/organizationService'

/**
 * The store holds the state; this context is the read surface components use.
 *
 * Keeping both is deliberate: non-React code (the fetch layer, the token
 * refresh timer) needs `useAuthStore.getState()`, while components want a
 * single object of derived booleans that re-renders on principal change.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const signIn = useAuthStore((state) => state.signIn)
  const signOut = useAuthStore((state) => state.signOut)
  const restore = useAuthStore((state) => state.restore)
  const expire = useAuthStore((state) => state.expire)

  useEffect(() => {
    restore()
  }, [restore])

  // A rejected token must not leave the UI showing an authenticated shell.
  useEffect(() => {
    setUnauthorizedHandler(expire)
    return () => setUnauthorizedHandler(() => {})
  }, [expire])

  // Expire on the client at the same moment the API would, so the session ends
  // on a "signed out" screen rather than on a wall of failed requests.
  useEffect(() => {
    const payload = useAuthStore.getState().payload
    if (!payload) return undefined

    const timer = setTimeout(expire, secondsUntilExpiry(payload) * 1000)
    return () => clearTimeout(timer)
  }, [expire, user])

  // Another tab signing in or out changes the credential under us.
  useEffect(() => {
    const onStorage = () => restore()
    globalThis.addEventListener?.('storage', onStorage)
    return () => globalThis.removeEventListener?.('storage', onStorage)
  }, [restore])

  const hasRole = useCallback((role: Role) => Boolean(user?.roles.includes(role)), [user])

  const hasPermission = useCallback(
    (permission: Permission) => Boolean(user?.permissions.includes(permission)),
    [user],
  )

  const value = useMemo<AuthContextValue>(() => {
    const roles = user?.roles ?? []
    const permissions = user?.permissions ?? []
    const holds = (permission: Permission) => permissions.includes(permission)

    return {
      user,
      status,
      isAuthenticated: status === 'authenticated',
      roles,
      permissions,
      isHRAdmin: roles.includes('HR_ADMIN'),
      isManager: roles.includes('HR_MANAGER'),
      isEmployee: roles.includes('EMPLOYEE'),
      canViewSensitiveData: holds('employees:read_sensitive'),
      canEditSimulation: holds('scenarios:write'),
      canApproveScenario: holds('scenarios:approve'),
      canImportExcel: holds('excel:import'),
      hasRole,
      hasPermission,
      signIn,
      signOut,
    }
  }, [hasPermission, hasRole, signIn, signOut, status, user])

  return <AuthContext value={value}>{children}</AuthContext>
}
