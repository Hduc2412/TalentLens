import { CaretDown, SignOut, UserCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ROLE_LABEL_KEYS, ROLES, createDevToken, useAuth, usePrimaryRole } from '@/features/auth'
import { USE_MOCK } from '@/services/organizationService'
import type { UserRole } from '@/types/domain.types'
import { cn } from '@/utils/cn'

const CONTROL = 'rounded-full border border-hairline bg-canvas px-3 py-1 text-xs'

export const AppHeader = () => {
  const { t } = useTranslation('common')
  const { user, signIn, signOut } = useAuth()
  const role = usePrimaryRole()

  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline',
        'bg-surface px-5 py-3 shadow-small',
      )}
    >
      <div className={cn('flex items-center gap-2')}>
        <strong className={cn('text-xl text-indigo')}>{t('app_name')}</strong>
        <span className={cn('text-sm text-muted')}>{t('app_tagline')}</span>
        <CaretDown size={15} className={cn('text-muted')} />
      </div>

      <div className={cn('flex items-center gap-3 text-sm')}>
        <LanguageSwitcher />

        {/* Against a real API the role comes from the signed token and cannot be
            switched here; the picker only exists to drive the mock dataset. */}
        {USE_MOCK ? (
          <select
            value={role}
            aria-label={t('role_selector_label')}
            onChange={(event) => signIn(createDevToken(event.target.value as UserRole))}
            className={cn(CONTROL)}
          >
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {t(ROLE_LABEL_KEYS[value])}
              </option>
            ))}
          </select>
        ) : (
          <span className={cn(CONTROL, 'text-muted')}>{t(ROLE_LABEL_KEYS[role])}</span>
        )}

        <span className={cn('flex items-center gap-1 text-xs text-ink')}>
          <UserCircle size={20} className={cn('text-muted')} />
          {user?.name_kanji}
        </span>

        <button
          type="button"
          onClick={signOut}
          aria-label={t('sign_out')}
          title={t('sign_out')}
          className={cn('text-muted hover:text-ink')}
        >
          <SignOut size={18} />
        </button>
      </div>
    </header>
  )
}
