import { ArrowsClockwise, CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils/cn'

interface LoadStateProps {
  loading: boolean
  error: Error | null
  onRetry: () => void
}

const PANEL = 'flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3'

export const LoadState = ({ loading, error, onRetry }: LoadStateProps) => {
  const { t } = useTranslation('common')

  if (loading) {
    return (
      <section role="status" className={cn(PANEL, 'text-sm text-muted')}>
        <CircleNotch size={20} className={cn('animate-spin text-indigo')} />
        <span>{t('loading_organization')}</span>
      </section>
    )
  }

  if (!error) return null

  return (
    <section role="alert" className={cn(PANEL, 'border-low')}>
      <WarningCircle size={20} className={cn('text-low')} />
      <div className={cn('flex-1')}>
        <strong className={cn('block text-sm text-ink')}>{t('error_title')}</strong>
        <small className={cn('text-xs text-muted')}>{error.message}</small>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full border border-hairline px-4 text-sm',
        )}
      >
        <ArrowsClockwise size={15} />
        {t('retry')}
      </button>
    </section>
  )
}
