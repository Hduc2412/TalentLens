import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { App } from './App'
import { AuthProvider, createDevToken, useAuthStore } from '@/features/auth'
import { useOrgChartStore } from '@/features/orgChart'
import type { UserRole } from '@/types/domain.types'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  useOrgChartStore.setState({ query: '', departmentId: '', selectedEmployeeId: null })
  useAuthStore.getState().signOut()
  sessionStorage.clear()
})

/**
 * The shell reads its principal from the auth context, so the board can only be
 * rendered by a signed-in user. Sign in through the store the way the role
 * picker does, which also persists the token for AuthProvider to restore.
 */
const renderApp = (role: UserRole = 'HR_ADMIN') => {
  useAuthStore.getState().signIn(createDevToken(role))
  return render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  )
}

const laneOf = (employeeId: string) =>
  screen.getByRole('button', { name: new RegExp(employeeId) }).closest('section')

describe('PeopleLens organization board', () => {
  it('opens an employee profile with the keyboard', async () => {
    const user = userEvent.setup()
    renderApp()

    screen.getByRole('button', { name: /E1001 山田 太郎/ }).focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('heading', { name: '山田 太郎' })).toBeInTheDocument()
  })

  it('moves a person into another lane and announces it', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(laneOf('E1001')).toHaveTextContent('MusashinoAI事業部')

    await user.selectOptions(screen.getByLabelText('E1001 を他部門へ異動'), 'dept_kimete事業部')

    expect(laneOf('E1001')).toHaveTextContent('kimete事業部')
    expect(screen.getByText('E1001 の異動をシミュレートしました')).toBeInTheDocument()
  })

  it('filters the board through the Kanji/Kana search box', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.type(screen.getByLabelText('人材検索'), 'やまだ')

    expect(screen.getByRole('button', { name: /E1001 山田 太郎/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /E1002/ })).not.toBeInTheDocument()
  })

  it('opens the protected tab unlocked for the default HR admin role', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: /E1001 山田 太郎/ }))
    await user.click(await screen.findByRole('tab', { name: /センシティブ情報/ }))

    expect(await screen.findByText('ダークトライアド')).toBeInTheDocument()
    expect(screen.queryByText('閲覧権限がありません')).not.toBeInTheDocument()
  })

  it('locks the protected tab after switching to the manager role', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.selectOptions(screen.getByLabelText('ロール'), 'HR_MANAGER')
    await user.click(screen.getByRole('button', { name: /E1001 山田 太郎/ }))
    await user.click(await screen.findByRole('tab', { name: /センシティブ情報/ }))

    expect(await screen.findByText('閲覧権限がありません')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('never loads protected attributes into the board state', () => {
    renderApp()

    const { people } = useOrgChartStore.getState()
    expect(people).toHaveLength(12)
    expect(people.every((person) => !Object.hasOwn(person, 'sensitive_data'))).toBe(true)
    expect(people.every((person) => !Object.hasOwn(person, 'traits'))).toBe(true)
  })

  it('does not let an older toast timeout hide a newer toast', () => {
    vi.useFakeTimers()
    renderApp()

    const saveButton = screen.getByRole('button', { name: /下書き保存/ })
    fireEvent.click(saveButton)
    act(() => void vi.advanceTimersByTime(1000))
    fireEvent.click(saveButton)
    act(() => void vi.advanceTimersByTime(900))

    expect(screen.getByText('下書きをモックメモリに保存しました')).toBeInTheDocument()
    act(() => void vi.advanceTimersByTime(900))
    expect(screen.queryByText('下書きをモックメモリに保存しました')).not.toBeInTheDocument()
  })
})
