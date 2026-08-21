import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Can } from './Can'
import { AuthProvider } from '../context/AuthProvider'
import { TOKEN_STORAGE_KEY } from '../data/auth.constants'
import { useAuthStore } from '../store/auth.store'
import { createDevToken } from '../utils/devToken'
import type { Role } from '../types/auth.types'

afterEach(() => {
  cleanup()
  useAuthStore.getState().signOut()
  sessionStorage.clear()
})

const renderAs = (role: Role) => {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, createDevToken(role))
  return render(
    <AuthProvider>
      <Can permission="excel:import">
        <button type="button">Import Excel</button>
      </Can>
      <Can permission="employees:read_sensitive" fallback={<p>locked</p>}>
        <p>stress chart</p>
      </Can>
    </AuthProvider>,
  )
}

describe('Can', () => {
  it('renders privileged affordances for an HR admin', () => {
    renderAs('HR_ADMIN')

    expect(screen.getByRole('button', { name: 'Import Excel' })).toBeInTheDocument()
    expect(screen.getByText('stress chart')).toBeInTheDocument()
  })

  it('hides the import button and locks protected data for a manager', () => {
    renderAs('HR_MANAGER')

    expect(screen.queryByRole('button', { name: 'Import Excel' })).not.toBeInTheDocument()
    expect(screen.getByText('locked')).toBeInTheDocument()
    expect(screen.queryByText('stress chart')).not.toBeInTheDocument()
  })

  it('grants nothing beyond reading to a plain employee', () => {
    renderAs('EMPLOYEE')

    expect(screen.queryByRole('button', { name: 'Import Excel' })).not.toBeInTheDocument()
    expect(screen.getByText('locked')).toBeInTheDocument()
  })
})
