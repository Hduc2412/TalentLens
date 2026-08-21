import { useTranslation } from 'react-i18next'

import { AuthBanner, AuthField, AuthModeLink, AuthSubmit } from './AuthField'
import type { AuthFormApi } from '../types/authForm.types'
import { cn } from '@/utils/cn'

/**
 * Account creation.
 *
 * Employee id and tenant id come first because they are what maps the new
 * account onto an existing personnel record — a registration without them is
 * an orphan the org chart cannot place.
 */
export const RegisterForm = ({ form }: { form: AuthFormApi }) => {
  const { t } = useTranslation('auth')

  const field = (name: string, extra: Partial<Parameters<typeof AuthField>[0]> = {}) => (
    <AuthField
      name={name}
      label={t(`field_${name}`)}
      placeholder={t(`field_${name}_placeholder`)}
      value={form.values[name] ?? ''}
      error={form.errors[name]}
      onChange={(value) => form.setField(name, value)}
      {...extra}
    />
  )

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
        <h1 className={cn('text-2xl font-semibold text-ink')}>{t('register_title')}</h1>
        <p className={cn('text-sm text-muted')}>{t('register_subtitle')}</p>
      </header>

      <AuthBanner error={form.error} notice={form.notice} />

      <div className={cn('grid gap-3 sm:grid-cols-2')}>
        {field('employeeId')}
        {field('tenantId')}
        {field('nameKanji')}
        {field('nameKana')}
      </div>

      {field('email', { type: 'email', autoComplete: 'email' })}

      <div className={cn('grid gap-3 sm:grid-cols-2')}>
        {field('password', { type: 'password', autoComplete: 'new-password' })}
        {field('passwordConfirm', { type: 'password', autoComplete: 'new-password' })}
      </div>

      <AuthSubmit
        label={t(form.submitting ? 'register_busy' : 'register_submit')}
        busy={form.submitting}
      />

      <p className={cn('text-center text-xs text-muted')}>
        {t('have_account')}{' '}
        <AuthModeLink label={t('signin_link')} onClick={() => form.setMode('signin')} />
      </p>
    </form>
  )
}
