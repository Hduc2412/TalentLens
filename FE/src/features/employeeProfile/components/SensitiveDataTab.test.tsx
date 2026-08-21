import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SensitiveDataTab } from './SensitiveDataTab'
import { EMPLOYEES } from '@/mocks/organization'
import type { SensitiveData } from '@/types/domain.types'

afterEach(cleanup)

const sensitiveData = EMPLOYEES[0].sensitive_data as SensitiveData

const LOCK_TITLE = '閲覧権限がありません'

describe('SensitiveDataTab RBAC guard', () => {
  it('renders every protected block for an HR admin', () => {
    render(<SensitiveDataTab sensitiveData={sensitiveData} canView role="HR_ADMIN" />)

    expect(screen.getByText('ダークトライアド')).toBeInTheDocument()
    expect(screen.getByText('ストレス指標')).toBeInTheDocument()
    expect(screen.getByText('メンタル状態')).toBeInTheDocument()
    expect(screen.getByText('耐性判定')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'マキャベリアニズム' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'サイコパシー' })).toBeInTheDocument()
    expect(screen.queryByText(LOCK_TITLE)).not.toBeInTheDocument()
  })

  it('locks the tab for a manager and leaks no score', () => {
    render(<SensitiveDataTab sensitiveData={sensitiveData} canView={false} role="HR_MANAGER" />)

    expect(screen.getByText(LOCK_TITLE)).toBeInTheDocument()
    expect(screen.getByText('現在のロール：マネージャー')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(screen.queryByText('ダークトライアド')).not.toBeInTheDocument()
  })

  it('locks the tab for a plain employee', () => {
    render(<SensitiveDataTab sensitiveData={sensitiveData} canView={false} role="EMPLOYEE" />)

    expect(screen.getByText('現在のロール：社員')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })

  it('stays locked when the backend withheld the payload, even for an admin', () => {
    render(<SensitiveDataTab sensitiveData={null} canView role="HR_ADMIN" />)

    expect(screen.getByText(LOCK_TITLE)).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
  })
})
