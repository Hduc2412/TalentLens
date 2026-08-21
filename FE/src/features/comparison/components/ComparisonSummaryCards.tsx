import { ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { SENTIMENT_TEXT_CLASSES } from '../data/comparison.constants'
import type { ComparisonSummary, DeltaSentiment, MetricDelta } from '../types/comparison.types'
import { cn } from '@/utils/cn'

const ICONS = { up: ArrowUp, down: ArrowDown, flat: Minus } as const

const CARD =
  'flex flex-col gap-1 rounded-2xl border border-hairline bg-surface px-4 py-3 shadow-small'

/**
 * A headline number with its change — a stat tile, not a one-bar chart. Each
 * metric declares its own polarity, so "average stress rose" is red, not green.
 */
const MetricTile = ({
  label,
  metric,
  hint,
}: {
  label: string
  metric: MetricDelta
  hint?: string
}) => {
  const { t } = useTranslation('comparison')
  const Icon = ICONS[metric.direction]
  const magnitude = metric.delta === null ? null : Math.abs(metric.delta)

  return (
    <article className={cn(CARD)}>
      <span className={cn('text-xs text-muted')}>{label}</span>
      <strong className={cn('text-2xl tabular-nums text-ink')}>
        {metric.target ?? t('no_value')}
      </strong>
      <span
        className={cn(
          'flex items-center gap-1 text-xs font-medium tabular-nums',
          SENTIMENT_TEXT_CLASSES[metric.sentiment],
        )}
      >
        <Icon size={12} weight="bold" aria-hidden="true" />
        {magnitude === null ? t('no_value') : magnitude}
        <span className={cn('font-normal text-muted')}>({metric.base ?? t('no_value')})</span>
      </span>
      {hint && <small className={cn('text-xs text-muted')}>{hint}</small>}
    </article>
  )
}

const CountTile = ({
  label,
  count,
  sentiment,
}: {
  label: string
  count: number
  sentiment: DeltaSentiment
}) => {
  const { t } = useTranslation('comparison')

  return (
    <article className={cn(CARD)}>
      <span className={cn('text-xs text-muted')}>{label}</span>
      <strong className={cn('text-2xl tabular-nums', SENTIMENT_TEXT_CLASSES[sentiment])}>
        {count}
      </strong>
      <small className={cn('text-xs text-muted')}>{t('summary_people', { count })}</small>
    </article>
  )
}

export const ComparisonSummaryCards = ({ summary }: { summary: ComparisonSummary }) => {
  const { t } = useTranslation('comparison')

  return (
    <section aria-label={t('summary_title')} className={cn('flex flex-col gap-2')}>
      <h2 className={cn('text-sm font-semibold text-ink')}>{t('summary_title')}</h2>
      <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3')}>
        <MetricTile label={t('summary_headcount')} metric={summary.headcount} />
        <MetricTile label={t('summary_average_fit')} metric={summary.averageFit} />
        <MetricTile
          label={t('summary_average_stress')}
          metric={summary.averageStress}
          hint={t('summary_stress_hint')}
        />
        <CountTile label={t('summary_rank_up')} count={summary.rankUp} sentiment="better" />
        <CountTile label={t('summary_rank_down')} count={summary.rankDown} sentiment="worse" />
        <CountTile
          label={t('summary_department_changes')}
          count={summary.departmentChanges}
          sentiment="neutral"
        />
      </div>
    </section>
  )
}
