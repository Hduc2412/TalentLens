import { useTranslation } from 'react-i18next'

import { TONE_BADGE_CLASSES, rankTone } from '../data/orgChart.constants'
import type { FitRank } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface FitScoreBadgeProps {
  rank: FitRank
  score: number
  className?: string
}

export const FitScoreBadge = ({ rank, score, className }: FitScoreBadgeProps) => {
  const { t } = useTranslation('org_chart')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
        TONE_BADGE_CLASSES[rankTone(rank)],
        className,
      )}
      aria-label={t('rank_aria', { rank, score })}
    >
      <span className={cn('text-sm leading-none')}>{rank}</span>
      <span className={cn('tabular-nums opacity-80')}>{score}</span>
    </span>
  )
}
