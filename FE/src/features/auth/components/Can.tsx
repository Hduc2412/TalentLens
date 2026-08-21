import type { ReactNode } from 'react'

import { useAuth } from '../context/auth.context'
import type { Permission, Role } from '../types/auth.types'

interface CanProps {
  /** Passes when the principal holds any one of these. */
  permission?: Permission | Permission[]
  role?: Role | Role[]
  /** Rendered instead of nothing when the check fails — e.g. a lock notice. */
  fallback?: ReactNode
  children: ReactNode
}

const asArray = <T,>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

/**
 * Declarative UI guard.
 *
 * This hides affordances; it does not protect data. Anything it wraps must also
 * be denied by the API, because a determined client can render whatever it
 * likes. Its job is to stop honest users from finding dead ends.
 */
export const Can = ({ permission, role, fallback = null, children }: CanProps) => {
  const auth = useAuth()

  const permissions = asArray(permission)
  const roles = asArray(role)

  const allowed =
    (permissions.length === 0 || permissions.some(auth.hasPermission)) &&
    (roles.length === 0 || roles.some(auth.hasRole))

  return <>{allowed ? children : fallback}</>
}
