import { useEffect, useState } from 'react'

import { fetchEvaluationPeriods, fetchEvaluationSnapshot } from '@/services/evaluationService'
import { usePeriodLabel } from '@/i18n/usePeriodLabel'
import type { EvaluationPeriod, EvaluationSnapshot } from '@/types/domain.types'
import type { JobFitHistoryEntry } from '../components/JobFitsView'

interface Loaded {
  periods: EvaluationPeriod[]
  snapshots: EvaluationSnapshot[]
}

/**
 * One person's fit score across every closed evaluation period, oldest first.
 *
 * Snapshots are fetched once and then filtered per employee: the profile drawer
 * reopens constantly, and refetching the whole roster for a single row would be
 * wasteful. Periods the person is absent from are skipped rather than zeroed —
 * a pre-hire gap is not a score of zero.
 */
export const useEmployeeFitHistory = (employeeId: string | null): JobFitHistoryEntry[] => {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const periodLabel = usePeriodLabel()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const { signal } = controller

    fetchEvaluationPeriods({ signal })
      .then(async (periods) => ({
        periods,
        snapshots: await Promise.all(
          periods.map((period) => fetchEvaluationSnapshot(period.period_id, { signal })),
        ),
      }))
      .then((result) => {
        if (active) setLoaded(result)
      })
      .catch((error: Error) => {
        // History is supplementary: a failure leaves the section empty rather
        // than taking down the profile the drawer was opened for.
        if (error.name !== 'AbortError' && active) setLoaded({ periods: [], snapshots: [] })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  if (!employeeId || !loaded) return []

  return loaded.periods.flatMap((period, index) => {
    const match = loaded.snapshots[index]?.employees.find(
      (candidate) => candidate.employee_id === employeeId,
    )
    if (!match) return []
    return [
      {
        periodId: period.period_id,
        periodLabel: periodLabel(period),
        fitScore: match.fit_score,
        fitRank: match.fit_rank,
      },
    ]
  })
}
