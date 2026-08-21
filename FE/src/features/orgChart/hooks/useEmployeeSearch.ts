import { useMemo } from 'react'

import { ALL_DEPARTMENTS } from '../data/orgChart.constants'
import { useOrgChartStore } from '../store/orgChart.store'
import type { DepartmentGroup, OrgChartResultSummary } from '../types/orgChart.types'
import { useDomainLabels, type DomainLabels } from '@/i18n/domainLabels'
import type { Department, EmployeeSummary } from '@/types/domain.types'
import { includesJapanese } from '@/utils/japanese'

const SEARCHABLE_FIELDS = [
  'employee_id',
  'name_kanji',
  'name_kana',
  'role',
  'mbti_type',
  'social_style',
] as const satisfies readonly (keyof EmployeeSummary)[]

/** Search the raw dataset values and their translations, so either language hits. */
const haystackOf = (employee: EmployeeSummary, labels: DomainLabels): string =>
  [
    ...SEARCHABLE_FIELDS.map((field) => employee[field]),
    labels.role(employee.role),
    labels.mbti(employee.mbti_type),
    labels.socialStyle(employee.social_style),
  ].join(' ')

const inDepartmentBranch = (departmentId: string, selected: string): boolean =>
  selected === ALL_DEPARTMENTS ||
  departmentId === selected ||
  departmentId.startsWith(`${selected}_`)

const matches = (employee: EmployeeSummary, query: string, labels: DomainLabels): boolean => {
  if (!query.trim()) return true
  return includesJapanese(haystackOf(employee, labels), query)
}

const averageFitOf = (members: EmployeeSummary[]): number | null =>
  members.length
    ? Math.round(members.reduce((total, person) => total + person.fit_score, 0) / members.length)
    : null

const groupBy = (departments: Department[], people: EmployeeSummary[]): DepartmentGroup[] =>
  departments.map((department) => {
    const members = people.filter((person) => person.department_id === department.department_id)
    return { department, members, averageFit: averageFitOf(members) }
  })

interface EmployeeSearchState {
  groups: DepartmentGroup[]
  departments: Department[]
  summary: OrgChartResultSummary
  query: string
  departmentId: string
  setQuery: (query: string) => void
  setDepartmentId: (departmentId: string) => void
}

/** Derive the visible lanes from the store's people, query and department filter. */
export const useEmployeeSearch = (): EmployeeSearchState => {
  const departments = useOrgChartStore((state) => state.departments)
  const people = useOrgChartStore((state) => state.people)
  const query = useOrgChartStore((state) => state.query)
  const departmentId = useOrgChartStore((state) => state.departmentId)
  const setQuery = useOrgChartStore((state) => state.setQuery)
  const setDepartmentId = useOrgChartStore((state) => state.setDepartmentId)
  const labels = useDomainLabels()

  const visibleDepartments = useMemo(
    () =>
      departments.filter((department) =>
        inDepartmentBranch(department.department_id, departmentId),
      ),
    [departments, departmentId],
  )

  const matched = useMemo(
    () =>
      people.filter(
        (person) =>
          inDepartmentBranch(person.department_id, departmentId) && matches(person, query, labels),
      ),
    [people, departmentId, query, labels],
  )

  const groups = useMemo(() => groupBy(visibleDepartments, matched), [visibleDepartments, matched])

  return {
    groups,
    departments,
    summary: { shown: matched.length, total: people.length },
    query,
    departmentId,
    setQuery,
    setDepartmentId,
  }
}
