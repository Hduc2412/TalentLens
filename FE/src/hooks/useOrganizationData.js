import { useCallback, useEffect, useState } from 'react'
import { dataSource, getMockOrganization, loadOrganization } from '../services/organizationService.js'

export function useOrganizationData() {
  const initialData = dataSource === 'mock' ? getMockOrganization() : null
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(dataSource === 'api')
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    if (dataSource === 'mock') return undefined

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    loadOrganization({ signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  return {
    departments: data?.departments ?? [],
    people: data?.people ?? [],
    loading,
    error,
    reload,
    dataSource,
  }
}
