import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { ComparisonSummaryCards } from './ComparisonSummaryCards'
import { DiffTable } from './DiffTable'
import { PeriodFilterBar } from './PeriodFilterBar'
import { RadarComparisonChart } from './RadarComparisonChart'
import { COMPARISON_SOURCES, DIFF_FILTERS } from '../data/comparison.constants'
import { useComparisonData } from '../hooks/useComparisonData'
import { useComparisonDiff } from '../hooks/useComparisonDiff'
import { useDraftSubjects } from '../hooks/useDraftSubjects'
import { useComparisonStore } from '../store/comparison.store'
import type { EmployeeDiff } from '../types/comparison.types'
import { LoadState } from '@/components/ui/LoadState'
import { useOrgChartStore } from '@/features/orgChart'
import { useAuth } from '@/features/auth'
import type { EvaluationPeriod } from '@/types/domain.types'
import { usePeriodLabel } from '@/i18n/usePeriodLabel'
import { cn } from '@/utils/cn'

export const ComparisonPage = () => {
  const { t } = useTranslation('comparison')
  const source = useComparisonStore((state) => state.source)
  const isDraft = source === 'draft'

  const periodData = useComparisonData()
  const draft = useDraftSubjects(isDraft)

  const { summary, rows, visibleRows } = useComparisonDiff(
    isDraft ? draft.base : (periodData.baseSnapshot?.employees ?? null),
    isDraft ? draft.target : (periodData.targetSnapshot?.employees ?? null),
  )

  const departments = useOrgChartStore((state) => state.departments)
  const focusedEmployeeId = useComparisonStore((state) => state.focusedEmployeeId)
  const focusEmployee = useComparisonStore((state) => state.focusEmployee)

  const { canViewSensitiveData: canViewSensitive } = useAuth()
  const focusedRow = rows.find((row) => row.employeeId === focusedEmployeeId) ?? null
  const periodLabelOf = usePeriodLabel()

  const { periods, baseSnapshot, targetSnapshot, reload } = periodData
  const loading = isDraft ? draft.loading : periodData.loading
  const error = isDraft ? draft.error : periodData.error
  const periodOf = (periodId: string | undefined): EvaluationPeriod | null =>
    periods.find((period) => period.period_id === periodId) ?? null

  return (
    <section className={cn('flex flex-col gap-4')}>
      <header className={cn('flex flex-col gap-1')}>
        <h1 className={cn('text-lg font-semibold text-ink')}>{t('page_title')}</h1>
        <p className={cn('text-sm text-muted')}>{t('page_subtitle')}</p>
      </header>

      <SourceSwitch />

      {/* The period selectors only mean anything when periods are the subject. */}
      {!isDraft && <PeriodFilterBar periods={periods} />}
      {isDraft && <p className={cn('text-xs text-muted')}>{t('draft_hint')}</p>}

      <LoadState loading={loading} error={error} onRetry={reload} />

      {!loading && !error && (
        <>
          <ComparisonSummaryCards summary={summary} />

          <div className={cn('flex flex-col gap-3')}>
            <div className={cn('flex flex-wrap items-center justify-between gap-3')}>
              <h2 className={cn('text-sm font-semibold text-ink')}>{t('table_title')}</h2>
              <DiffToolbar shown={visibleRows.length} total={rows.length} />
            </div>

            <div className={cn('flex flex-col gap-4 xl:flex-row xl:items-start')}>
              <div className={cn('min-w-0 flex-1')}>
                <DiffTable
                  rows={visibleRows}
                  departments={departments}
                  canViewSensitive={canViewSensitive}
                />
              </div>

              <RadarPanel
                row={focusedRow}
                subtitle={
                  isDraft
                    ? `${t('source_baseline')} → ${t('source_draft')}`
                    : [periodOf(baseSnapshot?.period_id), periodOf(targetSnapshot?.period_id)]
                        .map((period) => (period ? periodLabelOf(period) : t('no_value')))
                        .join(' → ')
                }
                onClose={() => focusEmployee(null)}
              />
            </div>
          </div>
        </>
      )}
    </section>
  )
}

const DiffToolbar = ({ shown, total }: { shown: number; total: number }) => {
  const { t } = useTranslation('comparison')
  const filter = useComparisonStore((state) => state.filter)
  const setFilter = useComparisonStore((state) => state.setFilter)
  const query = useComparisonStore((state) => state.query)
  const setQuery = useComparisonStore((state) => state.setQuery)

  return (
    <div className={cn('flex flex-wrap items-center gap-2')}>
      <label
        className={cn(
          'flex h-9 min-w-56 items-center gap-2 rounded-full border border-hairline-strong',
          'bg-canvas px-3 transition focus-within:border-indigo',
        )}
      >
        <MagnifyingGlass size={15} className={cn('shrink-0 text-muted')} />
        <input
          type="search"
          value={query}
          aria-label={t('search_label')}
          placeholder={t('search_placeholder')}
          onChange={(event) => setQuery(event.target.value)}
          className={cn('w-full bg-transparent text-sm text-ink outline-none')}
        />
      </label>

      <div role="group" aria-label={t('filter_label')} className={cn('flex flex-wrap gap-1')}>
        {DIFF_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition',
              filter === value
                ? 'border-indigo bg-indigo/10 font-medium text-indigo'
                : 'border-hairline text-muted hover:border-indigo hover:text-indigo',
            )}
          >
            {t(`filter_${value}`)}
          </button>
        ))}
      </div>

      <span className={cn('text-xs tabular-nums text-muted')}>
        {t('row_count', { shown, total })}
      </span>
    </div>
  )
}

const PANEL = 'rounded-2xl border border-hairline bg-surface p-4 shadow-small xl:w-96 xl:shrink-0'

interface RadarPanelProps {
  row: EmployeeDiff | null
  /** Which two sides the overlay is showing, already localised. */
  subtitle: string
  onClose: () => void
}

const RadarPanel = ({ row, subtitle, onClose }: RadarPanelProps) => {
  const { t } = useTranslation('comparison')
  const { t: tCommon } = useTranslation('common')

  if (!row) {
    return (
      <aside className={cn(PANEL, 'flex flex-col gap-2')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('radar_title')}</h3>
        <p className={cn('text-xs text-muted')}>{t('radar_hint')}</p>
      </aside>
    )
  }

  return (
    <aside className={cn(PANEL, 'flex flex-col gap-3')}>
      <div className={cn('flex items-start justify-between gap-3')}>
        <div className={cn('min-w-0')}>
          <h3 className={cn('truncate text-sm font-semibold text-ink')}>{row.nameKanji}</h3>
          <p className={cn('truncate text-xs text-muted')}>{subtitle}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={tCommon('close')}>
          <X size={18} className={cn('text-muted')} />
        </button>
      </div>

      <RadarComparisonChart
        base={row.baseEmployee}
        target={row.targetEmployee}
        employeeName={row.nameKanji}
      />
    </aside>
  )
}

/** Two closed periods, or the unsaved simulation against the committed baseline. */
const SourceSwitch = () => {
  const { t } = useTranslation('comparison')
  const source = useComparisonStore((state) => state.source)
  const setSource = useComparisonStore((state) => state.setSource)

  return (
    <div role="group" aria-label={t('source_label')} className={cn('flex flex-wrap gap-1')}>
      {COMPARISON_SOURCES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setSource(value)}
          aria-pressed={source === value}
          className={cn(
            'rounded-full border px-4 py-1.5 text-xs transition',
            source === value
              ? 'border-indigo bg-indigo/10 font-medium text-indigo'
              : 'border-hairline text-muted hover:border-indigo hover:text-indigo',
          )}
        >
          {t(`source_${value}`)}
        </button>
      ))}
    </div>
  )
}
