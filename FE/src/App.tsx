import { CheckCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/components/layout/AppHeader'
import { SimulationToolbar, type ShellView } from '@/components/layout/SimulationToolbar'
import { LoadState } from '@/components/ui/LoadState'
import { ComparisonPage } from '@/features/comparison'
import { EmployeeProfileDrawer } from '@/features/employeeProfile'
import { OrgChartBoard, useOrgChartData, useOrgChartStore } from '@/features/orgChart'
import { useScenarioShell } from '@/hooks/useScenarioShell'
import { cn } from '@/utils/cn'

export const App = () => {
  const { t } = useTranslation('shell')
  const { loading, error, reload } = useOrgChartData()
  const shell = useScenarioShell()
  const [view, setView] = useState<ShellView>('tree')

  const people = useOrgChartStore((state) => state.people)
  const selectedEmployeeId = useOrgChartStore((state) => state.selectedEmployeeId)
  const selectEmployee = useOrgChartStore((state) => state.selectEmployee)
  const selected = people.find((person) => person.employee_id === selectedEmployeeId) ?? null

  return (
    <main className={cn('flex min-h-screen flex-col gap-4 bg-canvas p-4 text-ink')}>
      <AppHeader />

      <SimulationToolbar
        view={view}
        onViewChange={setView}
        canEdit={shell.canEdit}
        canUndo={shell.canUndo}
        canRedo={shell.canRedo}
        onUndo={shell.undo}
        onRedo={shell.redo}
        onSave={shell.saveDraft}
        onCommit={shell.commitScenario}
        onImport={shell.importExcel}
      />

      {view === 'tree' && (
        <>
          <div className={cn('flex flex-wrap items-center gap-3 text-xs text-muted')}>
            <span className={cn('rounded-full bg-soft px-3 py-1 font-medium text-ink')}>
              {t(`scenario_state_${shell.scenarioState.toLowerCase()}`)}
            </span>
            <span>
              {shell.pendingChanges
                ? t('pending_changes', { count: shell.pendingChanges })
                : t('no_pending_changes')}
            </span>
            <Legend />
          </div>

          <LoadState loading={loading} error={error} onRetry={reload} />

          {!loading && !error && (
            <OrgChartBoard canEdit={shell.canEdit} onEmployeeMoved={shell.announceMove} />
          )}
        </>
      )}

      {/* The comparison page owns its own loading state, keyed off its own snapshots. */}
      {view === 'comparison' && <ComparisonPage />}

      {/* Keyed per person so tab state resets when a different profile opens. */}
      <EmployeeProfileDrawer
        key={selectedEmployeeId}
        employee={selected}
        role={shell.role}
        onClose={() => selectEmployee(null)}
      />

      {shell.notice && (
        <div
          className={cn(
            'fixed bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full',
            'border border-hairline bg-surface px-4 py-2 text-sm shadow-island',
          )}
        >
          <CheckCircle size={16} className={cn('text-good')} />
          {shell.notice}
        </div>
      )}
    </main>
  )
}

const Legend = () => {
  const { t } = useTranslation('shell')

  return (
    <span className={cn('flex flex-wrap items-center gap-3')}>
      <LegendDot className={cn('bg-good')} label={t('legend_good')} />
      <LegendDot className={cn('bg-medium')} label={t('legend_medium')} />
      <LegendDot className={cn('bg-low')} label={t('legend_low')} />
    </span>
  )
}

const LegendDot = ({ className, label }: { className: string; label: string }) => (
  <span className={cn('flex items-center gap-1')}>
    <i className={cn('size-2 rounded-full', className)} />
    {label}
  </span>
)
