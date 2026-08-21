import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth, usePrimaryRole } from '@/features/auth'
import { useOrgChartStore } from '@/features/orgChart'

export type ScenarioState = 'DRAFT' | 'SUBMITTED' | 'COMMITTED'

const NOTICE_TIMEOUT_MS = 1800

export const useScenarioShell = () => {
  const { t } = useTranslation('shell')
  const auth = useAuth()
  const role = usePrimaryRole()
  const [scenarioState, setScenarioState] = useState<ScenarioState>('DRAFT')
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const history = useOrgChartStore((state) => state.history)
  const future = useOrgChartStore((state) => state.future)
  const undo = useOrgChartStore((state) => state.undo)
  const redo = useOrgChartStore((state) => state.redo)
  const persistDraft = useOrgChartStore((state) => state.saveDraft)
  const resetSimulation = useOrgChartStore((state) => state.resetSimulation)

  useEffect(() => () => clearTimeout(noticeTimer.current ?? undefined), [])

  const flash = useCallback((message: string) => {
    setNotice(message)
    clearTimeout(noticeTimer.current ?? undefined)
    noticeTimer.current = setTimeout(() => setNotice(''), NOTICE_TIMEOUT_MS)
  }, [])

  const canEdit = auth.canEditSimulation && scenarioState !== 'COMMITTED'

  const saveDraft = useCallback(() => {
    if (!canEdit) return
    persistDraft()
    flash(t('notice_saved_mock'))
  }, [canEdit, flash, persistDraft, t])

  /**
   * One button, two outcomes: an approver commits the scenario outright, while
   * anyone else with write access can only send it up for approval.
   */
  const commitScenario = useCallback(() => {
    if (!canEdit) return
    const approving = auth.canApproveScenario
    setScenarioState(approving ? 'COMMITTED' : 'SUBMITTED')
    flash(t(approving ? 'notice_committed' : 'notice_submitted'))
  }, [auth.canApproveScenario, canEdit, flash, t])

  const importExcel = useCallback(() => {
    if (!auth.canImportExcel) return
    flash(t('notice_import_mock'))
  }, [auth.canImportExcel, flash, t])

  const announceMove = useCallback(
    (employeeId: string) => flash(t('notice_moved', { id: employeeId })),
    [flash, t],
  )

  return {
    role,
    scenarioState,
    notice,
    canEdit,
    canImport: auth.canImportExcel,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    pendingChanges: history.length,
    undo,
    redo,
    saveDraft,
    resetSimulation,
    commitScenario,
    importExcel,
    announceMove,
  }
}
