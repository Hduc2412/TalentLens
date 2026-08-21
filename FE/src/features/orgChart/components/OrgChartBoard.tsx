import { useTranslation } from 'react-i18next'

import { useEmployeeSearch } from '../hooks/useEmployeeSearch'
import { useLaneDragAndDrop } from '../hooks/useLaneDragAndDrop'
import { useOrgChartStore } from '../store/orgChart.store'
import { DepartmentLane } from './DepartmentLane'
import { OrgChartSearchBar } from './OrgChartSearchBar'
import { cn } from '@/utils/cn'

interface OrgChartBoardProps {
  canEdit: boolean
  onEmployeeMoved?: (employeeId: string) => void
}

export const OrgChartBoard = ({ canEdit, onEmployeeMoved }: OrgChartBoardProps) => {
  const { t } = useTranslation('org_chart')
  const { groups, departments, summary, query, departmentId, setQuery, setDepartmentId } =
    useEmployeeSearch()
  const moveEmployee = useOrgChartStore((state) => state.moveEmployee)
  const selectEmployee = useOrgChartStore((state) => state.selectEmployee)

  const handleMove = (employeeId: string, targetDepartmentId: string) => {
    if (!canEdit || !targetDepartmentId) return
    if (moveEmployee(employeeId, targetDepartmentId)) onEmployeeMoved?.(employeeId)
  }

  const { dropTargetId, setDropTargetId, handleDragStart, handleDrop } =
    useLaneDragAndDrop(handleMove)

  return (
    <div className={cn('flex flex-col gap-4')}>
      <OrgChartSearchBar
        query={query}
        departmentId={departmentId}
        departments={departments}
        shown={summary.shown}
        total={summary.total}
        onQueryChange={setQuery}
        onDepartmentChange={setDepartmentId}
      />

      {departments.length === 0 && <BoardNotice message={t('no_departments')} />}
      {departments.length > 0 && summary.shown === 0 && <BoardNotice message={t('no_results')} />}

      {/* Masonry columns: a grid would stretch every row to its tallest lane. */}
      <div className={cn('columns-1 gap-4 lg:columns-2 xl:columns-3')}>
        {groups.map((group) => (
          <DepartmentLane
            key={group.department.department_id}
            group={group}
            departments={departments}
            canEdit={canEdit}
            isDropTarget={dropTargetId === group.department.department_id}
            onDropTargetChange={setDropTargetId}
            onDrop={handleDrop}
            onSelect={selectEmployee}
            onMove={handleMove}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  )
}

const BoardNotice = ({ message }: { message: string }) => (
  <p
    className={cn(
      'rounded-xl border border-dashed border-hairline bg-surface px-4 py-3 text-sm text-muted',
    )}
  >
    {message}
  </p>
)
