import { useCallback, useEffect, useState } from 'react'

import { fetchEvaluationPeriods, fetchEvaluationSnapshot } from '@/services/evaluationService'
import type { EvaluationPeriod, EvaluationSnapshot } from '@/types/domain.types'
import { useComparisonStore } from '../store/comparison.store'

interface ComparisonDataState {
  loading: boolean
  error: Error | null
  periods: EvaluationPeriod[]
  baseSnapshot: EvaluationSnapshot | null
  targetSnapshot: EvaluationSnapshot | null
  reload: () => void
}

interface ComparisonPayload {
  periods: EvaluationPeriod[]
  base: EvaluationSnapshot
  target: EvaluationSnapshot
}

interface KeyedResult<T> {
  key: string
  value: T
}

/**
 * Load the period list plus both selected snapshots, refetching when either side
 * changes.
 *
 * Results are stamped with the request key they belong to, so `loading` is
 * derived instead of written from inside the effect and a late response for a
 * previous selection can never be shown. The period list is deliberately not
 * keyed: it is stable, so keeping the last one avoids blanking the filter bar
 * on every reload.
 */
export const useComparisonData = (): ComparisonDataState => {
  const basePeriodId = useComparisonStore((state) => state.basePeriodId)
  const targetPeriodId = useComparisonStore((state) => state.targetPeriodId)

  const [loaded, setLoaded] = useState<KeyedResult<ComparisonPayload> | null>(null)
  const [failed, setFailed] = useState<KeyedResult<Error> | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  const requestKey = `${basePeriodId}|${targetPeriodId}|${reloadKey}`

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const { signal } = controller

    Promise.all([
      fetchEvaluationPeriods({ signal }),
      fetchEvaluationSnapshot(basePeriodId, { signal }),
      fetchEvaluationSnapshot(targetPeriodId, { signal }),
    ])
      .then(([periods, base, target]) => {
        if (active) setLoaded({ key: requestKey, value: { periods, base, target } })
      })
      .catch((requestError: Error) => {
        if (active && requestError.name !== 'AbortError') {
          setFailed({ key: requestKey, value: requestError })
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [basePeriodId, targetPeriodId, requestKey])

  const isFresh = loaded?.key === requestKey
  const error = failed?.key === requestKey ? failed.value : null

  return {
    loading: !isFresh && error === null,
    error,
    periods: loaded?.value.periods ?? [],
    baseSnapshot: isFresh ? loaded.value.base : null,
    targetSnapshot: isFresh ? loaded.value.target : null,
    reload,
  }
}
