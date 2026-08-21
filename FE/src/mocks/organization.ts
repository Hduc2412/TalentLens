/**
 * Synthetic organization fixtures shaped exactly like the backend documents.
 *
 * Department names mirror the real Musashino org structure, but every person is
 * fictional: the production dataset carries protected psychometric scores that
 * must never be bundled into a browser build.
 */

import { JOB_MODEL_KEYS } from '@/data/jobModels'
import { BIG_FIVE_GROUPS, CULTURE_KEYS, TRAIT_KEYS } from '@/data/traitKeys'
import type {
  Department,
  EmployeeDetail,
  FitRank,
  JobFit,
  SensitiveData,
} from '@/types/domain.types'
import { DEPARTMENT_SEEDS, EMPLOYEE_SEEDS, type EmployeeSeed } from './organization.seeds'

const CAUTION_LABELS = [
  '気分や行動上のムラ',
  '感情的・衝動的',
  '思いこみの強さ・頑固',
  '非協調性',
  '不用意さ',
] as const

export const DEPARTMENTS: Department[] = DEPARTMENT_SEEDS.map(
  ([departmentId, path, memberCount, totalMemberCount, defaultJobKey]) => ({
    department_id: departmentId,
    name: path[path.length - 1],
    full_name: path.join(' '),
    path: [...path],
    level: path.length - 1,
    parent_department_id: path.length > 1 ? `dept_${path.slice(0, -1).join('_')}` : null,
    member_count: memberCount,
    total_member_count: totalMemberCount,
    default_job_key: defaultJobKey,
  }),
)

const RANK_THRESHOLDS: readonly (readonly [number, FitRank])[] = [
  [60, 'S'],
  [55, 'A'],
  [45, 'B'],
  [40, 'C'],
]

const round2 = (value: number): number => Math.round(value * 100) / 100

/** Deterministic 20-95 score so fixtures stay stable across test runs. */
const pseudoScore = (seed: number, index: number): number => 20 + ((seed * 37 + index * 61) % 76)

/**
 * Position-weighted hash. A plain char-code sum collides on anagram ids —
 * "E1002" and "E2001" summed to the same seed, so two different people were
 * handed byte-identical psychometrics.
 */
export const seedOf = (employeeId: string): number =>
  [...employeeId].reduce((total, character, index) => {
    const mixed = (total ^ character.charCodeAt(0)) * 16777619 + index * 2654435761
    return mixed >>> 0
  }, 2166136261)

export const classifyRank = (score: number): FitRank =>
  RANK_THRESHOLDS.find(([threshold]) => score >= threshold)?.[1] ?? 'Z'

const buildScores = (keys: readonly string[], seed: number): Record<string, number> =>
  Object.fromEntries(keys.map((key, index) => [key, round2(pseudoScore(seed, index))]))

const buildBigFive = (traits: Record<string, number>): Record<string, number> =>
  Object.fromEntries(
    Object.entries(BIG_FIVE_GROUPS).map(([dimension, scales]) => [
      dimension,
      round2(scales.reduce((total, scale) => total + (traits[scale] ?? 0), 0) / scales.length),
    ]),
  )

const buildSensitiveData = (seed: number): SensitiveData => ({
  machiavellianism: { score: round2(pseudoScore(seed, 3)), rank: '中' },
  psychopathy: { score: round2(pseudoScore(seed, 5)), rank: '弱' },
  narcissism: { score: round2(pseudoScore(seed, 7)), rank: '強' },
  stress_positive: { score: round2(pseudoScore(seed, 11)), rank: '高' },
  stress_negative: { score: round2(pseudoScore(seed, 13)), rank: '中' },
  mental_status: seed % 3,
  stress_tolerance: {
    criticism_tolerance: seed % 3,
    load_tolerance: (seed + 1) % 3,
    demand_tolerance: (seed + 2) % 3,
  },
  cautions: CAUTION_LABELS.map((label, index) => ({
    label,
    score: round2(pseudoScore(seed, 17 + index)),
  })),
})

const toJobFit = (jobFitScore: number, cultureFitScore: number): JobFit => {
  const integrated = round2((jobFitScore + cultureFitScore) / 2)
  const rank = classifyRank(integrated)
  return {
    job_fit: jobFitScore,
    culture_fit: cultureFitScore,
    integrated,
    rank,
    source_integrated: integrated,
    company_standard_rank: rank,
  }
}

/**
 * Every person is scored against all fourteen job models, not just the one their
 * department implies: the profile ranks them and the comparison view needs the
 * score for whichever model a simulated transfer would move them onto. The seeded
 * pair is kept verbatim so the assigned job matches the fixture exactly.
 */
const buildJobFits = (
  seed: number,
  assignedJobKey: string,
  assignedJobFit: number,
  assignedCultureFit: number,
): Record<string, JobFit> =>
  Object.fromEntries(
    JOB_MODEL_KEYS.map((key, index) => [
      key,
      key === assignedJobKey
        ? toJobFit(assignedJobFit, assignedCultureFit)
        : toJobFit(
            round2(pseudoScore(seed, 23 + index * 3)),
            round2(pseudoScore(seed, 29 + index * 5)),
          ),
    ]),
  )

const buildEmployee = (seedRow: EmployeeSeed): EmployeeDetail => {
  const [
    employeeId,
    nameKanji,
    nameKana,
    departmentId,
    role,
    mbtiType,
    socialStyle,
    jobKey,
    jobFit,
    cultureFit,
  ] = seedRow
  const department = DEPARTMENTS.find((item) => item.department_id === departmentId)
  const seed = seedOf(employeeId)
  const traits = buildScores(TRAIT_KEYS, seed)
  const integrated = round2((jobFit + cultureFit) / 2)
  const rank = classifyRank(integrated)
  const jobFits = buildJobFits(seed, jobKey, jobFit, cultureFit)

  return {
    employee_id: employeeId,
    name_kanji: nameKanji,
    name_kana: nameKana,
    department_id: departmentId,
    department_name: department?.full_name ?? '',
    role,
    mbti_type: mbtiType,
    social_style: socialStyle,
    job_key: jobKey,
    fit_score: integrated,
    fit_rank: rank,
    traits,
    big_five: buildBigFive(traits),
    culture: buildScores(CULTURE_KEYS, seed + 1),
    job_fits: jobFits,
    sensitive_data: buildSensitiveData(seed),
  }
}

export const EMPLOYEES: EmployeeDetail[] = EMPLOYEE_SEEDS.map(buildEmployee)
