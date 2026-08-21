import { create } from 'zustand'

import { ALL_DEPARTMENTS } from '../data/orgChart.constants'
import type { Department, EmployeeSummary } from '@/types/domain.types'

const HISTORY_LIMIT = 20

interface OrgChartState {
  departments: Department[]
  people: EmployeeSummary[]
  baseline: EmployeeSummary[]
  query: string
  departmentId: string
  selectedEmployeeId: string | null
  history: EmployeeSummary[][]
  future: EmployeeSummary[][]
  hydrate: (departments: Department[], people: EmployeeSummary[]) => void
  setQuery: (query: string) => void
  setDepartmentId: (departmentId: string) => void
  selectEmployee: (employeeId: string | null) => void
  moveEmployee: (employeeId: string, departmentId: string) => boolean
  undo: () => void
  redo: () => void
  saveDraft: () => void
  resetSimulation: () => void
}

export const useOrgChartStore = create<OrgChartState>((set, get) => ({
  departments: [],
  people: [],
  baseline: [],
  query: '',
  departmentId: ALL_DEPARTMENTS,
  selectedEmployeeId: null,
  history: [],
  future: [],

  hydrate: (departments, people) =>
    set({ departments, people, baseline: people, history: [], future: [] }),

  setQuery: (query) => set({ query }),
  setDepartmentId: (departmentId) => set({ departmentId }),
  selectEmployee: (employeeId) => set({ selectedEmployeeId: employeeId }),

  /** Simulated reassignment: the baseline snapshot is never overwritten. */
  moveEmployee: (employeeId, departmentId) => {
    const { people, history } = get()
    const target = people.find((person) => person.employee_id === employeeId)
    const department = get().departments.find((item) => item.department_id === departmentId)
    if (!target || !department || target.department_id === departmentId) return false

    set({
      history: [...history.slice(-(HISTORY_LIMIT - 1)), people],
      future: [],
      people: people.map((person) =>
        person.employee_id === employeeId
          ? { ...person, department_id: departmentId, department_name: department.full_name }
          : person,
      ),
    })
    return true
  },

  undo: () => {
    const { history, future, people } = get()
    const previous = history.at(-1)
    if (!previous) return
    set({ people: previous, history: history.slice(0, -1), future: [people, ...future] })
  },

  redo: () => {
    const { history, future, people } = get()
    const [next, ...rest] = future
    if (!next) return
    set({ people: next, history: [...history, people], future: rest })
  },

  /** Promote the simulated placement to the new baseline and drop the undo stack. */
  saveDraft: () => set({ baseline: get().people, history: [], future: [] }),

  resetSimulation: () => set({ people: get().baseline, history: [], future: [] }),
}))
