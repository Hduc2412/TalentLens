import { DEPARTMENTS, EMPLOYEES } from '@/mocks/organization'
import { includesJapanese } from '@/utils/japanese'
import type {
  AuthContext,
  Department,
  EmployeeDetail,
  EmployeeFilter,
  EmployeePage,
  EmployeeSummary,
  Permission,
  UserRole,
} from '@/types/domain.types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/+$/,
  '',
)

/** Mock is the default so the UI runs before a backend is provisioned. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const DEFAULT_PAGE_SIZE = 50

interface RequestOptions {
  params?: Record<string, string | number | undefined>
  signal?: AbortSignal
}

let authContext: AuthContext = { token: '', roles: [], permissions: [] }

export const setAuthContext = ({
  token = '',
  roles = [],
  permissions = [],
}: Partial<AuthContext> = {}): void => {
  authContext = { token, roles: [...roles], permissions: [...permissions] }
}

export const getAuthContext = (): AuthContext => ({
  token: authContext.token,
  roles: [...authContext.roles],
  permissions: [...authContext.permissions],
})

export const hasRole = (role: UserRole): boolean => authContext.roles.includes(role)

export const hasPermission = (permission: Permission): boolean =>
  authContext.permissions.includes(permission)

export const isHrAdmin = (): boolean => hasRole('HR_ADMIN')

/**
 * Whether the caller may see protected attributes.
 *
 * Permission first, role as the fallback: a token issued before `permissions`
 * existed still carries `roles`, and the mock layer has to mirror the same
 * decision the API makes for the real one.
 */
export const canReadSensitive = (): boolean =>
  authContext.permissions.length > 0 ? hasPermission('employees:read_sensitive') : isHrAdmin()

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler = () => {}

/** Lets the auth feature drop the principal when the API rejects the token. */
export const setUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
  onUnauthorized = handler
}

const clone = <T>(value: T): T => structuredClone(value)

const buildUrl = (path: string, params: RequestOptions['params'] = {}): string => {
  const url = new URL(`${API_BASE_URL}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

export const apiRequest = async <T>(
  path: string,
  { params, signal }: RequestOptions = {},
): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (authContext.token) headers.Authorization = `Bearer ${authContext.token}`

  const response = await fetch(buildUrl(path, params), { headers, signal })
  if (!response.ok) {
    // 401 means the token is gone or rejected upstream, so the whole session is
    // void — not just this call. 403 is a per-endpoint denial and leaves the
    // principal intact.
    if (response.status === 401) onUnauthorized()
    throw new Error(`API request failed with status ${response.status}`)
  }
  return response.json() as Promise<T>
}

const request = apiRequest

const matchesDepartment = (employee: EmployeeSummary, departmentId: string): boolean =>
  !departmentId ||
  employee.department_id === departmentId ||
  employee.department_id.startsWith(`${departmentId}_`)

/** Kanji, Kana, employee id and role are all searched with one substring pass. */
const matchesQuery = (employee: EmployeeSummary, query: string): boolean => {
  if (!query.trim()) return true
  const haystack = [
    employee.employee_id,
    employee.name_kanji,
    employee.name_kana,
    employee.role,
  ].join(' ')
  return includesJapanese(haystack, query)
}

/** Mirrors the backend EmployeeResponse: heavy and protected blocks stay out of lists. */
const LIST_FIELDS = [
  'employee_id',
  'name_kanji',
  'name_kana',
  'department_id',
  'department_name',
  'role',
  'mbti_type',
  'social_style',
  'job_key',
  'fit_score',
  'fit_rank',
] as const

const toListItem = (employee: EmployeeDetail): EmployeeSummary =>
  Object.fromEntries(
    LIST_FIELDS.map((field) => [field, employee[field]]),
  ) as unknown as EmployeeSummary

/** Synchronous seed so the board renders instantly while running on mock data. */
export const getMockOrganization = (): {
  departments: Department[]
  people: EmployeeSummary[]
} => ({
  departments: clone(DEPARTMENTS),
  people: clone(EMPLOYEES).map(toListItem),
})

const mockEmployees = (
  departmentId: string,
  query: string,
  page: number,
  limit: number,
): EmployeePage => {
  const matched = EMPLOYEES.filter(
    (employee) => matchesDepartment(employee, departmentId) && matchesQuery(employee, query),
  )
  const start = (page - 1) * limit
  return {
    items: clone(matched.slice(start, start + limit)).map(toListItem),
    total: matched.length,
    page,
    limit,
  }
}

export const fetchDepartments = async ({ signal }: { signal?: AbortSignal } = {}): Promise<
  Department[]
> => {
  if (USE_MOCK) return clone(DEPARTMENTS)
  return request<Department[]>('/api/v1/departments', { signal })
}

export const fetchEmployees = async (
  filter: EmployeeFilter = {},
  { signal }: { signal?: AbortSignal } = {},
): Promise<EmployeePage> => {
  const { departmentId = '', query = '', page = 1, limit = DEFAULT_PAGE_SIZE } = filter

  if (USE_MOCK) return mockEmployees(departmentId, query, page, limit)

  return request<EmployeePage>('/api/v1/employees', {
    params: { department_id: departmentId, q: query, page, limit },
    signal,
  })
}

export const fetchEmployeeDetail = async (
  employeeId: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<EmployeeDetail> => {
  if (!USE_MOCK) {
    return request<EmployeeDetail>(`/api/v1/employees/${encodeURIComponent(employeeId)}`, {
      signal,
    })
  }

  const employee = EMPLOYEES.find((item) => item.employee_id === employeeId)
  if (!employee) throw new Error(`Employee ${employeeId} was not found`)

  // Mirrors the backend contract: protected attributes need employees:read_sensitive.
  return {
    ...clone(employee),
    sensitive_data: canReadSensitive() ? clone(employee.sensitive_data) : null,
  }
}

/** Compatibility view used by the organization board. */
export const loadOrganization = async ({ signal }: { signal?: AbortSignal } = {}): Promise<{
  departments: Department[]
  people: EmployeeSummary[]
}> => {
  const [departments, employees] = await Promise.all([
    fetchDepartments({ signal }),
    fetchEmployees({ limit: 1000 }, { signal }),
  ])
  return { departments, people: employees.items }
}
