/** Shared personnel domain contracts, mirroring the FastAPI response models. */

export type FitRank = 'S' | 'A' | 'B' | 'C' | 'Z'

export type ScoreTone = 'good' | 'medium' | 'low'

export interface Department {
  department_id: string
  name: string
  full_name: string
  path: string[]
  level: number
  parent_department_id: string | null
  member_count: number
  total_member_count: number
  default_job_key: string
}

export interface EmployeeSummary {
  employee_id: string
  name_kanji: string
  name_kana: string
  department_id: string
  department_name: string
  role: string
  mbti_type: string
  social_style: string
  job_key: string
  fit_score: number
  fit_rank: FitRank
}

export interface JobFit {
  job_fit: number
  culture_fit: number
  integrated: number
  rank: FitRank
  source_integrated: number
  company_standard_rank: string
}

export interface SensitiveScore {
  score: number
  rank: string
}

export interface CautionEntry {
  label: string
  score: number
}

export interface SensitiveData {
  machiavellianism: SensitiveScore
  psychopathy: SensitiveScore
  narcissism: SensitiveScore
  stress_positive: SensitiveScore
  stress_negative: SensitiveScore
  mental_status: number
  stress_tolerance: Record<string, number>
  cautions: CautionEntry[]
}

export interface EmployeeDetail extends EmployeeSummary {
  traits: Record<string, number>
  big_five: Record<string, number>
  culture: Record<string, number>
  job_fits: Record<string, JobFit>
  sensitive_data: SensitiveData | null
}

export interface EmployeePage {
  items: EmployeeSummary[]
  total: number
  page: number
  limit: number
}

export interface EmployeeFilter {
  departmentId?: string
  query?: string
  page?: number
  limit?: number
}

/** One evaluation cycle. Snapshots are immutable once the cycle closes. */
export interface EvaluationPeriod {
  period_id: string
  year: number
  /** 1 = first half, 2 = second half. Rendered through i18n, never stored as text. */
  half: 1 | 2
  closed_on: string
}

/** Every employee as they stood at the close of one evaluation period. */
export interface EvaluationSnapshot {
  period_id: string
  employees: EmployeeDetail[]
}

export type UserRole = 'HR_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'

/** Fine-grained capabilities, so a check never hard-codes a role name. */
export type Permission =
  | 'employees:read'
  | 'employees:read_sensitive'
  | 'scenarios:write'
  | 'scenarios:approve'
  | 'excel:import'

/** The principal the data layer sends upstream and gates mock responses with. */
export interface AuthContext {
  token: string
  roles: UserRole[]
  permissions: Permission[]
}
