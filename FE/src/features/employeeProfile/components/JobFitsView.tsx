import { Briefcase } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { JOB_MODEL_KEYS } from '@/data/jobModels'
import { FitScoreBadge } from '@/features/orgChart'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { EmployeeDetail, FitRank, JobFit } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface JobFitsViewProps {
  employee: EmployeeDetail
  /** Fit history across evaluation periods, oldest first; empty while loading. */
  history: readonly JobFitHistoryEntry[]
}

export interface JobFitHistoryEntry {
  periodId: string
  periodLabel: string
  fitScore: number
  fitRank: FitRank
}

interface RankedJobFit {
  key: string
  fit: JobFit
  /** 1-based position once every model is sorted by integrated score. */
  position: number
  isAssigned: boolean
}

/** Highest integrated score first: the ranking is the point of this table. */
const rankJobFits = (employee: EmployeeDetail): RankedJobFit[] =>
  JOB_MODEL_KEYS.flatMap((key) => {
    // A model the backend has no score for is omitted, never ranked as zero.
    const fit: JobFit | undefined = employee.job_fits[key]
    return fit ? [{ key: key as string, fit }] : []
  })
    .sort((left, right) => right.fit.integrated - left.fit.integrated)
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
      isAssigned: entry.key === employee.job_key,
    }))

export const JobFitsView = ({ employee, history }: JobFitsViewProps) => {
  const { t } = useTranslation('employee_profile')
  const ranked = rankJobFits(employee)

  return (
    <div className={cn('flex flex-col gap-6')}>
      <section className={cn('flex flex-col gap-2')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('job_fits_title')}</h3>
        <p className={cn('text-xs text-muted')}>
          {t('job_fits_caption', { count: ranked.length })}
        </p>

        <table className={cn('w-full border-collapse text-xs')}>
          <thead>
            <tr className={cn('border-b border-hairline text-muted')}>
              <th scope="col" className={cn('py-1.5 text-left font-medium')}>
                {t('job_model')}
              </th>
              <th scope="col" className={cn('py-1.5 text-right font-medium')}>
                {t('job_fit')}
              </th>
              <th scope="col" className={cn('py-1.5 text-right font-medium')}>
                {t('culture_fit')}
              </th>
              <th scope="col" className={cn('py-1.5 text-right font-medium')}>
                {t('integrated_fit')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry) => (
              <JobFitRow key={entry.key} entry={entry} />
            ))}
          </tbody>
        </table>
      </section>

      <section className={cn('flex flex-col gap-2')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('history_title')}</h3>
        {history.length === 0 ? (
          <p className={cn('text-xs text-muted')}>{t('history_empty')}</p>
        ) : (
          <ol className={cn('flex flex-col gap-2')}>
            {history.map((entry, index) => (
              <HistoryRow
                key={entry.periodId}
                entry={entry}
                previous={history[index - 1] ?? null}
              />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

const JobFitRow = ({ entry }: { entry: RankedJobFit }) => {
  const { t } = useTranslation('employee_profile')
  const labels = useDomainLabels()

  return (
    <tr className={cn('border-b border-hairline last:border-b-0')}>
      <th scope="row" className={cn('py-1.5 pr-2 text-left font-normal')}>
        <span className={cn('flex items-center gap-1.5')}>
          <span className={cn('w-4 shrink-0 tabular-nums text-muted')}>{entry.position}</span>
          <span
            className={cn('truncate', entry.isAssigned ? 'font-medium text-ink' : 'text-muted')}
          >
            {labels.job(entry.key)}
          </span>
          {entry.isAssigned && (
            <span
              title={t('assigned_job')}
              className={cn('inline-flex shrink-0 items-center text-indigo')}
            >
              <Briefcase size={13} weight="fill" />
              <span className={cn('sr-only')}>{t('assigned_job')}</span>
            </span>
          )}
        </span>
      </th>
      <td className={cn('py-1.5 text-right tabular-nums text-muted')}>{entry.fit.job_fit}</td>
      <td className={cn('py-1.5 text-right tabular-nums text-muted')}>{entry.fit.culture_fit}</td>
      <td className={cn('py-1.5 pl-2 text-right')}>
        <FitScoreBadge rank={entry.fit.rank} score={entry.fit.integrated} />
      </td>
    </tr>
  )
}

interface HistoryRowProps {
  entry: JobFitHistoryEntry
  /** The preceding period, so each row can state its own movement. */
  previous: JobFitHistoryEntry | null
}

const HistoryRow = ({ entry, previous }: HistoryRowProps) => {
  const { t } = useTranslation('employee_profile')
  const delta = previous ? Math.round((entry.fitScore - previous.fitScore) * 100) / 100 : null

  return (
    <li className={cn('flex items-center justify-between gap-3 text-xs')}>
      <span className={cn('truncate text-muted')}>{entry.periodLabel}</span>
      <span className={cn('flex shrink-0 items-center gap-2')}>
        {delta !== null && delta !== 0 && (
          <span className={cn('tabular-nums', delta > 0 ? 'text-good' : 'text-low')}>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
        {delta === 0 && <span className={cn('text-muted')}>{t('history_flat')}</span>}
        <FitScoreBadge rank={entry.fitRank} score={entry.fitScore} />
      </span>
    </li>
  )
}
