/**
 * The fourteen internal job models, mirroring `app/datasets/jobs.py` on the
 * backend. Order matches the source workbook so the table reads the same on both
 * sides; display names come from the `domain.job.*` bundle, never from here.
 */
export const JOB_MODEL_KEYS = [
  'exec_transformational',
  'exec_strategist',
  'sales_solution',
  'sales_package',
  'planning',
  'specialist_technical',
  'administration',
  'hr_customer_support',
  'business_store_manager',
  'hr_consultant',
  'hr_inside_sales',
  'marketing',
  'life_care',
  'corporate_account',
] as const

export type JobModelKey = (typeof JOB_MODEL_KEYS)[number]

export const DEFAULT_JOB_KEY: JobModelKey = 'administration'
