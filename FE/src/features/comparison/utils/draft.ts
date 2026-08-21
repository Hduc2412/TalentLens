import type { Department, EmployeeDetail, EmployeeSummary } from '@/types/domain.types'

/**
 * Project a simulated placement back onto a full profile.
 *
 * A transfer does not change who the person is — their traits and their score
 * against every one of the fourteen job models are unchanged. What changes is
 * *which* model they are measured against: each department scores its members
 * against its own default job model, so moving someone re-reads their fit from a
 * different column. That re-read is the risk the comparison view exists to show.
 *
 * Someone who has not moved keeps the score already on their record. Re-deriving
 * it from the department would silently disagree with the org chart wherever an
 * individual assignment overrides the department default.
 *
 * Destinations with no scored model for the person also keep the record's fit
 * rather than inventing one.
 */
export const projectPlacement = (
  placement: EmployeeSummary,
  detail: EmployeeDetail,
  departments: readonly Department[],
): EmployeeDetail => {
  if (placement.department_id === detail.department_id) {
    return { ...detail, role: placement.role }
  }

  const department = departments.find(
    (candidate) => candidate.department_id === placement.department_id,
  )
  const jobKey = department?.default_job_key ?? detail.job_key
  const fit = detail.job_fits[jobKey]

  return {
    ...detail,
    department_id: placement.department_id,
    department_name: placement.department_name,
    role: placement.role,
    job_key: fit ? jobKey : detail.job_key,
    fit_score: fit?.integrated ?? detail.fit_score,
    fit_rank: fit?.rank ?? detail.fit_rank,
  }
}

/**
 * Pair the untouched baseline against the simulated draft, both re-scored
 * against the job model their department implies. People with no loaded profile
 * are dropped: a half-populated row would read as a data change that never
 * happened.
 */
export const buildDraftSubjects = (
  baseline: readonly EmployeeSummary[],
  draft: readonly EmployeeSummary[],
  details: ReadonlyMap<string, EmployeeDetail>,
  departments: readonly Department[],
): { base: EmployeeDetail[]; target: EmployeeDetail[] } => {
  const project = (placements: readonly EmployeeSummary[]): EmployeeDetail[] =>
    placements.flatMap((placement) => {
      const detail = details.get(placement.employee_id)
      return detail ? [projectPlacement(placement, detail, departments)] : []
    })

  return { base: project(baseline), target: project(draft) }
}
