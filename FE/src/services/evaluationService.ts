/**
 * Evaluation-period access. Mirrors organizationService: mock-first so the UI
 * runs before the backend ships the endpoints, with the real paths already wired.
 */

import {
  DEFAULT_BASE_PERIOD_ID,
  EVALUATION_PERIODS,
  LATEST_PERIOD_ID,
  getSnapshot,
} from '@/mocks/evaluations'
import { USE_MOCK, apiRequest, canReadSensitive } from './organizationService'
import type { EvaluationPeriod, EvaluationSnapshot } from '@/types/domain.types'

export { DEFAULT_BASE_PERIOD_ID, LATEST_PERIOD_ID }

const clone = <T>(value: T): T => structuredClone(value)

export const fetchEvaluationPeriods = async ({ signal }: { signal?: AbortSignal } = {}): Promise<
  EvaluationPeriod[]
> => {
  if (USE_MOCK) return clone(EVALUATION_PERIODS)
  return apiRequest<EvaluationPeriod[]>('/api/v1/evaluation-periods', { signal })
}

export const fetchEvaluationSnapshot = async (
  periodId: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<EvaluationSnapshot> => {
  if (!USE_MOCK) {
    return apiRequest<EvaluationSnapshot>(
      `/api/v1/evaluation-periods/${encodeURIComponent(periodId)}/snapshot`,
      { signal },
    )
  }

  const snapshot = getSnapshot(periodId)
  if (!snapshot) throw new Error(`Evaluation period ${periodId} was not found`)

  // Same gate as the detail endpoint: psychometrics need employees:read_sensitive.
  const admin = canReadSensitive()
  return {
    period_id: snapshot.period_id,
    employees: clone(snapshot.employees).map((employee) => ({
      ...employee,
      sensitive_data: admin ? employee.sensitive_data : null,
    })),
  }
}
