import type { ComparisonSource, DeltaSentiment, DiffFilter } from '../types/comparison.types'

/**
 * Sentiment, not raw direction, drives the colour: a rising stress score moves
 * "up" but is bad news, and HR must read the colour, not the arrow, for meaning.
 */
export const SENTIMENT_TEXT_CLASSES: Record<DeltaSentiment, string> = {
  better: 'text-good',
  worse: 'text-low',
  neutral: 'text-muted',
  unknown: 'text-muted',
}

export const SENTIMENT_CHIP_CLASSES: Record<DeltaSentiment, string> = {
  better: 'bg-good-soft text-good',
  worse: 'bg-low-soft text-low',
  neutral: 'bg-soft text-muted',
  unknown: 'bg-soft text-muted',
}

export const COMPARISON_SOURCES: readonly ComparisonSource[] = ['periods', 'draft'] as const

export const DIFF_FILTERS: readonly DiffFilter[] = [
  'all',
  'changed',
  'rank_up',
  'rank_down',
  'moved',
] as const
