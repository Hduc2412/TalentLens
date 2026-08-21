import { ChartPolar } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { DeltaCell } from './DeltaCell'
import { RankDeltaCell } from './RankDeltaCell'
import { useComparisonStore } from '../store/comparison.store'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { Department } from '@/types/domain.types'
import type { CategoryDelta, EmployeeDiff } from '../types/comparison.types'
import { cn } from '@/utils/cn'

const CELL = 'px-3 py-2 align-middle'
const HEAD = 'px-3 py-2 text-left text-xs font-medium text-muted'

interface DiffTableProps {
  rows: EmployeeDiff[]
  departments: Department[]
  canViewSensitive: boolean
}

export const DiffTable = ({ rows, departments, canViewSensitive }: DiffTableProps) => {
  const { t } = useTranslation('comparison')
  const focusedEmployeeId = useComparisonStore((state) => state.focusedEmployeeId)
  const focusEmployee = useComparisonStore((state) => state.focusEmployee)

  if (rows.length === 0) {
    return (
      <p
        className={cn(
          'rounded-xl border border-dashed border-hairline bg-surface px-4 py-3 text-sm text-muted',
        )}
      >
        {t('no_rows')}
      </p>
    )
  }

  return (
    <div
      className={cn('scroll-slim overflow-x-auto rounded-2xl border border-hairline bg-surface')}
    >
      <table className={cn('w-full min-w-4xl border-collapse text-sm')}>
        <caption className={cn('sr-only')}>{t('table_caption')}</caption>
        <thead>
          <tr className={cn('border-b border-hairline')}>
            <th scope="col" className={cn(HEAD)}>
              {t('col_employee')}
            </th>
            <th scope="col" className={cn(HEAD)}>
              {t('col_department')}
            </th>
            <th scope="col" className={cn(HEAD)}>
              {t('col_role')}
            </th>
            <th scope="col" className={cn(HEAD, 'text-right')}>
              {t('col_rank')}
            </th>
            <th scope="col" className={cn(HEAD, 'text-right')}>
              {t('col_fit')}
            </th>
            <th scope="col" className={cn(HEAD, 'text-right')}>
              {t('col_stress')}
            </th>
            <th scope="col" className={cn(HEAD, 'text-right')}>
              <span className={cn('sr-only')}>{t('col_radar')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <DiffRow
              key={row.employeeId}
              row={row}
              departments={departments}
              canViewSensitive={canViewSensitive}
              isFocused={focusedEmployeeId === row.employeeId}
              onFocus={focusEmployee}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface DiffRowProps {
  row: EmployeeDiff
  departments: Department[]
  canViewSensitive: boolean
  isFocused: boolean
  onFocus: (employeeId: string | null) => void
}

const DiffRow = ({ row, departments, canViewSensitive, isFocused, onFocus }: DiffRowProps) => {
  const { t } = useTranslation('comparison')
  const labels = useDomainLabels()

  const departmentLabel = (departmentId: string | null): string | null => {
    if (!departmentId) return null
    const department = departments.find((item) => item.department_id === departmentId)
    return department ? labels.departmentName(department) : departmentId
  }

  return (
    <tr
      className={cn(
        'border-b border-hairline last:border-b-0 transition',
        isFocused ? 'bg-indigo/5' : 'hover:bg-soft',
      )}
    >
      <th scope="row" className={cn(CELL, 'text-left font-normal')}>
        <span className={cn('flex flex-col')}>
          <span className={cn('flex items-center gap-2')}>
            <span className={cn('font-medium text-ink')}>{row.nameKanji}</span>
            <StatusChip status={row.status} />
          </span>
          <small className={cn('text-xs text-muted')}>{row.employeeId}</small>
        </span>
      </th>

      <td className={cn(CELL)}>
        <CategoryCell
          delta={{
            base: departmentLabel(row.department.base),
            target: departmentLabel(row.department.target),
            changed: row.department.changed,
          }}
        />
      </td>

      <td className={cn(CELL)}>
        <CategoryCell
          delta={{
            base: row.role.base ? labels.role(row.role.base) : null,
            target: row.role.target ? labels.role(row.role.target) : null,
            changed: row.role.changed,
          }}
        />
      </td>

      <td className={cn(CELL, 'text-right')}>
        <RankDeltaCell rank={row.rank} fitScore={row.fitScore} />
      </td>

      <td className={cn(CELL, 'text-right')}>
        <DeltaCell metric={row.fitScore} />
      </td>

      <td className={cn(CELL, 'text-right')}>
        <DeltaCell metric={row.stress} gatedLabel={canViewSensitive ? undefined : t('gated')} />
      </td>

      <td className={cn(CELL, 'text-right')}>
        <button
          type="button"
          onClick={() => onFocus(isFocused ? null : row.employeeId)}
          aria-pressed={isFocused}
          aria-label={t('open_radar', { id: row.employeeId, name: row.nameKanji })}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-full border transition',
            isFocused
              ? 'border-indigo bg-indigo/10 text-indigo'
              : 'border-hairline text-muted hover:border-indigo hover:text-indigo',
          )}
        >
          <ChartPolar size={16} />
        </button>
      </td>
    </tr>
  )
}

/** Unchanged values collapse to a single reading; only a real move shows the arrow. */
const CategoryCell = ({ delta }: { delta: CategoryDelta }) => {
  const { t } = useTranslation('comparison')

  if (!delta.changed) {
    return (
      <span className={cn('truncate text-muted')}>
        {delta.target ?? delta.base ?? t('no_value')}
      </span>
    )
  }

  return (
    <span className={cn('flex flex-wrap items-center gap-1 text-xs')}>
      <span className={cn('text-muted line-through')}>{delta.base}</span>
      <span aria-hidden="true" className={cn('text-muted')}>
        →
      </span>
      <span className={cn('font-medium text-indigo')}>{delta.target}</span>
    </span>
  )
}

const StatusChip = ({ status }: { status: EmployeeDiff['status'] }) => {
  const { t } = useTranslation('comparison')
  if (status === 'present') return null

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'joined' ? 'bg-good-soft text-good' : 'bg-soft text-muted',
      )}
    >
      {status === 'joined' ? t('status_joined') : t('status_left')}
    </span>
  )
}
