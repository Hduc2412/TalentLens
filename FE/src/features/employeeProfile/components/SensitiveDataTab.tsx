import { useTranslation } from 'react-i18next'

import {
  DARK_TRIAD_KEYS,
  JUDGEMENT_TONE_CLASSES,
  STRESS_KEYS,
  TOLERANCE_KEYS,
} from '../data/employeeProfile.constants'
import { ScoreBar } from './ScoreBar'
import { SensitiveLockNotice } from './SensitiveLockNotice'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { SensitiveData, UserRole } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface SensitiveDataTabProps {
  sensitiveData: SensitiveData | null
  canView: boolean
  role: UserRole
}

const judgementTone = (value: number): string =>
  JUDGEMENT_TONE_CLASSES[Math.min(Math.max(Math.round(value), 0), 2)]

export const SensitiveDataTab = ({ sensitiveData, canView, role }: SensitiveDataTabProps) => {
  const { t } = useTranslation('employee_profile')
  const labels = useDomainLabels()

  // Two independent gates: the caller's role, and whether the backend actually
  // returned the protected block. Either one missing means the lock stays on.
  if (!canView || !sensitiveData) return <SensitiveLockNotice role={role} />

  const mentalIndex = Math.min(Math.max(Math.round(sensitiveData.mental_status), 0), 2)

  return (
    <div className={cn('flex flex-col gap-6')}>
      <Section title={t('dark_triad_title')}>
        {DARK_TRIAD_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={labels.sensitive(key)}
            value={sensitiveData[key].score}
            rank={sensitiveData[key].rank}
            barClassName={cn('bg-low')}
          />
        ))}
      </Section>

      <Section title={t('stress_title')}>
        {STRESS_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={labels.sensitive(key)}
            value={sensitiveData[key].score}
            rank={sensitiveData[key].rank}
            barClassName={cn('bg-medium')}
          />
        ))}
      </Section>

      <Section title={t('mental_title')}>
        <p className={cn('text-sm font-semibold', judgementTone(mentalIndex))}>
          {t(`mental_status_${mentalIndex}`)}
        </p>
      </Section>

      <Section title={t('tolerance_title')}>
        <dl className={cn('grid grid-cols-3 gap-2')}>
          {TOLERANCE_KEYS.map((key) => {
            const level = Math.min(
              Math.max(Math.round(sensitiveData.stress_tolerance[key] ?? 0), 0),
              2,
            )
            return (
              <div key={key} className={cn('rounded-lg bg-soft px-3 py-2')}>
                <dt className={cn('truncate text-xs text-muted')}>{labels.sensitive(key)}</dt>
                <dd className={cn('text-xs font-semibold', judgementTone(level))}>
                  {t(`tolerance_${level}`)}
                </dd>
              </div>
            )
          })}
        </dl>
      </Section>

      <Section title={t('cautions_title')}>
        {sensitiveData.cautions.length === 0 && (
          <p className={cn('text-xs text-muted')}>{t('no_cautions')}</p>
        )}
        {sensitiveData.cautions.map((caution) => (
          <ScoreBar
            key={caution.label}
            label={caution.label}
            value={caution.score}
            barClassName={cn('bg-medium')}
          />
        ))}
      </Section>

      <p className={cn('text-xs text-muted')}>{t('protected_notice')}</p>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className={cn('flex flex-col gap-3')}>
    <h3 className={cn('text-sm font-semibold text-ink')}>{title}</h3>
    {children}
  </section>
)
