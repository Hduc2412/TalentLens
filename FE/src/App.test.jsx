import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PeopleLens simulation board', () => {
  it('opens an employee profile with the keyboard', async () => {
    const user = userEvent.setup()
    render(<App />)

    const employeeButton = screen.getByRole('button', { name: /Xem hồ sơ EMP001/ })
    employeeButton.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByText('HỒ SƠ NHÂN SỰ')).toBeInTheDocument()
  })

  it('keeps the department move control available on desktop', async () => {
    const user = userEvent.setup()
    render(<App />)

    const moveControl = screen.getByLabelText('Chuyển EMP001 sang phòng ban khác')
    expect(moveControl).toBeVisible()
    await user.selectOptions(moveControl, 'sales')

    const employeeCard = screen.getByRole('button', { name: /Xem hồ sơ EMP001/ }).closest('.person-card')
    expect(employeeCard.closest('.department-lane').querySelector('h2')).toHaveTextContent('ソリューション営業部')
  })

  it('masks sensitive mock traits outside the HR role', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('ストレス耐性 78')).toBeInTheDocument()
    await user.selectOptions(screen.getByDisplayValue('HR Admin'), 'viewer')
    expect(screen.queryByText('ストレス耐性 78')).not.toBeInTheDocument()
  })

  it('does not let an older toast timeout hide a newer toast', () => {
    vi.useFakeTimers()
    render(<App />)

    const saveButton = screen.getByRole('button', { name: /Lưu nháp/ })
    fireEvent.click(saveButton)
    act(() => vi.advanceTimersByTime(1000))
    fireEvent.click(saveButton)
    act(() => vi.advanceTimersByTime(900))

    expect(screen.getByText('Đã lưu bản nháp trên bộ nhớ mock')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(900))
    expect(screen.queryByText('Đã lưu bản nháp trên bộ nhớ mock')).not.toBeInTheDocument()
  })
})
