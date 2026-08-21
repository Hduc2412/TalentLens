import { describe, expect, it } from 'vitest'

import { buildDraftSubjects, projectPlacement } from './draft'
import type { Department, EmployeeDetail, EmployeeSummary, JobFit } from '@/types/domain.types'

const jobFit = (integrated: number, rank: JobFit['rank']): JobFit => ({
  job_fit: integrated,
  culture_fit: integrated,
  integrated,
  rank,
  source_integrated: integrated,
  company_standard_rank: rank,
})

const department = (id: string, jobKey: string): Department => ({
  department_id: id,
  name: id,
  full_name: id,
  path: [id],
  level: 0,
  parent_department_id: null,
  member_count: 0,
  total_member_count: 0,
  default_job_key: jobKey,
})

const DEPARTMENTS = [department('dept_a', 'administration'), department('dept_b', 'marketing')]

const detail = (): EmployeeDetail =>
  ({
    employee_id: 'E1',
    name_kanji: '山田 太郎',
    name_kana: 'ヤマダ タロウ',
    department_id: 'dept_a',
    department_name: 'dept_a',
    role: '一般社員',
    mbti_type: 'INLA',
    social_style: 'ドライバー',
    job_key: 'administration',
    fit_score: 62,
    fit_rank: 'S',
    traits: { logic: 70 },
    big_five: {},
    culture: {},
    job_fits: { administration: jobFit(62, 'S'), marketing: jobFit(41, 'C') },
    sensitive_data: null,
  }) as EmployeeDetail

const placement = (departmentId: string, overrides: Partial<EmployeeSummary> = {}) =>
  ({
    employee_id: 'E1',
    name_kanji: '山田 太郎',
    name_kana: 'ヤマダ タロウ',
    department_id: departmentId,
    department_name: departmentId,
    role: '一般社員',
    mbti_type: 'INLA',
    social_style: 'ドライバー',
    job_key: 'administration',
    fit_score: 62,
    fit_rank: 'S',
    ...overrides,
  }) as EmployeeSummary

describe('projectPlacement', () => {
  it('re-scores a transfer against the destination department job model', () => {
    const moved = projectPlacement(placement('dept_b'), detail(), DEPARTMENTS)
    expect(moved).toMatchObject({
      department_id: 'dept_b',
      job_key: 'marketing',
      fit_score: 41,
      fit_rank: 'C',
    })
  })

  it('leaves the score untouched when nobody moved', () => {
    const stayed = projectPlacement(placement('dept_a'), detail(), DEPARTMENTS)
    expect(stayed).toMatchObject({ job_key: 'administration', fit_score: 62, fit_rank: 'S' })
  })

  it('keeps an individual assignment that overrides the department default', () => {
    // The record says exec_transformational even though dept_a defaults to
    // administration: staying put must not silently re-score to the default.
    const assigned = {
      ...detail(),
      job_key: 'exec_transformational',
      fit_score: 74,
      fit_rank: 'S' as const,
      job_fits: { ...detail().job_fits, exec_transformational: jobFit(74, 'S') },
    }
    const stayed = projectPlacement(placement('dept_a'), assigned, DEPARTMENTS)
    expect(stayed).toMatchObject({ job_key: 'exec_transformational', fit_score: 74 })
  })

  it('keeps the profile score when the destination has no scored model', () => {
    const unknown = projectPlacement(placement('dept_c'), detail(), [
      ...DEPARTMENTS,
      department('dept_c', 'life_care'),
    ])
    expect(unknown).toMatchObject({ job_key: 'administration', fit_score: 62, fit_rank: 'S' })
  })

  it('carries the simulated role across', () => {
    const promoted = projectPlacement(placement('dept_a', { role: '課長' }), detail(), DEPARTMENTS)
    expect(promoted.role).toBe('課長')
  })
})

describe('buildDraftSubjects', () => {
  const details = new Map([['E1', detail()]])

  it('pairs the baseline placement against the simulated one', () => {
    const { base, target } = buildDraftSubjects(
      [placement('dept_a')],
      [placement('dept_b')],
      details,
      DEPARTMENTS,
    )
    expect(base[0]).toMatchObject({ department_id: 'dept_a', fit_score: 62 })
    expect(target[0]).toMatchObject({ department_id: 'dept_b', fit_score: 41 })
  })

  it('drops people with no loaded profile rather than half-filling a row', () => {
    const { base, target } = buildDraftSubjects(
      [placement('dept_a'), placement('dept_a', { employee_id: 'E9' })],
      [placement('dept_b'), placement('dept_b', { employee_id: 'E9' })],
      details,
      DEPARTMENTS,
    )
    expect(base).toHaveLength(1)
    expect(target).toHaveLength(1)
  })
})
