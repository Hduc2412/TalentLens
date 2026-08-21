import { X } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { FitScoreBadge } from '@/features/orgChart'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { EmployeeSummary, JobFit } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface ProfileHeaderProps {
  employee: EmployeeSummary
  jobFit: JobFit | null
  onClose: () => void
}

export const ProfileHeader = ({ employee, jobFit, onClose }: ProfileHeaderProps) => {
  const { t } = useTranslation('employee_profile')
  const { t: tCommon } = useTranslation('common')
  const labels = useDomainLabels()

  return (
    <header className={cn('flex flex-col gap-3 border-b border-hairline p-5')}>
      <div className={cn('flex items-start justify-between gap-3')}>
        <div className={cn('min-w-0')}>
          <span className={cn('text-xs uppercase text-muted')}>{t('subtitle_360')}</span>
          <h2 id="employee-profile-title" className={cn('truncate text-lg font-semibold text-ink')}>
            {employee.name_kanji}
          </h2>
          <p className={cn('truncate text-xs text-muted')}>
            {employee.name_kana} · {employee.employee_id} · {labels.role(employee.role)}
          </p>
          <p className={cn('mt-1 flex flex-wrap gap-1 text-xs text-muted')}>
            <Chip label={labels.mbti(employee.mbti_type)} />
            <Chip label={labels.socialStyle(employee.social_style)} />
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={tCommon('close')}>
          <X size={20} className={cn('text-muted')} />
        </button>
      </div>

      <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2')}>
        <FitScoreBadge rank={employee.fit_rank} score={employee.fit_score} />
        {jobFit && (
          <>
            <Metric label={t('job_fit')} value={jobFit.job_fit} />
            <Metric label={t('culture_fit')} value={jobFit.culture_fit} />
            <Metric label={t('integrated_fit')} value={jobFit.integrated} />
          </>
        )}
      </div>
    </header>
  )
}

const Chip = ({ label }: { label: string }) => (
  <span className={cn('truncate rounded-full bg-soft px-2 py-0.5')}>{label}</span>
)

const Metric = ({ label, value }: { label: string; value: number }) => (
  <span className={cn('flex flex-col')}>
    <span className={cn('text-xs text-muted')}>{label}</span>
    <strong className={cn('text-sm tabular-nums text-ink')}>{value}</strong>
  </span>
)
