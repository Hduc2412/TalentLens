import type { EmployeeDetail, EvaluationPeriod, FitRank } from '@/types/domain.types'

/** Raw numeric direction of a change, before any good/bad judgement. */
export type DeltaDirection = 'up' | 'down' | 'flat'

/** Whether the change was good for the person — `null` when the metric is gated. */
export type DeltaSentiment = 'better' | 'worse' | 'neutral' | 'unknown'

export interface MetricDelta {
  base: number | null
  target: number | null
  /** target − base, or `null` when either side is missing. */
  delta: number | null
  direction: DeltaDirection
  sentiment: DeltaSentiment
}

export interface RankDelta {
  base: FitRank | null
  target: FitRank | null
  /** Rungs climbed on the S > A > B > C > Z ladder; negative means demoted. */
  steps: number | null
  direction: DeltaDirection
  sentiment: DeltaSentiment
}

export interface CategoryDelta {
  base: string | null
  target: string | null
  changed: boolean
}

/** Whether the person is present in one snapshot or both. */
export type DiffStatus = 'present' | 'joined' | 'left'

export interface EmployeeDiff {
  employeeId: string
  nameKanji: string
  nameKana: string
  status: DiffStatus
  fitScore: MetricDelta
  /** Negative stress load: lower is better, so the sentiment is inverted. */
  stress: MetricDelta
  rank: RankDelta
  department: CategoryDelta
  role: CategoryDelta
  /** Snapshots kept for the radar overlay; `null` on the side where absent. */
  baseEmployee: EmployeeDetail | null
  targetEmployee: EmployeeDetail | null
}

export interface ComparisonSummary {
  headcount: MetricDelta
  averageFit: MetricDelta
  averageStress: MetricDelta
  rankUp: number
  rankDown: number
  departmentChanges: number
  roleChanges: number
  joined: number
  left: number
}

export interface ComparisonResult {
  rows: EmployeeDiff[]
  summary: ComparisonSummary
}

export interface PeriodPair {
  base: EvaluationPeriod | null
  target: EvaluationPeriod | null
}

/**
 * What the two sides of the diff are: two closed evaluation periods, or the
 * unsaved simulation measured against the committed baseline.
 */
export type ComparisonSource = 'periods' | 'draft'

/** Which rows the diff table shows. */
export type DiffFilter = 'all' | 'changed' | 'rank_up' | 'rank_down' | 'moved'
