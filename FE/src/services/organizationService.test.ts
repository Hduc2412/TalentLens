import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

const loadService = () => import('./organizationService')

const useApi = () => {
  vi.stubEnv('VITE_USE_MOCK', 'false')
  vi.stubEnv('VITE_API_BASE_URL', 'http://backend.test')
}

const jsonResponse = (payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

const requestedUrl = (call: Parameters<typeof fetch>): string => String(call[0])

const requestedHeaders = (call: Parameters<typeof fetch>): Record<string, string> =>
  (call[1]?.headers ?? {}) as Record<string, string>

describe('organization service (mock mode)', () => {
  it('returns the department tree', async () => {
    const { fetchDepartments } = await loadService()
    const departments = await fetchDepartments()

    expect(departments).toHaveLength(5)
    expect(departments[0]).toMatchObject({
      department_id: 'dept_MusashinoAI事業部',
      level: 0,
      parent_department_id: null,
    })
    expect(departments.find((item) => item.level === 1)?.parent_department_id).toBe(
      'dept_kimete事業部',
    )
  })

  it('hands out isolated copies so callers cannot mutate the fixtures', async () => {
    const { fetchEmployees } = await loadService()
    const first = await fetchEmployees()
    first.items[0].department_id = 'tampered'

    const second = await fetchEmployees()
    expect(second.items[0].department_id).toBe('dept_MusashinoAI事業部')
  })

  it('never exposes protected attributes through the list endpoint', async () => {
    const { fetchEmployees } = await loadService()
    const { items } = await fetchEmployees()

    expect(items).toHaveLength(12)
    expect(items.every((person) => !Object.hasOwn(person, 'sensitive_data'))).toBe(true)
    expect(items.every((person) => !Object.hasOwn(person, 'traits'))).toBe(true)
  })

  it('filters a department together with its descendants', async () => {
    const { fetchEmployees } = await loadService()

    await expect(fetchEmployees({ departmentId: 'dept_kimete事業部' })).resolves.toMatchObject({
      total: 4,
    })
    await expect(
      fetchEmployees({ departmentId: 'dept_kimete事業部_HRサポートグループ' }),
    ).resolves.toMatchObject({ total: 3 })
  })

  it('searches across Kanji, Kana, id and role', async () => {
    const { fetchEmployees } = await loadService()

    await expect(fetchEmployees({ query: '山田' })).resolves.toMatchObject({ total: 1 })
    await expect(fetchEmployees({ query: 'ヤマダ' })).resolves.toMatchObject({ total: 1 })
    await expect(fetchEmployees({ query: 'やまだ' })).resolves.toMatchObject({ total: 1 })
    await expect(fetchEmployees({ query: 'e300' })).resolves.toMatchObject({ total: 4 })
    await expect(fetchEmployees({ query: '課長' })).resolves.toMatchObject({ total: 2 })
  })

  it('paginates the result set', async () => {
    const { fetchEmployees } = await loadService()
    const page = await fetchEmployees({ page: 2, limit: 5 })

    expect(page).toMatchObject({ page: 2, limit: 5, total: 12 })
    expect(page.items).toHaveLength(5)
    expect(page.items[0].employee_id).toBe('E2002')
  })

  it('hides sensitive_data unless the principal holds HR_ADMIN', async () => {
    const { fetchEmployeeDetail, setAuthContext } = await loadService()

    setAuthContext({ roles: ['HR_MANAGER'] })
    await expect(fetchEmployeeDetail('E1001')).resolves.toMatchObject({ sensitive_data: null })

    setAuthContext({ roles: ['HR_ADMIN'] })
    const detail = await fetchEmployeeDetail('E1001')
    expect(detail.sensitive_data?.machiavellianism).toHaveProperty('score')
    expect(Object.keys(detail.traits)).toHaveLength(36)
  })

  it('rejects an unknown employee', async () => {
    const { fetchEmployeeDetail } = await loadService()
    await expect(fetchEmployeeDetail('nope')).rejects.toThrow('Employee nope was not found')
  })
})

describe('organization service (api mode)', () => {
  it('calls the versioned endpoints and attaches the bearer token', async () => {
    useApi()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 10 }))
    const { fetchEmployees, setAuthContext } = await loadService()
    setAuthContext({ token: 'jwt-token', roles: ['HR_ADMIN'] })

    await fetchEmployees({ departmentId: 'dept_kimete事業部', query: '山田', page: 2, limit: 10 })

    const call = fetchMock.mock.calls[0]
    const url = decodeURIComponent(requestedUrl(call))
    expect(url).toContain('http://backend.test/api/v1/employees?')
    expect(url).toContain('department_id=dept_kimete事業部')
    expect(url).toContain('q=山田')
    expect(url).toContain('page=2')
    expect(url).toContain('limit=10')
    expect(requestedHeaders(call).Authorization).toBe('Bearer jwt-token')
  })

  it('requests a single employee detail by id', async () => {
    useApi()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ employee_id: 'E1001' }))
    const { fetchEmployeeDetail } = await loadService()

    await expect(fetchEmployeeDetail('E1001')).resolves.toEqual({ employee_id: 'E1001' })
    expect(requestedUrl(fetchMock.mock.calls[0])).toBe('http://backend.test/api/v1/employees/E1001')
  })

  it('surfaces a backend HTTP failure', async () => {
    useApi()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 503 }))
    const { fetchDepartments } = await loadService()

    await expect(fetchDepartments()).rejects.toThrow('API request failed with status 503')
  })
})
