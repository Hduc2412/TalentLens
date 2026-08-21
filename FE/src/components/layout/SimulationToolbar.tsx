import {
  ArrowCounterClockwise,
  ArrowClockwise,
  ArrowsLeftRight,
  FloppyDisk,
  GitCommit,
  TreeStructure,
  UploadSimple,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Can, useAuth } from '@/features/auth'
import { cn } from '@/utils/cn'

/** The two boards the shell can show; the 3D network view is not built yet. */
export type ShellView = 'tree' | 'comparison'

interface SimulationToolbarProps {
  view: ShellView
  onViewChange: (view: ShellView) => void
  canEdit: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onCommit: () => void
  onImport: () => void
}

const QUIET = 'inline-flex h-9 items-center gap-2 rounded-full border border-hairline px-4 text-sm'

export const SimulationToolbar = ({
  view,
  onViewChange,
  canEdit,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onCommit,
  onImport,
}: SimulationToolbarProps) => {
  const { t } = useTranslation('shell')
  const { canApproveScenario, canEditSimulation } = useAuth()

  // The same button reads differently per capability: commit outright, request
  // approval, or nothing to do at all.
  const commitLabel = canApproveScenario
    ? t('commit')
    : canEditSimulation
      ? t('submit_for_approval')
      : t('view_only')

  return (
    <nav
      aria-label={t('toolbar_label')}
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface',
        'px-4 py-3 shadow-small',
      )}
    >
      <div role="group" aria-label={t('view_group_label')} className={cn('flex flex-wrap gap-2')}>
        <ViewTab
          active={view === 'tree'}
          onClick={() => onViewChange('tree')}
          icon={<TreeStructure size={16} />}
          label={t('view_tree_2d')}
        />
        <ViewTab
          active={view === 'comparison'}
          onClick={() => onViewChange('comparison')}
          icon={<ArrowsLeftRight size={16} />}
          label={t('view_comparison')}
        />
      </div>

      <span className={cn('grow')} />

      {/* Import is HR_ADMIN-only, so it is absent rather than disabled: a
          disabled control still advertises a capability the account lacks. */}
      <Can permission="excel:import">
        <button type="button" onClick={onImport} className={cn(QUIET)}>
          <UploadSimple size={16} />
          {t('import_excel')}
        </button>
      </Can>

      {/* Scenario actions edit the org tree, so they stay with that view. */}
      {view === 'tree' && (
        <>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo || !canEdit}
            className={cn(QUIET, 'disabled:opacity-40')}
          >
            <ArrowCounterClockwise size={16} />
            {t('undo')}
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo || !canEdit}
            className={cn(QUIET, 'disabled:opacity-40')}
          >
            <ArrowClockwise size={16} />
            {t('redo')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canEdit}
            className={cn(QUIET, 'disabled:opacity-40')}
          >
            <FloppyDisk size={16} />
            {t('save_draft')}
          </button>
          <button
            type="button"
            onClick={onCommit}
            disabled={!canEdit}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-surface',
              'bg-linear-to-r from-indigo to-cyan disabled:opacity-40',
            )}
          >
            <GitCommit size={17} />
            {commitLabel}
          </button>
        </>
      )}
    </nav>
  )
}

interface ViewTabProps {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}

const ViewTab = ({ active, onClick, icon, label }: ViewTabProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      QUIET,
      'transition',
      active ? 'border-indigo font-medium text-indigo' : 'text-muted hover:text-indigo',
    )}
  >
    {icon}
    {label}
  </button>
)
