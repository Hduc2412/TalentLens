import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { AuthPage } from './AuthPage'
import { AuthProvider } from '../context/AuthProvider'
import { TOKEN_STORAGE_KEY } from '../data/auth.constants'
import { useAuthStore } from '../store/auth.store'
import { DEMO_PASSWORD } from '../utils/devToken'

afterEach(() => {
  cleanup()
  useAuthStore.setState({ token: '', payload: null, user: null, status: 'anonymous' })
  sessionStorage.clear()
  localStorage.clear()
})

const renderPage = () =>
  render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>,
  )

describe('sign in', () => {
  it('signs a demo account in and keeps the token for the tab only by default', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('メールアドレス / 社員番号'), 'E1001')
    await user.type(screen.getByLabelText('パスワード'), DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => expect(useAuthStore.getState().status).toBe('authenticated'))
    expect(useAuthStore.getState().user?.roles).toEqual(['HR_ADMIN'])
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeTruthy()
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('persists past the tab when "remember me" is ticked', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('メールアドレス / 社員番号'), 'sato@musashino.co.jp')
    await user.type(screen.getByLabelText('パスワード'), DEMO_PASSWORD)
    await user.click(screen.getByLabelText('ログイン状態を保持する'))
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeTruthy())
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    expect(useAuthStore.getState().user?.roles).toEqual(['HR_MANAGER'])
  })

  it('rejects a wrong password without signing anyone in', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('メールアドレス / 社員番号'), 'E1001')
    await user.type(screen.getByLabelText('パスワード'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'メールアドレスまたはパスワードが正しくありません。',
    )
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('blocks an empty submit on the client', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(screen.getAllByText('この項目は必須です。')).toHaveLength(2)
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('reveals and re-hides the password', async () => {
    const user = userEvent.setup()
    renderPage()

    const password = screen.getByLabelText('パスワード')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'パスワードを表示' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'パスワードを非表示' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})

describe('screen switching', () => {
  it('moves to the register form and validates Japanese names and passwords', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '新規作成' }))
    expect(screen.getByRole('heading', { name: 'アカウント作成' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('社員番号'), '1001')
    await user.type(screen.getByLabelText('氏名（漢字）'), 'Yamada Taro')
    await user.type(screen.getByLabelText('パスワード'), 'short')
    await user.type(screen.getByLabelText('パスワード（確認）'), 'different')
    await user.click(screen.getByRole('button', { name: 'アカウントを作成' }))

    expect(screen.getByText('E1001 の形式で入力してください。')).toBeInTheDocument()
    expect(screen.getByText('氏名は漢字またはカナで入力してください。')).toBeInTheDocument()
    expect(screen.getByText('8文字以上で入力してください。')).toBeInTheDocument()
    expect(screen.getByText('パスワードが一致しません。')).toBeInTheDocument()
  })

  it('confirms a reset request without revealing whether the address exists', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'パスワードをお忘れですか？' }))
    await user.type(screen.getByLabelText('会社メールアドレス'), 'nobody@musashino.co.jp')
    await user.click(screen.getByRole('button', { name: '再設定リンクを送信' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      '登録済みのアドレスであれば、再設定リンクを送信しました。',
    )
  })

  it('drops what was typed when switching screens', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('パスワード'), 'secret-value')
    await user.click(screen.getByRole('button', { name: 'パスワードをお忘れですか？' }))
    await user.click(screen.getByRole('button', { name: 'ログイン画面に戻る' }))

    expect(screen.getByLabelText('パスワード')).toHaveValue('')
  })
})
