import { create } from 'zustand'

import { DEFAULT_BASE_PERIOD_ID, LATEST_PERIOD_ID } from '@/services/evaluationService'
import type { ComparisonSource, DiffFilter } from '../types/comparison.types'

interface ComparisonState {
  source: ComparisonSource
  setSource: (source: ComparisonSource) => void
  basePeriodId: string
  targetPeriodId: string
  filter: DiffFilter
  query: string
  /** Whose radar overlay is open; `null` closes the panel. */
  focusedEmployeeId: string | null
  setBasePeriodId: (periodId: string) => void
  setTargetPeriodId: (periodId: string) => void
  setFilter: (filter: DiffFilter) => void
  setQuery: (query: string) => void
  focusEmployee: (employeeId: string | null) => void
  swapPeriods: () => void
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  source: 'periods',
  setSource: (source) => set({ source, focusedEmployeeId: null }),
  basePeriodId: DEFAULT_BASE_PERIOD_ID,
  targetPeriodId: LATEST_PERIOD_ID,
  filter: 'all',
  query: '',
  focusedEmployeeId: null,

  // Selecting the period already on the other side would diff a snapshot against
  // itself, so the sides swap instead of collapsing.
  setBasePeriodId: (periodId) =>
    set(
      periodId === get().targetPeriodId
        ? { basePeriodId: periodId, targetPeriodId: get().basePeriodId }
        : { basePeriodId: periodId },
    ),

  setTargetPeriodId: (periodId) =>
    set(
      periodId === get().basePeriodId
        ? { targetPeriodId: periodId, basePeriodId: get().targetPeriodId }
        : { targetPeriodId: periodId },
    ),

  setFilter: (filter) => set({ filter }),
  setQuery: (query) => set({ query }),
  focusEmployee: (employeeId) => set({ focusedEmployeeId: employeeId }),
  swapPeriods: () =>
    set({ basePeriodId: get().targetPeriodId, targetPeriodId: get().basePeriodId }),
}))
