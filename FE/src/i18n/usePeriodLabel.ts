import { useTranslation } from 'react-i18next'

import type { EvaluationPeriod } from '@/types/domain.types'

/**
 * Period labels are composed from year + half rather than stored as text, so any
 * future cycle renders in both languages without a new translation key.
 *
 * Lives outside the feature folders because both the comparison view and the
 * profile history read it; keeping it in one of them would couple the two.
 */
export const usePeriodLabel = (): ((period: EvaluationPeriod) => string) => {
  const { t } = useTranslation('common')
  return (period) => t(`period_h${period.half}`, { year: period.year })
}
