export { ComparisonPage } from './components/ComparisonPage'
export { ComparisonSummaryCards } from './components/ComparisonSummaryCards'
export { DeltaCell } from './components/DeltaCell'
export { DiffTable } from './components/DiffTable'
export { PeriodFilterBar } from './components/PeriodFilterBar'
export { RadarComparisonChart } from './components/RadarComparisonChart'
export { RankDeltaCell } from './components/RankDeltaCell'

export { useComparisonData } from './hooks/useComparisonData'
export { useComparisonDiff } from './hooks/useComparisonDiff'
export { useDraftSubjects } from './hooks/useDraftSubjects'

export { useComparisonStore } from './store/comparison.store'

export {
  COMPARISON_SOURCES,
  DIFF_FILTERS,
  SENTIMENT_CHIP_CLASSES,
  SENTIMENT_TEXT_CLASSES,
} from './data/comparison.constants'

export {
  RANK_ORDER,
  buildComparison,
  buildEmployeeDiff,
  buildMetricDelta,
  buildRankDelta,
  hasAnyChange,
} from './utils/diff'

export { buildDraftSubjects, projectPlacement } from './utils/draft'

export type {
  CategoryDelta,
  ComparisonSource,
  ComparisonResult,
  ComparisonSummary,
  DeltaDirection,
  DeltaSentiment,
  DiffFilter,
  DiffStatus,
  EmployeeDiff,
  MetricDelta,
  PeriodPair,
  RankDelta,
} from './types/comparison.types'
