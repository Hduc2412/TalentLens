import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useEmployeeProfile } from './useEmployeeProfile'
import { setAuthContext } from '@/services/organizationService'
import type { UserRole } from '@/types/domain.types'

afterEach(() => setAuthContext({ roles: [] }))

/** The shell keeps the data layer in sync; mirror that in the tests. */
const renderProfile = (employeeId: string | null, role: UserRole) => {
  setAuthContext({ roles: role ? [role] : [] })
  return renderHook(({ id, r }) => useEmployeeProfile(id, r), {
    initialProps: { id: employeeId, r: role },
  })
}

describe('useEmployeeProfile', () => {
  it('stays idle without a selected employee', () => {
    const { result } = renderProfile(null, 'HR_ADMIN')

    expect(result.current.loading).toBe(false)
    expect(result.current.employee).toBeNull()
    expect(result.current.activeTab).toBe('competency')
  })

  it('loads the full 360° payload for an HR admin', async () => {
    const { result } = renderProfile('E1001', 'HR_ADMIN')

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.employee).not.toBeNull())

    expect(result.current.loading).toBe(false)
    expect(Object.keys(result.current.employee?.traits ?? {})).toHaveLength(36)
    expect(result.current.employee?.sensitive_data).not.toBeNull()
    expect(result.current.canViewSensitive).toBe(true)
  })

  it('exposes the job fit of the assigned job model', async () => {
    const { result } = renderProfile('E1001', 'HR_ADMIN')
    await waitFor(() => expect(result.current.assignedJobFit).not.toBeNull())

    expect(result.current.assignedJobFit).toMatchObject({
      job_fit: 63.6,
      culture_fit: 84.4,
      integrated: 74,
      rank: 'S',
    })
  })

  it('withholds protected attributes from a manager', async () => {
    const { result } = renderProfile('E1002', 'HR_MANAGER')
    await waitFor(() => expect(result.current.employee).not.toBeNull())

    expect(result.current.canViewSensitive).toBe(false)
    expect(result.current.employee?.sensitive_data).toBeNull()
    // Non-protected competency data stays available.
    expect(result.current.employee?.big_five).toBeTruthy()
  })

  it('refetches when the role changes so the gate is re-evaluated', async () => {
    setAuthContext({ roles: ['HR_MANAGER'] })
    const { result, rerender } = renderHook(({ id, r }) => useEmployeeProfile(id, r), {
      initialProps: { id: 'E1001' as string | null, r: 'HR_MANAGER' as UserRole },
    })

    await waitFor(() => expect(result.current.employee).not.toBeNull())
    expect(result.current.employee?.sensitive_data).toBeNull()

    setAuthContext({ roles: ['HR_ADMIN'] })
    rerender({ id: 'E1001', r: 'HR_ADMIN' })

    await waitFor(() => expect(result.current.employee?.sensitive_data).not.toBeNull())
    expect(result.current.canViewSensitive).toBe(true)
  })

  it('surfaces a load failure for an unknown employee', async () => {
    const { result } = renderProfile('does-not-exist', 'HR_ADMIN')

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.loading).toBe(false)
    expect(result.current.employee).toBeNull()
  })

  it('switches the active tab', async () => {
    const { result } = renderProfile('E1001', 'HR_ADMIN')
    await waitFor(() => expect(result.current.employee).not.toBeNull())

    result.current.setActiveTab('sensitive')
    await waitFor(() => expect(result.current.activeTab).toBe('sensitive'))
  })
})
