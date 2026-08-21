import { ROLE_PRIORITY } from '../data/auth.constants'
import { useAuth } from '../context/auth.context'
import type { Role } from '../types/auth.types'

/**
 * A token may carry several roles, but the shell shows one badge and one commit
 * label. Collapse to the most privileged one, defaulting to EMPLOYEE so an
 * unrecognised principal lands on the least capable view rather than the most.
 */
export const primaryRole = (roles: readonly Role[]): Role =>
  ROLE_PRIORITY.find((role) => roles.includes(role)) ?? 'EMPLOYEE'

export const usePrimaryRole = (): Role => primaryRole(useAuth().roles)
