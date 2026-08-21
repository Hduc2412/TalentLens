import { useEffect, useState } from 'react'

import { DEFAULT_PROFILE_TAB } from '../data/employeeProfile.constants'
import type { EmployeeProfileState, ProfileTabId } from '../types/employeeProfile.types'
import { canReadSensitive, fetchEmployeeDetail } from '@/services/organizationService'
import type { EmployeeDetail, UserRole } from '@/types/domain.types'

interface KeyedResult<T> {
  key: string
  value: T
}

/**
 * Load one 360° profile and own the tab state.
 *
 * The role is an input rather than module state so switching role refetches:
 * whether protected attributes come back at all is the backend's decision.
 *
 * Results are stamped with the request key they belong to, so `loading` and
 * `error` are derived rather than written from inside the effect, and a late
 * response for a previous employee or role can never be shown.
 */
export const useEmployeeProfile = (
  employeeId: string | null,
  role: UserRole,
): EmployeeProfileState => {
  const [loaded, setLoaded] = useState<KeyedResult<EmployeeDetail> | null>(null)
  const [failed, setFailed] = useState<KeyedResult<Error> | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTabId>(DEFAULT_PROFILE_TAB)

  const requestKey = employeeId ? `${employeeId}|${role}` : null

  useEffect(() => {
    if (!employeeId || !requestKey) return undefined

    let active = true
    const controller = new AbortController()

    fetchEmployeeDetail(employeeId, { signal: controller.signal })
      .then((detail) => {
        if (active) setLoaded({ key: requestKey, value: detail })
      })
      .catch((requestError: Error) => {
        if (active && requestError.name !== 'AbortError') {
          setFailed({ key: requestKey, value: requestError })
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [employeeId, requestKey])

  const employee = loaded?.key === requestKey ? loaded.value : null
  const error = failed?.key === requestKey ? failed.value : null
  const loading = requestKey !== null && employee === null && error === null

  return {
    employee,
    assignedJobFit: employee ? (employee.job_fits[employee.job_key] ?? null) : null,
    loading,
    error,
    activeTab,
    setActiveTab,
    // Read on every render rather than captured: the request key already
    // changes with the principal, so this cannot go stale behind a role switch.
    canViewSensitive: canReadSensitive(),
  }
}
