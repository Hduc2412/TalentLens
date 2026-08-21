import { Translate } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/i18n'
import { cn } from '@/utils/cn'

/** Switches locale in place — i18next re-renders, nothing reloads. */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { t, i18n } = useTranslation('common')

  return (
    <label className={cn('flex items-center gap-1', className)}>
      <Translate size={16} className={cn('text-muted')} />
      <span className={cn('sr-only')}>{t('language_short')}</span>
      <select
        value={i18n.language}
        aria-label={t('language_short')}
        onChange={(event) => void i18n.changeLanguage(event.target.value as SupportedLanguage)}
        className={cn('rounded-full border border-hairline bg-canvas px-3 py-1 text-xs')}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {t(`language_${language}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
