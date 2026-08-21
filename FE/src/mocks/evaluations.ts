/**
 * Historical evaluation snapshots for the comparison feature.
 *
 * The newest period IS the live fixture set, so the org chart and the comparison
 * page never disagree. Older periods are derived by walking a deterministic drift
 * backwards from it — no randomness, so diffs stay stable across test runs.
 */

import { DEPARTMENTS, EMPLOYEES, classifyRank, seedOf } from './organization'
import { DEPARTMENT_SEEDS } from './organization.seeds'
import type {
  EmployeeDetail,
  EvaluationPeriod,
  EvaluationSnapshot,
  SensitiveData,
} from '@/types/domain.types'

/** Oldest first; the last entry mirrors the current organization state. */
export const EVALUATION_PERIODS: EvaluationPeriod[] = [
  { period_id: '2025H1', year: 2025, half: 1, closed_on: '2025-09-30' },
  { period_id: '2025H2', year: 2025, half: 2, closed_on: '2026-03-31' },
  { period_id: '2026H1', year: 2026, half: 1, closed_on: '2026-09-30' },
]

const LATEST_PERIOD_INDEX = EVALUATION_PERIODS.length - 1

export const LATEST_PERIOD_ID = EVALUATION_PERIODS[LATEST_PERIOD_INDEX].period_id

/** The default pairing HR opens with: the two most recent closed periods. */
export const DEFAULT_BASE_PERIOD_ID = EVALUATION_PERIODS[LATEST_PERIOD_INDEX - 1].period_id

const DEPARTMENT_IDS = DEPARTMENT_SEEDS.map(([departmentId]) => departmentId)

/** Career ladder, lowest first: an earlier period sits one rung down at most. */
const ROLE_LADDER = ['一般社員', '主任', '係長', '課長', '次長', '部長', '本部長'] as const

const round2 = (value: number): number => Math.round(value * 100) / 100

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Signed drift in [-1, 1] for one (employee, period, channel) triple. Distinct
 * multipliers keep the channels from moving in lockstep.
 */
const drift = (employeeId: string, stepsBack: number, channel: number): number => {
  const mixed = (seedOf(employeeId) * 31 + stepsBack * 89 + channel * 17) % 200
  return (mixed - 100) / 100
}

const rewindTraits = (
  traits: Record<string, number>,
  employeeId: string,
  stepsBack: number,
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(traits).map(([key, value], index) => [
      key,
      round2(clamp(value - drift(employeeId, stepsBack, index + 3) * 8 * stepsBack, 0, 100)),
    ]),
  )

const rewindSensitive = (
  sensitive: SensitiveData | null,
  employeeId: string,
  stepsBack: number,
): SensitiveData | null => {
  if (!sensitive) return null
  const shift = (channel: number): number => drift(employeeId, stepsBack, channel) * 6 * stepsBack
  return {
    ...sensitive,
    stress_positive: {
      ...sensitive.stress_positive,
      score: round2(clamp(sensitive.stress_positive.score - shift(41), 0, 100)),
    },
    stress_negative: {
      ...sensitive.stress_negative,
      score: round2(clamp(sensitive.stress_negative.score - shift(43), 0, 100)),
    },
  }
}

/**
 * A quarter of the roster sat in a different department one period earlier. The
 * shift drops the low bits first: they barely move between neighbouring employee
 * ids, so reading them directly picked out almost nobody.
 */
const rewindDepartmentId = (employee: EmployeeDetail, stepsBack: number): string => {
  const seed = seedOf(employee.employee_id) + stepsBack * 7
  if ((seed >>> 3) % 4 !== 0) return employee.department_id

  const index = (seed + stepsBack) % DEPARTMENT_IDS.length
  const candidate = DEPARTMENT_IDS[index]
  // Landing back on the current department would be a no-op, not a transfer.
  return candidate === employee.department_id
    ? DEPARTMENT_IDS[(index + 1) % DEPARTMENT_IDS.length]
    : candidate
}

/** Promotions only move forward in time, so rewinding steps the ladder down. */
const rewindRole = (employee: EmployeeDetail, stepsBack: number): string => {
  const currentRung = ROLE_LADDER.indexOf(employee.role as (typeof ROLE_LADDER)[number])
  if (currentRung < 1) return employee.role
  const seed = seedOf(employee.employee_id) + stepsBack * 13
  return seed % 3 === 0 ? ROLE_LADDER[Math.max(0, currentRung - 1)] : employee.role
}

const rewindEmployee = (employee: EmployeeDetail, stepsBack: number): EmployeeDetail => {
  const traits = rewindTraits(employee.traits, employee.employee_id, stepsBack)
  const jobKey = employee.job_key
  const previousFit = employee.job_fits[jobKey]
  const jobFit = round2(
    clamp(previousFit.job_fit - drift(employee.employee_id, stepsBack, 1) * 7 * stepsBack, 0, 100),
  )
  const cultureFit = round2(
    clamp(
      previousFit.culture_fit - drift(employee.employee_id, stepsBack, 2) * 7 * stepsBack,
      0,
      100,
    ),
  )
  const integrated = round2((jobFit + cultureFit) / 2)
  const rank = classifyRank(integrated)
  const departmentId = rewindDepartmentId(employee, stepsBack)
  const department = DEPARTMENTS.find((item) => item.department_id === departmentId)

  return {
    ...employee,
    department_id: departmentId,
    department_name: department?.full_name ?? employee.department_name,
    role: rewindRole(employee, stepsBack),
    traits,
    fit_score: integrated,
    fit_rank: rank,
    job_fits: {
      [jobKey]: {
        job_fit: jobFit,
        culture_fit: cultureFit,
        integrated,
        rank,
        source_integrated: integrated,
        company_standard_rank: rank,
      },
    },
    sensitive_data: rewindSensitive(employee.sensitive_data, employee.employee_id, stepsBack),
  }
}

/**
 * The two most junior hires only appear from the second period on, so the diff
 * exercises its joined/left branches.
 */
const rosterAt = (periodIndex: number): EmployeeDetail[] =>
  periodIndex === 0 ? EMPLOYEES.slice(0, -2) : EMPLOYEES

const SNAPSHOTS: Record<string, EvaluationSnapshot> = Object.fromEntries(
  EVALUATION_PERIODS.map((period, index) => [
    period.period_id,
    {
      period_id: period.period_id,
      employees: rosterAt(index).map((employee) =>
        index === LATEST_PERIOD_INDEX
          ? employee
          : rewindEmployee(employee, LATEST_PERIOD_INDEX - index),
      ),
    },
  ]),
)

export const getSnapshot = (periodId: string): EvaluationSnapshot | undefined => SNAPSHOTS[periodId]
