import type { FitRank, ScoreTone } from '@/types/domain.types'

/**
 * Rank drives the card colour, not the raw score: the tiered rank is the
 * decision signal HR acts on, and it already encodes the score thresholds.
 */
export const RANK_TONES: Record<FitRank, ScoreTone> = {
  S: 'good',
  A: 'good',
  B: 'medium',
  C: 'low',
  Z: 'low',
}

export const rankTone = (rank: FitRank): ScoreTone => RANK_TONES[rank] ?? 'low'

export const TONE_BADGE_CLASSES: Record<ScoreTone, string> = {
  good: 'bg-good-soft text-good',
  medium: 'bg-medium-soft text-medium',
  low: 'bg-low-soft text-low',
}

export const TONE_DOT_CLASSES: Record<ScoreTone, string> = {
  good: 'bg-good',
  medium: 'bg-medium',
  low: 'bg-low',
}

export const TONE_RAIL_CLASSES: Record<ScoreTone, string> = {
  good: 'border-l-good',
  medium: 'border-l-medium',
  low: 'border-l-low',
}

/** Deterministic avatar tints so a person keeps the same colour between renders. */
export const AVATAR_TINTS = [
  'bg-indigo/10 text-indigo',
  'bg-cyan/10 text-cyan',
  'bg-good-soft text-good',
  'bg-medium-soft text-medium',
] as const

export const ALL_DEPARTMENTS = ''

export const MAX_LANE_HEIGHT_CLASS = 'max-h-96'
