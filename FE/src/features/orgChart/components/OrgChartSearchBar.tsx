import { MagnifyingGlass } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { ALL_DEPARTMENTS } from '../data/orgChart.constants'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { Department } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface OrgChartSearchBarProps {
  query: string
  departmentId: string
  departments: Department[]
  shown: number
  total: number
  onQueryChange: (query: string) => void
  onDepartmentChange: (departmentId: string) => void
}

export const OrgChartSearchBar = ({
  query,
  departmentId,
  departments,
  shown,
  total,
  onQueryChange,
  onDepartmentChange,
}: OrgChartSearchBarProps) => {
  const { t } = useTranslation('org_chart')
  const labels = useDomainLabels()

  return (
    <div className={cn('flex flex-wrap items-center gap-3')}>
      <label
        className={cn(
          'flex h-10 min-w-64 flex-1 items-center gap-2 rounded-full border border-hairline-strong',
          'bg-canvas px-4 transition focus-within:border-indigo',
        )}
      >
        <MagnifyingGlass size={17} className={cn('shrink-0 text-muted')} />
        <input
          type="search"
          value={query}
          aria-label={t('search_label')}
          placeholder={t('search_placeholder')}
          onChange={(event) => onQueryChange(event.target.value)}
          className={cn('w-full bg-transparent text-sm text-ink outline-none')}
        />
      </label>

      <select
        value={departmentId}
        aria-label={t('department_filter_label')}
        onChange={(event) => onDepartmentChange(event.target.value)}
        className={cn(
          'h-10 rounded-full border border-hairline bg-surface px-4 text-sm text-ink',
          'focus:border-indigo',
        )}
      >
        <option value={ALL_DEPARTMENTS}>{t('department_filter_all')}</option>
        {departments.map((department) => (
          <option key={department.department_id} value={department.department_id}>
            {labels.departmentPath(department)}
          </option>
        ))}
      </select>

      <span className={cn('text-xs tabular-nums text-muted')}>
        {t('result_summary', { shown, total })}
      </span>
    </div>
  )
}
