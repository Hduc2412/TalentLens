/**
 * Assessment scale keys, mirroring `app/datasets/columns.py` on the backend.
 *
 * Shared rather than feature-owned: the fixtures build documents from them and
 * the profile and comparison views read them back, so one list keeps both sides
 * of that contract honest. Display names live in the `domain.*` bundle.
 */

export const TRAIT_KEYS = [
  'team_orientation',
  'friendliness',
  'footwork',
  'cooperation',
  'diversity_adaptation',
  'persuasion',
  'role_awareness',
  'integrity',
  'completion',
  'stability',
  'resilience',
  'consideration',
  'information_drive',
  'detail',
  'logic',
  'originality',
  'creation',
  'challenge',
  'exchange_drive',
  'mobility',
  'adaptability',
  'criticism_tolerance',
  'load_tolerance',
  'demand_tolerance',
  'self_understanding',
  'ambition',
  'positivity',
  'first_class_orientation',
  'economic_success_orientation',
  'recognition_orientation',
  'leadership',
  'management',
  'planning_role',
  'delivery_role',
  'global_leadership',
  'global_adaptability',
] as const

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

export const BIG_FIVE_GROUPS: Record<string, readonly string[]> = {
  extraversion: ['team_orientation', 'friendliness', 'footwork'],
  agreeableness: ['cooperation', 'diversity_adaptation', 'persuasion'],
  conscientiousness: ['role_awareness', 'integrity', 'completion'],
  emotional_stability: ['stability', 'resilience', 'consideration'],
  openness: ['information_drive', 'detail', 'logic'],
}

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
