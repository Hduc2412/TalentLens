import { LockKey } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { PROFILE_TABS } from '../data/employeeProfile.constants'
import type { ProfileTabId } from '../types/employeeProfile.types'
import { cn } from '@/utils/cn'

interface ProfileTabsProps {
  activeTab: ProfileTabId
  canViewSensitive: boolean
  onChange: (tab: ProfileTabId) => void
}

export const ProfileTabs = ({ activeTab, canViewSensitive, onChange }: ProfileTabsProps) => {
  const { t } = useTranslation('employee_profile')

  return (
    <div role="tablist" aria-label={t('tabs_label')} className={cn('flex gap-1')}>
      {PROFILE_TABS.map((tab) => {
        const isActive = tab.id === activeTab
        const showLock = tab.protected && !canViewSensitive

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`profile-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`profile-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium',
              'transition',
              isActive ? 'bg-indigo text-surface' : 'bg-soft text-muted hover:text-ink',
            )}
          >
            {showLock && <LockKey size={13} />}
            {t(tab.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
