import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useOrgChartStore } from '../store/orgChart.store'
import { useEmployeeSearch } from './useEmployeeSearch'
import { getMockOrganization } from '@/services/organizationService'

const membersOf = (groups: ReturnType<typeof useEmployeeSearch>['groups'], departmentId: string) =>
  groups.find((group) => group.department.department_id === departmentId)?.members ?? []

beforeEach(() => {
  const { departments, people } = getMockOrganization()
  useOrgChartStore.setState({ query: '', departmentId: '', selectedEmployeeId: null })
  useOrgChartStore.getState().hydrate(departments, people)
})

describe('useEmployeeSearch', () => {
  it('groups every person into their department lane', () => {
    const { result } = renderHook(() => useEmployeeSearch())

    expect(result.current.groups).toHaveLength(5)
    expect(result.current.summary).toEqual({ shown: 12, total: 12 })
    expect(membersOf(result.current.groups, 'dept_MusashinoAI事業部')).toHaveLength(4)
  })

  it('searches Kanji names', () => {
    const { result } = renderHook(() => useEmployeeSearch())
    act(() => result.current.setQuery('山田'))

    expect(result.current.summary.shown).toBe(1)
    expect(membersOf(result.current.groups, 'dept_MusashinoAI事業部')[0].employee_id).toBe('E1001')
  })

  it('matches a katakana name from a hiragana query', () => {
    const { result } = renderHook(() => useEmployeeSearch())
    act(() => result.current.setQuery('やまだ'))

    expect(result.current.summary.shown).toBe(1)
  })

  it('matches a full-width Latin employee id', () => {
    const { result } = renderHook(() => useEmployeeSearch())
    act(() => result.current.setQuery('ｅ１００１'))

    expect(result.current.summary.shown).toBe(1)
  })

  it('searches role, MBTI type and social style', () => {
    const { result } = renderHook(() => useEmployeeSearch())

    act(() => result.current.setQuery('課長'))
    expect(result.current.summary.shown).toBe(2)

    act(() => result.current.setQuery('ドライバー'))
    expect(result.current.summary.shown).toBe(3)
  })

  it('narrows a department together with its descendants', () => {
    const { result } = renderHook(() => useEmployeeSearch())

    act(() => result.current.setDepartmentId('dept_kimete事業部'))
    expect(result.current.summary.shown).toBe(4)
    expect(result.current.groups).toHaveLength(2)

    act(() => result.current.setDepartmentId('dept_kimete事業部_HRサポートグループ'))
    expect(result.current.summary.shown).toBe(3)
    expect(result.current.groups).toHaveLength(1)
  })

  it('combines the department filter with the text query', () => {
    const { result } = renderHook(() => useEmployeeSearch())

    act(() => result.current.setDepartmentId('dept_kimete事業部'))
    act(() => result.current.setQuery('山田'))

    expect(result.current.summary.shown).toBe(0)
  })

  it('averages the fit score per lane', () => {
    const { result } = renderHook(() => useEmployeeSearch())
    const lane = result.current.groups.find(
      (group) => group.department.department_id === 'dept_ダスキン事業本部',
    )

    expect(lane?.members).toHaveLength(0)
    expect(lane?.averageFit).toBeNull()
    expect(
      result.current.groups.find(
        (group) => group.department.department_id === 'dept_MusashinoAI事業部',
      )?.averageFit,
    ).toBe(54)
  })
})
