import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AuthGate } from './AuthGate'
import { AuthProvider } from '../context/AuthProvider'
import { useAuthStore } from '../store/auth.store'
import { createDevToken } from '../utils/devToken'

const ANONYMOUS = { token: '', payload: null, user: null, status: 'anonymous' as const }

beforeEach(() => {
  // A cold start, so no test inherits another's principal or exit.
  useAuthStore.setState(ANONYMOUS)
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(cleanup)

const renderGate = () =>
  render(
    <AuthProvider>
      <AuthGate>
        <div>APP_SHELL</div>
      </AuthGate>
    </AuthProvider>,
  )

const signOut = async () => {
  await act(async () => {
    useAuthStore.getState().signOut()
  })
}

describe('AuthGate', () => {
  it('signs itself in on a cold start so the mock demo opens on the board', async () => {
    renderGate()

    expect(await screen.findByText('APP_SHELL')).toBeInTheDocument()
    expect(useAuthStore.getState().user?.roles).toEqual(['HR_ADMIN'])
  })

  /**
   * Regression: the automatic sign-in used to re-run whenever the principal
   * disappeared, so signing out re-authenticated on the next render and the
   * header's sign-out button did nothing at all.
   */
  it('lands on the sign-in page after an explicit sign out', async () => {
    renderGate()
    await screen.findByText('APP_SHELL')

    await signOut()

    expect(screen.queryByText('APP_SHELL')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('keeps the principal out on later render passes', async () => {
    renderGate()
    await screen.findByText('APP_SHELL')

    await signOut()
    await act(async () => {})

    expect(screen.queryByText('APP_SHELL')).not.toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('signed_out')
  })

  it('does not re-authenticate a session the API rejected', async () => {
    renderGate()
    await screen.findByText('APP_SHELL')

    await act(async () => {
      useAuthStore.getState().expire()
    })

    expect(screen.queryByText('APP_SHELL')).not.toBeInTheDocument()
    expect(useAuthStore.getState().status).toBe('expired')
  })

  it('signs a returning user straight back in', async () => {
    useAuthStore.getState().signIn(createDevToken('HR_MANAGER'))
    renderGate()

    expect(await screen.findByText('APP_SHELL')).toBeInTheDocument()
    // The greeting must not overwrite a principal that is already present.
    expect(useAuthStore.getState().user?.roles).toEqual(['HR_MANAGER'])
  })
})
