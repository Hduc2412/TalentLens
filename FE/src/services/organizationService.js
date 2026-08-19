import { DEPARTMENTS, INITIAL_PEOPLE } from '../mocks/organization.js'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
export const dataSource = import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock'

const cloneMockData = () => ({
  departments: DEPARTMENTS.map((department) => ({ ...department })),
  people: INITIAL_PEOPLE.map((person) => ({
    ...person,
    traits: [...person.traits],
    sensitiveTraits: [...person.sensitiveTraits],
  })),
})

const getJson = async (path, signal) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}

export const getMockOrganization = () => cloneMockData()

export const loadOrganization = async ({ signal } = {}) => {
  if (dataSource === 'mock') return cloneMockData()

  const [departments, people] = await Promise.all([
    getJson('/api/departments', signal),
    getJson('/api/employees', signal),
  ])

  return { departments, people }
}
