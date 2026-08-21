import type { Department, EmployeeSummary } from '@/types/domain.types'

/** A department lane together with the members currently placed in it. */
export interface DepartmentGroup {
  department: Department
  members: EmployeeSummary[]
  averageFit: number | null
}

export interface OrgChartFilter {
  query: string
  departmentId: string
}

export interface OrgChartResultSummary {
  shown: number
  total: number
}
