import { ArrowsLeftRight, CalendarBlank } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { useComparisonStore } from '../store/comparison.store'
import type { EvaluationPeriod } from '@/types/domain.types'
import { usePeriodLabel } from '@/i18n/usePeriodLabel'
import { cn } from '@/utils/cn'

const SELECT = 'h-10 rounded-full border border-hairline bg-canvas px-4 text-sm text-ink'

export const PeriodFilterBar = ({ periods }: { periods: EvaluationPeriod[] }) => {
  const { t } = useTranslation('comparison')
  const periodLabel = usePeriodLabel()

  const basePeriodId = useComparisonStore((state) => state.basePeriodId)
  const targetPeriodId = useComparisonStore((state) => state.targetPeriodId)
  const setBasePeriodId = useComparisonStore((state) => state.setBasePeriodId)
  const setTargetPeriodId = useComparisonStore((state) => state.setTargetPeriodId)
  const swapPeriods = useComparisonStore((state) => state.swapPeriods)

  return (
    <div className={cn('flex flex-wrap items-end gap-3')}>
      <label className={cn('flex flex-col gap-1')}>
        <span className={cn('text-xs text-muted')}>{t('period_base')}</span>
        <span className={cn('flex items-center gap-2')}>
          <CalendarBlank size={16} className={cn('text-muted')} />
          <select
            value={basePeriodId}
            onChange={(event) => setBasePeriodId(event.target.value)}
            className={cn(SELECT)}
          >
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {periodLabel(period)}
              </option>
            ))}
          </select>
        </span>
      </label>

      <button
        type="button"
        onClick={swapPeriods}
        aria-label={t('swap_periods')}
        title={t('swap_periods')}
        className={cn(
          'mb-0.5 inline-flex size-9 items-center justify-center rounded-full border',
          'border-hairline text-muted transition hover:border-indigo hover:text-indigo',
        )}
      >
        <ArrowsLeftRight size={16} />
      </button>

      <label className={cn('flex flex-col gap-1')}>
        <span className={cn('text-xs text-muted')}>{t('period_target')}</span>
        <span className={cn('flex items-center gap-2')}>
          <CalendarBlank size={16} className={cn('text-muted')} />
          <select
            value={targetPeriodId}
            onChange={(event) => setTargetPeriodId(event.target.value)}
            className={cn(SELECT, 'border-indigo font-medium')}
          >
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {periodLabel(period)}
              </option>
            ))}
          </select>
        </span>
      </label>
    </div>
  )
}
