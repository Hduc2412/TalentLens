import type { ProfileTab } from '../types/employeeProfile.types'
import type { Permission } from '@/types/domain.types'

/** The eight competency axes the domain specification puts on the radar. */
export const RADAR_TRAIT_KEYS = [
  'cooperation',
  'persuasion',
  'detail',
  'logic',
  'originality',
  'creation',
  'leadership',
  'management',
] as const

/** The eight organisational culture axes scored alongside the competencies. */
export const CULTURE_KEYS = [
  'structure_rigor',
  'self_responsibility',
  'openness_activity',
  'long_term_orientation',
  'challenge_innovation',
  'prudence_completeness',
  'meritocracy_competition',
  'support_mutual_aid',
] as const

export const BIG_FIVE_KEYS = [
  'extraversion',
  'agreeableness',
  'conscientiousness',
  'emotional_stability',
  'openness',
] as const

/** Dark triad plus the two stress polarity scores, all HR_ADMIN only. */
export const DARK_TRIAD_KEYS = ['machiavellianism', 'psychopathy', 'narcissism'] as const

export const STRESS_KEYS = ['stress_positive', 'stress_negative'] as const

export const TOLERANCE_KEYS = ['criticism_tolerance', 'load_tolerance', 'demand_tolerance'] as const

export const PROFILE_TABS: readonly ProfileTab[] = [
  { id: 'competency', labelKey: 'tab_competency', protected: false },
  { id: 'job_fits', labelKey: 'tab_job_fits', protected: false },
  { id: 'sensitive', labelKey: 'tab_sensitive', protected: true },
]

export const DEFAULT_PROFILE_TAB = 'competency'

/** The capability that unlocks protected attributes; everyone else gets the lock. */
export const SENSITIVE_PERMISSION: Permission = 'employees:read_sensitive'

/** Severity bands shared by the mental status and tolerance judgements. */
export const JUDGEMENT_TONE_CLASSES = ['text-good', 'text-medium', 'text-low'] as const
