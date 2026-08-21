import { describe, expect, it } from 'vitest'

import { buildComparison, buildMetricDelta, buildRankDelta, hasAnyChange } from './diff'
import type { EmployeeDetail, FitRank } from '@/types/domain.types'

const employee = (
  overrides: Partial<EmployeeDetail> & Pick<EmployeeDetail, 'employee_id'>,
): EmployeeDetail =>
  ({
    name_kanji: '山田 太郎',
    name_kana: 'ヤマダ タロウ',
    department_id: 'dept_a',
    department_name: 'Dept A',
    role: '一般社員',
    mbti_type: 'INLA（内向・直感・論理・主導）',
    social_style: 'ドライバー',
    job_key: 'exec_transformational',
    fit_score: 50,
    fit_rank: 'B' as FitRank,
    traits: {},
    big_five: {},
    culture: {},
    job_fits: {},
    sensitive_data: null,
    ...overrides,
  }) as EmployeeDetail

const withStress = (base: Partial<EmployeeDetail>, score: number): EmployeeDetail =>
  employee({
    employee_id: 'E1',
    ...base,
    sensitive_data: {
      machiavellianism: { score: 0, rank: '中' },
      psychopathy: { score: 0, rank: '弱' },
      narcissism: { score: 0, rank: '強' },
      stress_positive: { score: 0, rank: '高' },
      stress_negative: { score, rank: '中' },
      mental_status: 0,
      stress_tolerance: {},
      cautions: [],
    },
  })

describe('buildMetricDelta', () => {
  it('marks a rise as better when higher is better', () => {
    const metric = buildMetricDelta(40, 55)
    expect(metric).toMatchObject({ delta: 15, direction: 'up', sentiment: 'better' })
  })

  it('marks a rise as worse when lower is better', () => {
    const metric = buildMetricDelta(40, 55, { higherIsBetter: false })
    expect(metric).toMatchObject({ delta: 15, direction: 'up', sentiment: 'worse' })
  })

  it('marks a fall as better when lower is better', () => {
    const metric = buildMetricDelta(55, 40, { higherIsBetter: false })
    expect(metric).toMatchObject({ delta: -15, direction: 'down', sentiment: 'better' })
  })

  it('reports an unchanged value as neutral, not as an improvement', () => {
    expect(buildMetricDelta(50, 50)).toMatchObject({
      delta: 0,
      direction: 'flat',
      sentiment: 'neutral',
    })
  })

  it('returns an unknown sentiment when either side is missing', () => {
    expect(buildMetricDelta(null, 50)).toMatchObject({ delta: null, sentiment: 'unknown' })
    expect(buildMetricDelta(50, null)).toMatchObject({ delta: null, sentiment: 'unknown' })
  })
})

describe('buildRankDelta', () => {
  it('counts rungs climbed on the S > A > B > C > Z ladder', () => {
    expect(buildRankDelta('B', 'A')).toMatchObject({
      steps: 1,
      direction: 'up',
      sentiment: 'better',
    })
    expect(buildRankDelta('C', 'S')).toMatchObject({ steps: 3, direction: 'up' })
  })

  it('reports a demotion as a negative step', () => {
    expect(buildRankDelta('A', 'C')).toMatchObject({
      steps: -2,
      direction: 'down',
      sentiment: 'worse',
    })
  })

  it('treats a held rank as flat', () => {
    expect(buildRankDelta('B', 'B')).toMatchObject({ steps: 0, direction: 'flat' })
  })
})

describe('buildComparison', () => {
  const base = [
    employee({ employee_id: 'E1', fit_score: 40, fit_rank: 'C', department_id: 'dept_a' }),
    employee({ employee_id: 'E2', fit_score: 60, fit_rank: 'S', role: '主任' }),
  ]
  const target = [
    employee({ employee_id: 'E1', fit_score: 56, fit_rank: 'A', department_id: 'dept_b' }),
    employee({ employee_id: 'E3', fit_score: 50, fit_rank: 'B' }),
  ]

  it('pairs people present in both snapshots', () => {
    const { rows } = buildComparison(base, target)
    const paired = rows.find((row) => row.employeeId === 'E1')
    expect(paired?.status).toBe('present')
    expect(paired?.rank).toMatchObject({ base: 'C', target: 'A', steps: 2 })
    expect(paired?.department.changed).toBe(true)
  })

  it('flags people only in the target as joined and only in the base as left', () => {
    const { rows, summary } = buildComparison(base, target)
    expect(rows.find((row) => row.employeeId === 'E3')?.status).toBe('joined')
    expect(rows.find((row) => row.employeeId === 'E2')?.status).toBe('left')
    expect(summary).toMatchObject({ joined: 1, left: 1 })
  })

  it('does not count a joiner as having changed department', () => {
    const { rows, summary } = buildComparison(base, target)
    expect(rows.find((row) => row.employeeId === 'E3')?.department.changed).toBe(false)
    expect(summary.departmentChanges).toBe(1)
  })

  it('averages headcount and fit over every row', () => {
    const { summary } = buildComparison(base, target)
    expect(summary.headcount).toMatchObject({ base: 2, target: 2, delta: 0 })
    expect(summary.averageFit.base).toBe(50)
    expect(summary.averageFit.target).toBe(53)
  })

  it('inverts the sentiment of a rising average stress load', () => {
    const { summary } = buildComparison(
      [withStress({ employee_id: 'E1' }, 30)],
      [withStress({ employee_id: 'E1' }, 45)],
    )
    expect(summary.averageStress).toMatchObject({ delta: 15, direction: 'up', sentiment: 'worse' })
  })

  it('leaves the stress metric unknown when the sensitive block is gated', () => {
    const { summary, rows } = buildComparison(base, target)
    expect(rows[0].stress.sentiment).toBe('unknown')
    expect(summary.averageStress.base).toBeNull()
  })
})

describe('hasAnyChange', () => {
  const [changed, unchanged] = [
    buildComparison(
      [employee({ employee_id: 'E1', fit_rank: 'C', fit_score: 40 })],
      [employee({ employee_id: 'E1', fit_rank: 'A', fit_score: 56 })],
    ).rows[0],
    buildComparison([employee({ employee_id: 'E1' })], [employee({ employee_id: 'E1' })]).rows[0],
  ]

  it('detects a moved row', () => {
    expect(hasAnyChange(changed)).toBe(true)
  })

  it('leaves an identical row out', () => {
    expect(hasAnyChange(unchanged)).toBe(false)
  })
})
