import { useTranslation } from 'react-i18next'

import { BIG_FIVE_KEYS, CULTURE_KEYS, RADAR_TRAIT_KEYS } from '../data/employeeProfile.constants'
import { RadarChart } from './RadarChart'
import { ScoreBar } from './ScoreBar'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { EmployeeDetail } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface CompetencyViewProps {
  employee: EmployeeDetail
}

export const CompetencyView = ({ employee }: CompetencyViewProps) => {
  const { t } = useTranslation('employee_profile')
  const labels = useDomainLabels()

  const radarEntries = RADAR_TRAIT_KEYS.map((key) => ({
    key,
    value: employee.traits[key] ?? 0,
  }))

  // The full trait sheet, ordered as the source workbook stores it.
  const businessSkillKeys = Object.keys(employee.traits)

  return (
    <div className={cn('flex flex-col gap-6')}>
      <section className={cn('flex flex-col gap-2')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('radar_title')}</h3>
        <RadarChart entries={radarEntries} employeeName={employee.name_kanji} />
      </section>

      <section className={cn('flex flex-col gap-3')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('big_five_title')}</h3>
        {BIG_FIVE_KEYS.map((key) => (
          <ScoreBar key={key} label={labels.bigFive(key)} value={employee.big_five[key] ?? 0} />
        ))}
      </section>

      <section className={cn('flex flex-col gap-3')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('culture_title')}</h3>
        {CULTURE_KEYS.map((key) => (
          <ScoreBar
            key={key}
            label={labels.culture(key)}
            value={employee.culture[key] ?? 0}
            barClassName={cn('bg-cyan')}
          />
        ))}
      </section>

      <section className={cn('flex flex-col gap-2')}>
        <h3 className={cn('text-sm font-semibold text-ink')}>{t('business_skills_title')}</h3>
        <p className={cn('text-xs text-muted')}>
          {t('business_skills_caption', { count: businessSkillKeys.length })}
        </p>
        {/* A meter each would be 36 bars of noise; the sheet reads as a table. */}
        <ul className={cn('grid gap-x-4 gap-y-1 sm:grid-cols-2')}>
          {businessSkillKeys.map((key) => (
            <li key={key} className={cn('flex items-baseline justify-between gap-2 text-xs')}>
              <span className={cn('truncate text-muted')}>{labels.trait(key)}</span>
              <span className={cn('shrink-0 tabular-nums text-ink')}>{employee.traits[key]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
