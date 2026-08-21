import type { EmployeeDetail, JobFit } from '@/types/domain.types'

export type ProfileTabId = 'competency' | 'job_fits' | 'sensitive'

export interface ProfileTab {
  id: ProfileTabId
  labelKey: string
  /** Protected tabs render a lock notice unless the principal is an HR admin. */
  protected: boolean
}

export interface RadarEntry {
  key: string
  value: number
}

/** One axis of the radar, pre-projected into SVG coordinates. */
export interface RadarAxis extends RadarEntry {
  angle: number
  x: number
  y: number
  axisX: number
  axisY: number
  labelX: number
  labelY: number
  labelAnchor: 'start' | 'middle' | 'end'
}

export interface EmployeeProfileState {
  employee: EmployeeDetail | null
  assignedJobFit: JobFit | null
  loading: boolean
  error: Error | null
  activeTab: ProfileTabId
  setActiveTab: (tab: ProfileTabId) => void
  canViewSensitive: boolean
}
