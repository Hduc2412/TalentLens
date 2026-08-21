import { useTranslation } from 'react-i18next'

import { AuthBanner, AuthField, AuthModeLink, AuthSubmit } from './AuthField'
import { useAuth } from '../context/auth.context'
import { ROLES, ROLE_LABEL_KEYS } from '../data/auth.constants'
import type { AuthFormApi } from '../types/authForm.types'
import { DEMO_IDENTITIES, DEMO_PASSWORD } from '../utils/devToken'
import { USE_MOCK } from '@/services/organizationService'
import { cn } from '@/utils/cn'

/**
 * Sign-in screen.
 *
 * Accepts either the company email or the employee id in one box: people know
 * their own identifier, and asking them which kind it is adds a decision the
 * service can make for itself.
 */
export const LoginForm = ({ form }: { form: AuthFormApi }) => {
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { status } = useAuth()

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
        <h1 className={cn('text-2xl font-semibold text-ink')}>{t('signin_title')}</h1>
        <p className={cn('text-sm text-muted')}>{t('signin_subtitle')}</p>
      </header>

      <AuthBanner error={form.error} notice={form.notice} />

      {/* A session that ran out is not the same as never having signed in. */}
      {status === 'expired' && !form.error && (
        <p role="status" className={cn('rounded-xl bg-soft px-3 py-2 text-xs text-muted')}>
          {t('session_expired')}
        </p>
      )}

      <AuthField
        name="identifier"
        label={t('field_identifier')}
        placeholder={t('field_identifier_placeholder')}
        autoComplete="username"
        value={form.values.identifier ?? ''}
        error={form.errors.identifier}
        onChange={(value) => form.setField('identifier', value)}
      />

      <AuthField
        name="password"
        type="password"
        label={t('field_password')}
        placeholder={t('field_password_placeholder')}
        autoComplete="current-password"
        value={form.values.password ?? ''}
        error={form.errors.password}
        onChange={(value) => form.setField('password', value)}
      />

      <div className={cn('flex flex-wrap items-center justify-between gap-2')}>
        <label className={cn('flex items-center gap-2 text-xs text-muted')}>
          <input
            type="checkbox"
            checked={form.remember}
            onChange={(event) => form.setRemember(event.target.checked)}
            className={cn('size-4 accent-indigo')}
          />
          {t('remember_me')}
        </label>

        <AuthModeLink label={t('forgot_link')} onClick={() => form.setMode('forgot')} />
      </div>

      <AuthSubmit
        label={t(form.submitting ? 'signin_busy' : 'signin_submit')}
        busy={form.submitting}
      />

      <p className={cn('text-center text-xs text-muted')}>
        {t('no_account')}{' '}
        <AuthModeLink label={t('register_link')} onClick={() => form.setMode('register')} />
      </p>

      {/* Mock mode has no identity provider to hold accounts, so the demo
          directory is printed rather than hidden behind a guess. */}
      {USE_MOCK && (
        <div className={cn('flex flex-col gap-2 border-t border-hairline pt-3')}>
          <p className={cn('text-xs text-muted')}>{t('demo_hint', { password: DEMO_PASSWORD })}</p>
          <div className={cn('flex flex-wrap gap-2')}>
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  form.setField('identifier', DEMO_IDENTITIES[role].employee_id)
                  form.setField('password', DEMO_PASSWORD)
                }}
                className={cn(
                  'rounded-full border border-hairline bg-canvas px-3 py-1 text-xs text-ink',
                  'hover:border-indigo hover:text-indigo',
                )}
              >
                {tCommon(ROLE_LABEL_KEYS[role])} · {DEMO_IDENTITIES[role].employee_id}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
