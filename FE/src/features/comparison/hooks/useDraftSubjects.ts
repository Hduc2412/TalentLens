import { useEffect, useMemo, useState } from 'react'

import { LATEST_PERIOD_ID, fetchEvaluationSnapshot } from '@/services/evaluationService'
import { useOrgChartStore } from '@/features/orgChart'
import type { EmployeeDetail } from '@/types/domain.types'
import { buildDraftSubjects } from '../utils/draft'

interface DraftSubjectsState {
  base: EmployeeDetail[]
  target: EmployeeDetail[]
  loading: boolean
  error: Error | null
}

/**
 * The unsaved simulation measured against the committed baseline.
 *
 * The org chart store only holds list-shaped placements, so the closed period's
 * snapshot supplies the profiles behind them — that is where the fourteen job
 * model scores live. It is fetched once: the draft changes as the user drags
 * people around, the profiles behind it do not.
 */
export const useDraftSubjects = (enabled: boolean): DraftSubjectsState => {
  const baseline = useOrgChartStore((state) => state.baseline)
  const draft = useOrgChartStore((state) => state.people)
  const departments = useOrgChartStore((state) => state.departments)

  const [details, setDetails] = useState<Map<string, EmployeeDetail> | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || details) return undefined

    let active = true
    const controller = new AbortController()

    fetchEvaluationSnapshot(LATEST_PERIOD_ID, { signal: controller.signal })
      .then((snapshot) => {
        if (!active) return
        setDetails(new Map(snapshot.employees.map((person) => [person.employee_id, person])))
        setError(null)
      })
      .catch((requestError: Error) => {
        if (active && requestError.name !== 'AbortError') setError(requestError)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [enabled, details])

  const subjects = useMemo(
    () =>
      details
        ? buildDraftSubjects(baseline, draft, details, departments)
        : { base: [], target: [] },
    [baseline, draft, details, departments],
  )

  return {
    ...subjects,
    loading: enabled && details === null && error === null,
    error,
  }
}
