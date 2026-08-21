import { LockKey } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import type { UserRole } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface SensitiveLockNoticeProps {
  role: UserRole
}

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  HR_ADMIN: 'role_hr_admin',
  HR_MANAGER: 'role_hr_manager',
  EMPLOYEE: 'role_employee',
}

export const SensitiveLockNotice = ({ role }: SensitiveLockNoticeProps) => {
  const { t } = useTranslation('employee_profile')
  const { t: tCommon } = useTranslation('common')

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline',
        'bg-soft px-4 py-8 text-center',
      )}
    >
      <LockKey size={28} className={cn('text-muted')} />
      <strong className={cn('text-sm text-ink')}>{t('locked_title')}</strong>
      <p className={cn('max-w-xs text-xs text-muted')}>{t('locked_description')}</p>
      <span className={cn('rounded-full bg-surface px-3 py-1 text-xs text-muted')}>
        {t('locked_current_role', { role: tCommon(ROLE_LABEL_KEYS[role]) })}
      </span>
    </div>
  )
}
