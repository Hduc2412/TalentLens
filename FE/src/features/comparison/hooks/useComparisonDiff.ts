import { useMemo } from 'react'

import { includesJapanese } from '@/utils/japanese'
import type { EmployeeDetail } from '@/types/domain.types'
import { useComparisonStore } from '../store/comparison.store'
import type { ComparisonResult, DiffFilter, EmployeeDiff } from '../types/comparison.types'
import { buildComparison, hasAnyChange } from '../utils/diff'

const EMPTY: ComparisonResult = {
  rows: [],
  summary: {
    headcount: { base: null, target: null, delta: null, direction: 'flat', sentiment: 'unknown' },
    averageFit: { base: null, target: null, delta: null, direction: 'flat', sentiment: 'unknown' },
    averageStress: {
      base: null,
      target: null,
      delta: null,
      direction: 'flat',
      sentiment: 'unknown',
    },
    rankUp: 0,
    rankDown: 0,
    departmentChanges: 0,
    roleChanges: 0,
    joined: 0,
    left: 0,
  },
}

const passesFilter = (row: EmployeeDiff, filter: DiffFilter): boolean => {
  switch (filter) {
    case 'changed':
      return hasAnyChange(row)
    case 'rank_up':
      return row.rank.direction === 'up'
    case 'rank_down':
      return row.rank.direction === 'down'
    case 'moved':
      return row.department.changed
    default:
      return true
  }
}

const passesQuery = (row: EmployeeDiff, query: string): boolean =>
  !query.trim() || includesJapanese([row.employeeId, row.nameKanji, row.nameKana].join(' '), query)

interface ComparisonDiffState extends ComparisonResult {
  /** Rows after the filter chip and the search box; the summary stays global. */
  visibleRows: EmployeeDiff[]
}

/**
 * The summary is always computed over every row: filtering the table must not
 * silently change the company-wide headline numbers beside it.
 */
export const useComparisonDiff = (
  baseEmployees: readonly EmployeeDetail[] | null,
  targetEmployees: readonly EmployeeDetail[] | null,
): ComparisonDiffState => {
  const filter = useComparisonStore((state) => state.filter)
  const query = useComparisonStore((state) => state.query)

  const result = useMemo(
    () =>
      baseEmployees && targetEmployees ? buildComparison(baseEmployees, targetEmployees) : EMPTY,
    [baseEmployees, targetEmployees],
  )

  const visibleRows = useMemo(
    () => result.rows.filter((row) => passesFilter(row, filter) && passesQuery(row, query)),
    [result.rows, filter, query],
  )

  return { ...result, visibleRows }
}
