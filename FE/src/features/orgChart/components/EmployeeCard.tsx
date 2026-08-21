import { useTranslation } from 'react-i18next'

import { TONE_RAIL_CLASSES, rankTone } from '../data/orgChart.constants'
import { EmployeeAvatar } from './EmployeeAvatar'
import { FitScoreBadge } from './FitScoreBadge'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { Department, EmployeeSummary } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface EmployeeCardProps {
  employee: EmployeeSummary
  departments: Department[]
  canEdit: boolean
  onSelect: (employeeId: string) => void
  onMove: (employeeId: string, departmentId: string) => void
  onDragStart: (employeeId: string) => void
}

export const EmployeeCard = ({
  employee,
  departments,
  canEdit,
  onSelect,
  onMove,
  onDragStart,
}: EmployeeCardProps) => {
  const { t } = useTranslation('org_chart')
  const labels = useDomainLabels()
  const tone = rankTone(employee.fit_rank)

  return (
    <article
      draggable={canEdit}
      onDragStart={() => onDragStart(employee.employee_id)}
      className={cn(
        'rounded-xl border border-l-4 border-hairline bg-surface p-3 shadow-small transition',
        'hover:border-hairline-strong hover:shadow-island',
        TONE_RAIL_CLASSES[tone],
        canEdit && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(employee.employee_id)}
        aria-label={t('open_profile', { id: employee.employee_id, name: employee.name_kanji })}
        className={cn('flex w-full items-start gap-3 text-left')}
      >
        <EmployeeAvatar employeeId={employee.employee_id} nameKanji={employee.name_kanji} />
        <span className={cn('min-w-0 flex-1')}>
          <span className={cn('flex items-center gap-2')}>
            <span className={cn('truncate text-sm font-semibold text-ink')}>
              {employee.employee_id}: {employee.name_kanji}
            </span>
          </span>
          <span className={cn('mt-0.5 block truncate text-xs text-muted')}>
            {employee.name_kana} · {labels.role(employee.role)}
          </span>
          <span className={cn('mt-2 flex flex-wrap gap-1')}>
            <EmployeeTag label={labels.mbti(employee.mbti_type)} />
            <EmployeeTag label={labels.socialStyle(employee.social_style)} />
          </span>
        </span>
        <FitScoreBadge rank={employee.fit_rank} score={employee.fit_score} />
      </button>

      <select
        value=""
        disabled={!canEdit}
        aria-label={t('move_department', { id: employee.employee_id })}
        onChange={(event) => onMove(employee.employee_id, event.target.value)}
        className={cn(
          'mt-3 w-full rounded-full border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted',
          'focus:border-indigo disabled:opacity-50',
        )}
      >
        <option value="">{t('move_placeholder')}</option>
        {departments
          .filter((item) => item.department_id !== employee.department_id)
          .map((item) => (
            <option key={item.department_id} value={item.department_id}>
              {labels.departmentPath(item)}
            </option>
          ))}
      </select>
    </article>
  )
}

const EmployeeTag = ({ label }: { label: string }) => (
  <span className={cn('truncate rounded-full bg-soft px-2 py-0.5 text-xs text-muted')}>
    {label}
  </span>
)
