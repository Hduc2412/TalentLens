import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import './App.css'
import { AppHeader } from './components/AppHeader.jsx'
import { DepartmentLane } from './components/DepartmentLane.jsx'
import { EmployeeDetail } from './components/EmployeeDetail.jsx'
import { LoadState } from './components/LoadState.jsx'
import { SimulationToolbar } from './components/SimulationToolbar.jsx'
import { useOrganizationData } from './hooks/useOrganizationData.js'

function App() {
  const organization = useOrganizationData()
  const [people, setPeople] = useState(organization.people)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('hr')
  const [selectedId, setSelectedId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dropDept, setDropDept] = useState(null)
  const [scenarioState, setScenarioState] = useState('DRAFT')
  const [notice, setNotice] = useState('')
  const toastTimerRef = useRef(null)

  useEffect(() => {
    setPeople(organization.people)
    setHistory([])
    setFuture([])
  }, [organization.people])

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  const selected = people.find((person) => person.id === selectedId)
  const canEdit = role !== 'viewer' && scenarioState !== 'COMMITTED'
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return people
    return people.filter((person) => `${person.id} ${person.name} ${person.latin} ${person.role}`.toLowerCase().includes(normalized))
  }, [people, query])

  const flash = (message) => {
    setNotice(message)
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setNotice(''), 1800)
  }

  const movePerson = (id, nextDept) => {
    const person = people.find((item) => item.id === id)
    if (!canEdit || !person || person.dept === nextDept) return
    setHistory((items) => [...items.slice(-19), people])
    setFuture([])
    setPeople((items) => items.map((item) => item.id === id ? { ...item, dept: nextDept } : item))
    flash(`Đã mô phỏng điều chuyển ${person.id}`)
  }

  const undo = () => {
    if (!history.length || !canEdit) return
    setFuture((items) => [people, ...items])
    setPeople(history.at(-1))
    setHistory((items) => items.slice(0, -1))
  }

  const redo = () => {
    if (!future.length || !canEdit) return
    setHistory((items) => [...items, people])
    setPeople(future[0])
    setFuture((items) => items.slice(1))
  }

  const saveDraft = () => {
    setHistory([])
    setFuture([])
    flash(organization.dataSource === 'mock' ? 'Đã lưu bản nháp trên bộ nhớ mock' : 'Đã lưu bản nháp')
  }

  const mainAction = () => {
    if (!canEdit) return
    setScenarioState(role === 'hr' ? 'COMMITTED' : 'SUBMITTED')
    setHistory([])
    setFuture([])
    flash(role === 'hr' ? 'Đã commit kịch bản' : 'Đã gửi HR duyệt')
  }

  const dropPerson = (departmentId) => {
    movePerson(draggingId, departmentId)
    setDropDept(null)
    setDraggingId(null)
  }

  return <main className="peoplelens-app">
    <AppHeader query={query} onQueryChange={setQuery} role={role} onRoleChange={setRole} />
    <SimulationToolbar canEdit={canEdit} canUndo={Boolean(history.length)} canRedo={Boolean(future.length)} role={role} onUndo={undo} onRedo={redo} onSave={saveDraft} onMainAction={mainAction} />

    <section className="context-strip">
      <div><span className={`scenario-state state-${scenarioState.toLowerCase()}`}>{scenarioState}</span><span>{history.length ? `${history.length} thay đổi chưa lưu` : 'Không có thay đổi chưa lưu'}</span><span className="data-source">Nguồn: {organization.dataSource.toUpperCase()}</span></div>
      <div className="legend"><span><i className="dot good" />Hợp ≥80</span><span><i className="dot medium" />Trung bình 60–79</span><span><i className="dot low" />Lệch &lt;60</span></div>
    </section>

    <LoadState loading={organization.loading} error={organization.error} onRetry={organization.reload} />

    {!organization.loading && !organization.error && <section className="department-board">
      {organization.departments.map((department) => <DepartmentLane key={department.id} department={department} departments={organization.departments}
        members={filtered.filter((person) => person.dept === department.id)} canEdit={canEdit} isDropTarget={dropDept === department.id}
        onDropTargetChange={setDropDept} onDrop={dropPerson} onMove={movePerson} onSelect={setSelectedId} onDragStart={setDraggingId} />)}
      {!organization.departments.length && <section className="app-state"><span>Chưa có dữ liệu phòng ban.</span></section>}
    </section>}

    <EmployeeDetail person={selected} onClose={() => setSelectedId(null)} />
    {notice && <div className="app-notice"><Check size={15} />{notice}</div>}
  </main>
}

export default App
