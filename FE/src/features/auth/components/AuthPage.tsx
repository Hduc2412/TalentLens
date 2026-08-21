import { useTranslation } from 'react-i18next'

import { ForgotPasswordForm } from './ForgotPasswordForm'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useAuthForm } from '../hooks/useAuthForm'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cn } from '@/utils/cn'

/**
 * Split-screen sign-in page: brand on the left, the active form on the right.
 *
 * The three screens share one hook instance, so switching between them is a
 * state change rather than navigation — no route, no reload, no lost locale.
 */
export const AuthPage = () => {
  const form = useAuthForm()

  return (
    <main className={cn('flex min-h-screen bg-canvas text-ink')}>
      <BrandPanel />

      <section className={cn('relative flex flex-1 items-center justify-center px-5 py-12')}>
        <LanguageSwitcher className={cn('absolute right-5 top-5')} />

        <div className={cn('w-full max-w-md')}>
          {form.mode === 'signin' && <LoginForm form={form} />}
          {form.mode === 'register' && <RegisterForm form={form} />}
          {form.mode === 'forgot' && <ForgotPasswordForm form={form} />}
        </div>
      </section>
    </main>
  )
}

/**
 * Decorative half. Hidden below `lg` rather than stacked: on a phone the form
 * is the only thing worth the viewport.
 */
const BrandPanel = () => {
  const { t } = useTranslation('auth')

  return (
    <aside
      aria-hidden="true"
      className={cn(
        'relative hidden w-5/12 flex-col justify-between overflow-hidden p-10 lg:flex',
        'bg-linear-to-br from-indigo to-cyan text-surface',
      )}
    >
      <div className={cn('flex items-center gap-2')}>
        <span className={cn('grid size-9 place-items-center rounded-xl bg-surface/20 text-lg')}>
          ◎
        </span>
        <strong className={cn('text-xl')}>PeopleLens</strong>
      </div>

      <div className={cn('flex flex-col gap-3')}>
        <p className={cn('text-3xl font-semibold leading-snug')}>{t('brand_headline')}</p>
        <p className={cn('max-w-sm text-sm text-surface/80')}>{t('brand_subline')}</p>
      </div>

      <CompetencyMotif />
    </aside>
  )
}

/** An abstract read of the competency radar the product is built around. */
const CompetencyMotif = () => (
  <svg viewBox="0 0 200 200" className={cn('absolute -bottom-16 -right-16 size-96 opacity-25')}>
    {[80, 60, 40, 20].map((radius) => (
      <circle
        key={radius}
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      />
    ))}
    <polygon
      points="100,28 158,68 150,146 62,152 44,74"
      fill="currentColor"
      fillOpacity="0.25"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    {[
      [100, 28],
      [158, 68],
      [150, 146],
      [62, 152],
      [44, 74],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="currentColor" />
    ))}
  </svg>
)
