import { createContext, use } from 'react'

import type { AuthStatus, AuthUser, Permission, Role } from '../types/auth.types'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  roles: Role[]
  permissions: Permission[]

  // Convenience flags the UI reads directly.
  isHRAdmin: boolean
  isManager: boolean
  isEmployee: boolean
  canViewSensitiveData: boolean
  canEditSimulation: boolean
  canApproveScenario: boolean
  canImportExcel: boolean

  hasRole: (role: Role) => boolean
  hasPermission: (permission: Permission) => boolean
  signIn: (token: string, options?: { remember?: boolean }) => boolean
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = (): AuthContextValue => {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth must be used inside an AuthProvider')
  return value
}
