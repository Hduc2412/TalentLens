import { ArrowDown, ArrowUp, Minus } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { SENTIMENT_CHIP_CLASSES } from '../data/comparison.constants'
import type { DeltaDirection, MetricDelta } from '../types/comparison.types'
import { cn } from '@/utils/cn'

const DIRECTION_ICONS: Record<DeltaDirection, typeof ArrowUp> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
}

const format = (value: number | null, fallback: string): string =>
  value === null ? fallback : String(value)

interface DeltaCellProps {
  metric: MetricDelta
  /** Metrics behind the HR_ADMIN gate render a restricted marker, not a zero. */
  gatedLabel?: string
}

/**
 * `base → target` with the change beside it. The arrow reports the raw direction
 * and the colour reports whether that direction was good, which is why a rising
 * stress load shows an up arrow in red.
 */
export const DeltaCell = ({ metric, gatedLabel }: DeltaCellProps) => {
  const { t } = useTranslation('comparison')
  const fallback = t('no_value')

  if (metric.base === null && metric.target === null) {
    return <span className={cn('text-xs text-muted')}>{gatedLabel ?? fallback}</span>
  }

  const Icon = DIRECTION_ICONS[metric.direction]
  const magnitude = metric.delta === null ? null : Math.abs(metric.delta)

  return (
    <span className={cn('flex items-center justify-end gap-2 whitespace-nowrap')}>
      <span className={cn('tabular-nums text-muted')}>{format(metric.base, fallback)}</span>
      <span aria-hidden="true" className={cn('text-muted')}>
        →
      </span>
      <span className={cn('tabular-nums font-medium text-ink')}>
        {format(metric.target, fallback)}
      </span>
      <span
        className={cn(
          'inline-flex min-w-14 items-center justify-center gap-1 rounded-full px-2 py-0.5',
          'text-xs font-semibold tabular-nums',
          SENTIMENT_CHIP_CLASSES[metric.sentiment],
        )}
      >
        <Icon size={12} weight="bold" aria-hidden="true" />
        {magnitude === null ? fallback : magnitude}
      </span>
    </span>
  )
}
