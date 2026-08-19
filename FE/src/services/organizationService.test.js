import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('organization service', () => {
  it('returns isolated mock data by default', async () => {
    const { loadOrganization } = await import('./organizationService.js')
    const first = await loadOrganization()
    const second = await loadOrganization()

    first.people[0].dept = 'sales'
    expect(second.people[0].dept).toBe('ai')
  })

  it('loads departments and employees from the configured API', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api')
    vi.stubEnv('VITE_API_BASE_URL', 'http://backend.test')
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'ai' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'EMP001' }] })
    const { loadOrganization } = await import('./organizationService.js')

    await expect(loadOrganization()).resolves.toEqual({ departments: [{ id: 'ai' }], people: [{ id: 'EMP001' }] })
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://backend.test/api/departments', expect.objectContaining({ signal: undefined }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://backend.test/api/employees', expect.objectContaining({ signal: undefined }))
  })

  it('surfaces a backend HTTP failure', async () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'api')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 503 })
    const { loadOrganization } = await import('./organizationService.js')

    await expect(loadOrganization()).rejects.toThrow('API request failed with status 503')
  })
})
