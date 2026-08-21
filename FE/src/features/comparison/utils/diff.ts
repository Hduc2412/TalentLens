/**
 * Pure diff maths for the comparison feature. Kept free of React and i18n so the
 * sentiment rules — the part that is easy to get backwards — stay unit-testable.
 */

import type { EmployeeDetail, FitRank } from '@/types/domain.types'
import type {
  CategoryDelta,
  ComparisonResult,
  ComparisonSummary,
  DeltaDirection,
  DeltaSentiment,
  EmployeeDiff,
  MetricDelta,
  RankDelta,
} from '../types/comparison.types'

/** Rungs on the fit ladder; the gap between two ranks is their index distance. */
export const RANK_ORDER: Record<FitRank, number> = { Z: 0, C: 1, B: 2, A: 3, S: 4 }

const round2 = (value: number): number => Math.round(value * 100) / 100

const directionOf = (delta: number | null): DeltaDirection => {
  if (delta === null || delta === 0) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

/**
 * `higherIsBetter` is what separates a rising fit score (good) from a rising
 * stress load (bad): both move up, only one is an improvement.
 */
const sentimentOf = (direction: DeltaDirection, higherIsBetter: boolean): DeltaSentiment => {
  if (direction === 'flat') return 'neutral'
  const rose = direction === 'up'
  return rose === higherIsBetter ? 'better' : 'worse'
}

export const buildMetricDelta = (
  base: number | null | undefined,
  target: number | null | undefined,
  { higherIsBetter = true }: { higherIsBetter?: boolean } = {},
): MetricDelta => {
  const from = base ?? null
  const to = target ?? null
  if (from === null || to === null) {
    return { base: from, target: to, delta: null, direction: 'flat', sentiment: 'unknown' }
  }
  const delta = round2(to - from)
  const direction = directionOf(delta)
  return {
    base: from,
    target: to,
    delta,
    direction,
    sentiment: sentimentOf(direction, higherIsBetter),
  }
}

export const buildRankDelta = (
  base: FitRank | null | undefined,
  target: FitRank | null | undefined,
): RankDelta => {
  const from = base ?? null
  const to = target ?? null
  if (from === null || to === null) {
    return { base: from, target: to, steps: null, direction: 'flat', sentiment: 'unknown' }
  }
  const steps = RANK_ORDER[to] - RANK_ORDER[from]
  const direction = directionOf(steps)
  return { base: from, target: to, steps, direction, sentiment: sentimentOf(direction, true) }
}

const buildCategoryDelta = (
  base: string | null | undefined,
  target: string | null | undefined,
): CategoryDelta => {
  const from = base ?? null
  const to = target ?? null
  // A field only counts as changed when both sides exist: a joiner has no "before".
  return { base: from, target: to, changed: from !== null && to !== null && from !== to }
}

/** Negative-stress load is the sensitive block's headline; gated for non-admins. */
export const stressOf = (employee: EmployeeDetail | null): number | null =>
  employee?.sensitive_data?.stress_negative.score ?? null

export const buildEmployeeDiff = (
  base: EmployeeDetail | null,
  target: EmployeeDetail | null,
): EmployeeDiff => {
  const anchor = target ?? base
  if (!anchor) throw new Error('buildEmployeeDiff needs at least one side')

  const status = base && target ? 'present' : target ? 'joined' : 'left'

  return {
    employeeId: anchor.employee_id,
    nameKanji: anchor.name_kanji,
    nameKana: anchor.name_kana,
    status,
    fitScore: buildMetricDelta(base?.fit_score, target?.fit_score),
    stress: buildMetricDelta(stressOf(base), stressOf(target), { higherIsBetter: false }),
    rank: buildRankDelta(base?.fit_rank, target?.fit_rank),
    department: buildCategoryDelta(base?.department_id, target?.department_id),
    role: buildCategoryDelta(base?.role, target?.role),
    baseEmployee: base,
    targetEmployee: target,
  }
}

const averageOf = (values: number[]): number | null =>
  values.length ? round2(values.reduce((total, value) => total + value, 0) / values.length) : null

const meanMetric = (
  rows: EmployeeDiff[],
  pick: (row: EmployeeDiff) => MetricDelta,
  higherIsBetter: boolean,
): MetricDelta => {
  const metrics = rows.map(pick)
  return buildMetricDelta(
    averageOf(metrics.map((metric) => metric.base).filter((value) => value !== null)),
    averageOf(metrics.map((metric) => metric.target).filter((value) => value !== null)),
    { higherIsBetter },
  )
}

const summarize = (rows: EmployeeDiff[]): ComparisonSummary => ({
  headcount: buildMetricDelta(
    rows.filter((row) => row.baseEmployee).length,
    rows.filter((row) => row.targetEmployee).length,
  ),
  averageFit: meanMetric(rows, (row) => row.fitScore, true),
  averageStress: meanMetric(rows, (row) => row.stress, false),
  rankUp: rows.filter((row) => row.rank.direction === 'up').length,
  rankDown: rows.filter((row) => row.rank.direction === 'down').length,
  departmentChanges: rows.filter((row) => row.department.changed).length,
  roleChanges: rows.filter((row) => row.role.changed).length,
  joined: rows.filter((row) => row.status === 'joined').length,
  left: rows.filter((row) => row.status === 'left').length,
})

/** True when anything the table shows moved between the two snapshots. */
export const hasAnyChange = (row: EmployeeDiff): boolean =>
  row.status !== 'present' ||
  row.rank.direction !== 'flat' ||
  row.fitScore.direction !== 'flat' ||
  row.department.changed ||
  row.role.changed

/** Target order first so the current roster reads top-down; leavers trail it. */
export const buildComparison = (
  baseEmployees: readonly EmployeeDetail[],
  targetEmployees: readonly EmployeeDetail[],
): ComparisonResult => {
  const baseById = new Map(baseEmployees.map((employee) => [employee.employee_id, employee]))

  const rows = targetEmployees.map((employee) =>
    buildEmployeeDiff(baseById.get(employee.employee_id) ?? null, employee),
  )

  const targetIds = new Set(targetEmployees.map((employee) => employee.employee_id))
  const leavers = baseEmployees
    .filter((employee) => !targetIds.has(employee.employee_id))
    .map((employee) => buildEmployeeDiff(employee, null))

  const all = [...rows, ...leavers]
  return { rows: all, summary: summarize(all) }
}
