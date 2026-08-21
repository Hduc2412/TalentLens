import { useCallback, useEffect, useState } from 'react'

import { USE_MOCK, getMockOrganization, loadOrganization } from '@/services/organizationService'
import { useOrgChartStore } from '../store/orgChart.store'

export type OrgChartDataSource = 'mock' | 'api'

interface OrgChartDataState {
  loading: boolean
  error: Error | null
  reload: () => void
  dataSource: OrgChartDataSource
}

/** Load departments and people once, then hand ownership to the org chart store. */
export const useOrgChartData = (): OrgChartDataState => {
  const hydrate = useOrgChartStore((state) => state.hydrate)
  const [loading, setLoading] = useState(!USE_MOCK)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // State transitions live in the event handler, not the effect body, so a
  // reload never triggers a cascading render.
  const reload = useCallback(() => {
    setLoading(!USE_MOCK)
    setError(null)
    setReloadKey((value) => value + 1)
  }, [])

  useEffect(() => {
    if (USE_MOCK) {
      const { departments, people } = getMockOrganization()
      hydrate(departments, people)
      return undefined
    }

    const controller = new AbortController()

    loadOrganization({ signal: controller.signal })
      .then(({ departments, people }) => hydrate(departments, people))
      .catch((requestError: Error) => {
        if (requestError.name !== 'AbortError') setError(requestError)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [hydrate, reloadKey])

  return { loading, error, reload, dataSource: USE_MOCK ? 'mock' : 'api' }
}
