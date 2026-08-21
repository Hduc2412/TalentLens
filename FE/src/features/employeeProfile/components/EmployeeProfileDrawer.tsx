import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'

import { useEmployeeProfile } from '../hooks/useEmployeeProfile'
import { useEmployeeFitHistory } from '../hooks/useEmployeeFitHistory'
import { CompetencyView } from './CompetencyView'
import { JobFitsView } from './JobFitsView'
import { ProfileHeader } from './ProfileHeader'
import { ProfileTabs } from './ProfileTabs'
import { SensitiveDataTab } from './SensitiveDataTab'
import type { EmployeeSummary, UserRole } from '@/types/domain.types'
import { cn } from '@/utils/cn'

interface EmployeeProfileDrawerProps {
  employee: EmployeeSummary | null
  role: UserRole
  onClose: () => void
}

export const EmployeeProfileDrawer = ({ employee, role, onClose }: EmployeeProfileDrawerProps) => {
  const profile = useEmployeeProfile(employee?.employee_id ?? null, role)

  if (!employee) return null

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-profile-title"
      className={cn(
        'fixed inset-y-4 right-4 left-4 z-10 flex flex-col sm:left-auto sm:w-96',
        'rounded-2xl border border-hairline bg-surface shadow-island',
      )}
    >
      <ProfileHeader employee={employee} jobFit={profile.assignedJobFit} onClose={onClose} />

      <div className={cn('px-5 pt-4')}>
        <ProfileTabs
          activeTab={profile.activeTab}
          canViewSensitive={profile.canViewSensitive}
          onChange={profile.setActiveTab}
        />
      </div>

      <div
        role="tabpanel"
        id={`profile-panel-${profile.activeTab}`}
        aria-labelledby={`profile-tab-${profile.activeTab}`}
        className={cn('scroll-slim flex-1 overflow-y-auto p-5')}
      >
        <ProfileBody profile={profile} role={role} />
      </div>
    </aside>
  )
}

interface ProfileBodyProps {
  profile: ReturnType<typeof useEmployeeProfile>
  role: UserRole
}

const ProfileBody = ({ profile, role }: ProfileBodyProps) => {
  const { t } = useTranslation('employee_profile')
  // Fetched unconditionally so the history is ready the moment the tab opens.
  const history = useEmployeeFitHistory(profile.employee?.employee_id ?? null)

  if (profile.loading) {
    return (
      <p role="status" className={cn('flex items-center gap-2 text-sm text-muted')}>
        <CircleNotch size={18} className={cn('animate-spin text-indigo')} />
        {t('loading')}
      </p>
    )
  }

  if (profile.error || !profile.employee) {
    return (
      <p role="alert" className={cn('flex items-center gap-2 text-sm text-low')}>
        <WarningCircle size={18} />
        {t('load_error')}
      </p>
    )
  }

  if (profile.activeTab === 'job_fits') {
    return <JobFitsView employee={profile.employee} history={history} />
  }

  if (profile.activeTab === 'sensitive') {
    return (
      <SensitiveDataTab
        sensitiveData={profile.employee.sensitive_data}
        canView={profile.canViewSensitive}
        role={role}
      />
    )
  }

  return <CompetencyView employee={profile.employee} />
}
