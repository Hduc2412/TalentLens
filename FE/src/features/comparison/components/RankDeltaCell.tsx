import { ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { FitScoreBadge } from '@/features/orgChart'
import { SENTIMENT_TEXT_CLASSES } from '../data/comparison.constants'
import type { MetricDelta, RankDelta } from '../types/comparison.types'
import { cn } from '@/utils/cn'

const ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus } as const

interface RankDeltaCellProps {
  rank: RankDelta
  /** Supplies each badge with the score from its own period. */
  fitScore: MetricDelta
}

/** Rank moves on a five-rung ladder, so a badge pair reads better than a number. */
export const RankDeltaCell = ({ rank, fitScore }: RankDeltaCellProps) => {
  const { t } = useTranslation('comparison')
  const Icon = ICONS[rank.direction]

  return (
    <span className={cn('flex items-center justify-end gap-2 whitespace-nowrap')}>
      {rank.base ? (
        <span className={cn('opacity-55')}>
          <FitScoreBadge rank={rank.base} score={fitScore.base ?? 0} />
        </span>
      ) : (
        <span className={cn('text-xs text-muted')}>{t('no_value')}</span>
      )}
      <span aria-hidden="true" className={cn('text-muted')}>
        →
      </span>
      {rank.target ? (
        <FitScoreBadge rank={rank.target} score={fitScore.target ?? 0} />
      ) : (
        <span className={cn('text-xs text-muted')}>{t('no_value')}</span>
      )}
      <Icon
        size={14}
        weight="bold"
        aria-hidden="true"
        className={cn(SENTIMENT_TEXT_CLASSES[rank.sentiment])}
      />
    </span>
  )
}
