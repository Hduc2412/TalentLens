import { UsersThree } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { EmployeeCard } from './EmployeeCard'
import { MAX_LANE_HEIGHT_CLASS } from '../data/orgChart.constants'
import type { DepartmentGroup } from '../types/orgChart.types'
import { useDomainLabels } from '@/i18n/domainLabels'
import type { Department } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface DepartmentLaneProps {
  group: DepartmentGroup
  departments: Department[]
  canEdit: boolean
  isDropTarget: boolean
  onDropTargetChange: (departmentId: string | null) => void
  onDrop: (departmentId: string) => void
  onSelect: (employeeId: string) => void
  onMove: (employeeId: string, departmentId: string) => void
  onDragStart: (employeeId: string) => void
}

export const DepartmentLane = ({
  group,
  departments,
  canEdit,
  isDropTarget,
  onDropTargetChange,
  onDrop,
  onSelect,
  onMove,
  onDragStart,
}: DepartmentLaneProps) => {
  const { department, members, averageFit } = group

  return (
    <section
      onDragOver={(event) => {
        if (!canEdit) return
        event.preventDefault()
        onDropTargetChange(department.department_id)
      }}
      onDragLeave={() => onDropTargetChange(null)}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(department.department_id)
      }}
      className={cn(
        'mb-4 flex break-inside-avoid flex-col rounded-2xl border border-hairline bg-surface',
        'shadow-small transition',
        isDropTarget && 'border-indigo shadow-island',
      )}
    >
      <LaneHeader department={department} memberCount={members.length} averageFit={averageFit} />

      <div
        className={cn('scroll-slim flex flex-col gap-2 overflow-y-auto p-3', MAX_LANE_HEIGHT_CLASS)}
      >
        {members.map((employee) => (
          <EmployeeCard
            key={employee.employee_id}
            employee={employee}
            departments={departments}
            canEdit={canEdit}
            onSelect={onSelect}
            onMove={onMove}
            onDragStart={onDragStart}
          />
        ))}
        {members.length === 0 && <LaneEmptyState />}
      </div>
    </section>
  )
}

interface LaneHeaderProps {
  department: Department
  memberCount: number
  averageFit: number | null
}

const LaneHeader = ({ department, memberCount, averageFit }: LaneHeaderProps) => {
  const { t } = useTranslation('org_chart')
  const labels = useDomainLabels()
  // Only the ancestors: repeating the leaf name under the heading is noise.
  const parentPath = labels.departmentParentPath(department)

  return (
    <header
      className={cn('flex items-start justify-between gap-3 border-b border-hairline px-4 py-3')}
    >
      <div className={cn('min-w-0')}>
        <h2 className={cn('truncate text-sm font-semibold text-ink')}>
          {labels.departmentName(department)}
        </h2>
        {parentPath && <p className={cn('truncate text-xs text-muted')}>{parentPath}</p>}
      </div>
      <div className={cn('shrink-0 text-right')}>
        <strong className={cn('block text-sm tabular-nums text-indigo')}>
          {averageFit ?? t('no_score')}
        </strong>
        <span className={cn('text-xs text-muted')}>
          {t('member_count', { count: memberCount })}
        </span>
      </div>
    </header>
  )
}

const LaneEmptyState = () => {
  const { t } = useTranslation('org_chart')

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border border-dashed border-hairline',
        'px-4 py-6 text-center',
      )}
    >
      <UsersThree size={20} className={cn('text-muted')} />
      <span className={cn('text-xs font-medium text-ink')}>{t('empty_department')}</span>
      <small className={cn('text-xs text-muted')}>{t('empty_department_hint')}</small>
    </div>
  )
}
