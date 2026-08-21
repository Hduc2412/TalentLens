import { ArrowLeft } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { AuthBanner, AuthField, AuthSubmit } from './AuthField'
import type { AuthFormApi } from '../types/authForm.types'
import { cn } from '@/utils/cn'

/**
 * Password recovery request.
 *
 * The confirmation is the same whether or not the address is registered — a
 * different answer per case would let anyone test which emails exist here.
 */
export const ForgotPasswordForm = ({ form }: { form: AuthFormApi }) => {
  const { t } = useTranslation('auth')

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        form.submit()
      }}
      className={cn('flex flex-col gap-3')}
    >
      <header className={cn('flex flex-col gap-1')}>
        <h1 className={cn('text-2xl font-semibold text-ink')}>{t('forgot_title')}</h1>
        <p className={cn('text-sm text-muted')}>{t('forgot_subtitle')}</p>
      </header>

      <AuthBanner error={form.error} notice={form.notice} />

      <AuthField
        name="email"
        type="email"
        label={t('field_email')}
        placeholder={t('field_email_placeholder')}
        autoComplete="email"
        value={form.values.email ?? ''}
        error={form.errors.email}
        onChange={(value) => form.setField('email', value)}
      />

      <AuthSubmit
        label={t(form.submitting ? 'forgot_busy' : 'forgot_submit')}
        busy={form.submitting}
      />

      <button
        type="button"
        onClick={() => form.setMode('signin')}
        className={cn(
          'inline-flex items-center justify-center gap-1 text-xs font-medium text-indigo',
          'hover:underline',
        )}
      >
        <ArrowLeft size={14} />
        {t('back_to_signin')}
      </button>
    </form>
  )
}
