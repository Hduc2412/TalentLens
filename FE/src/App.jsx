import { useMemo, useState } from 'react'
import {
  Box, Check, ChevronDown, GitCommitHorizontal, Languages, Network,
  Redo2, Save, Search, Undo2, UserRound, X,
} from 'lucide-react'
import './App.css'

const DEPARTMENTS = [
  { id: 'ai', name: 'AI開発部', en: 'AI Development' },
  { id: 'sales', name: 'ソリューション営業部', en: 'Solution Sales' },
  { id: 'cs', name: 'カスタマーサクセス', en: 'Customer Success' },
]

const INITIAL_PEOPLE = [
  { id: 'EMP001', name: '佐藤 健太', latin: 'Sato Kenta', role: 'Lead Architect', dept: 'ai', jobFit: 92, traits: ['挑戦心 88', '誠実性 94', '論理性 90'] },
  { id: 'EMP014', name: '田中 雅人', latin: 'Tanaka Masato', role: 'ML Engineer', dept: 'ai', jobFit: 74, traits: ['挑戦心 62', '敏捷性 80', '情報欲 85'] },
  { id: 'EMP022', name: '小林 優', latin: 'Kobayashi Yu', role: 'Data Scientist', dept: 'ai', jobFit: 88, traits: ['誠実性 91', '論理性 86', '完遂力 82'] },
  { id: 'EMP045', name: '鈴木 一郎', latin: 'Suzuki Ichiro', role: 'Enterprise Sales', dept: 'sales', jobFit: 88, traits: ['説得交渉 90', 'ネットワーク 85', '向上心 86'] },
  { id: 'EMP052', name: '伊藤 翔太', latin: 'Ito Shota', role: 'Inside Sales', dept: 'sales', jobFit: 54, traits: ['説得交渉 45', '誠実性 89', '論理性 92'] },
  { id: 'EMP060', name: '中村 翼', latin: 'Nakamura Tsubasa', role: 'Account Executive', dept: 'sales', jobFit: 65, traits: ['説得交渉 68', '協調優先 72', '気さくさ 70'] },
  { id: 'EMP089', name: '高橋 誠', latin: 'Takahashi Makoto', role: 'CS Lead', dept: 'cs', jobFit: 85, traits: ['協調優先 92', '感情安定 86', '配慮 89'] },
  { id: 'EMP092', name: '渡辺 健', latin: 'Watanabe Ken', role: 'Onboarding Specialist', dept: 'cs', jobFit: 68, traits: ['協調優先 65', '感情安定 70', '役割意識 75'] },
  { id: 'EMP105', name: '松本 遥', latin: 'Matsumoto Haruka', role: 'Support Lead', dept: 'cs', jobFit: 90, traits: ['協調優先 95', '感情安定 91', '回復力 88'] },
]

const scoreTone = (score) => score >= 80 ? 'good' : score >= 60 ? 'medium' : 'low'
const deptFit = (person) => Math.max(40, Math.min(98, person.jobFit + ({ ai: 2, sales: -3, cs: 1 }[person.dept] || 0)))

function App() {
  const [people, setPeople] = useState(INITIAL_PEOPLE)
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('hr')
  const [selectedId, setSelectedId] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dropDept, setDropDept] = useState(null)
  const [state, setState] = useState('DRAFT')
  const [notice, setNotice] = useState('')

  const selected = people.find((person) => person.id === selectedId)
  const canEdit = role !== 'viewer' && state !== 'COMMITTED'
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return people
    return people.filter((person) => `${person.id} ${person.name} ${person.latin} ${person.role}`.toLowerCase().includes(normalized))
  }, [people, query])

  const flash = (message) => {
    setNotice(message)
    window.clearTimeout(flash.timer)
    flash.timer = window.setTimeout(() => setNotice(''), 1800)
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
    flash('Đã lưu bản nháp trên bộ nhớ mock')
  }

  const mainAction = () => {
    if (!canEdit) return
    setState(role === 'hr' ? 'COMMITTED' : 'SUBMITTED')
    setHistory([])
    setFuture([])
    flash(role === 'hr' ? 'Đã commit kịch bản' : 'Đã gửi HR duyệt')
  }

  return (
    <main className="peoplelens-app">
      <header className="app-header">
        <div className="brand-block">
          <strong>PeopleLens</strong><span>Musashino AI事業部</span><ChevronDown size={15} />
        </div>
        <label className="global-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="自然言語検索：挑戦心が80以上の人材…" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="user-block">
          <Languages size={16} /><span>JP</span>
          <label className="role-select"><select value={role} onChange={(event) => setRole(event.target.value)}><option value="hr">HR Admin</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select></label>
          <UserRound size={17} /><span>山田 太郎</span>
        </div>
      </header>

      <nav className="work-toolbar" aria-label="Công cụ mô phỏng">
        <button className="quiet-control active"><Network size={16} />Sơ đồ cây 2D</button>
        <button className="quiet-control" disabled><Box size={16} />Mạng lưới 3D</button>
        <span className="toolbar-divider" />
        <label className="scenario-select"><span>Kịch bản</span><select><option>Kế hoạch T8/2026 (Draft)</option><option>Tái cấu trúc Sales (Draft)</option></select></label>
        <button className="icon-control" onClick={undo} disabled={!history.length || !canEdit}><Undo2 size={16} /><span>Undo</span></button>
        <button className="icon-control" onClick={redo} disabled={!future.length || !canEdit}><Redo2 size={16} /><span>Redo</span></button>
        <span className="toolbar-grow" />
        <button className="quiet-control" onClick={saveDraft} disabled={!canEdit}><Save size={16} />Lưu nháp</button>
        <button className="primary-control" onClick={mainAction} disabled={!canEdit}><GitCommitHorizontal size={17} />{role === 'hr' ? 'Commit' : role === 'manager' ? 'Gửi duyệt' : 'Chỉ xem'}</button>
      </nav>

      <section className="context-strip">
        <div><span className={`scenario-state state-${state.toLowerCase()}`}>{state}</span><span>{history.length ? `${history.length} thay đổi chưa lưu` : 'Không có thay đổi chưa lưu'}</span></div>
        <div className="legend"><span><i className="dot good" />Hợp ≥80</span><span><i className="dot medium" />Trung bình 60–79</span><span><i className="dot low" />Lệch &lt;60</span></div>
      </section>

      <section className="department-board">
        {DEPARTMENTS.map((department) => {
          const members = filtered.filter((person) => person.dept === department.id)
          const average = members.length ? Math.round(members.reduce((sum, person) => sum + deptFit(person), 0) / members.length) : null
          return (
            <section key={department.id} className={`department-lane ${dropDept === department.id ? 'drop-ready' : ''}`}
              onDragOver={(event) => { if (canEdit) { event.preventDefault(); setDropDept(department.id) } }}
              onDragLeave={() => setDropDept(null)}
              onDrop={(event) => { event.preventDefault(); movePerson(draggingId, department.id); setDropDept(null); setDraggingId(null) }}>
              <header className="lane-header"><div><h2>{department.name}</h2><p>{department.en}</p></div><div className="lane-summary"><strong>{average ?? '—'}%</strong><span>{members.length} thành viên</span></div></header>
              <div className="lane-content">
                {members.map((person) => <article key={person.id} className={`person-card tone-${scoreTone(person.jobFit)}`} draggable={canEdit}
                  onDragStart={() => setDraggingId(person.id)} onClick={() => setSelectedId(person.id)} tabIndex={0}>
                  <div className="person-heading"><i className={`dot ${scoreTone(person.jobFit)}`} /><div><h3>{person.id}: {person.name}</h3><p>{person.latin} · {person.role}</p></div><span className={`fit-pill ${scoreTone(person.jobFit)}`}>Fit {person.jobFit}%</span></div>
                  <div className="trait-row">{person.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
                  <select className="mobile-move" value="" disabled={!canEdit} onClick={(event) => event.stopPropagation()} onChange={(event) => movePerson(person.id, event.target.value)}><option value="">Chuyển tới…</option>{DEPARTMENTS.filter((item) => item.id !== person.dept).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
                </article>)}
                {!members.length && <div className="empty-drop"><Network size={20} /><span>Thả thẻ nhân sự vào đây</span><small>Dự kiến cập nhật Fit Score ngay lập tức</small></div>}
              </div>
            </section>
          )
        })}
      </section>

      {selected && <aside className="detail-drawer">
        <div className="drawer-heading"><div><span>HỒ SƠ NHÂN SỰ</span><h2>{selected.name} <small>({selected.latin})</small></h2><p>{selected.id} · {selected.role}</p></div><button onClick={() => setSelectedId(null)} aria-label="Đóng"><X size={20} /></button></div>
        <div className="score-block"><Score label="Job Fit" value={selected.jobFit} /><Score label="Department Fit" value={deptFit(selected)} /></div>
        <div className="drawer-note"><Check size={17} /><span>Job Fit được ưu tiên trên thẻ; Department Fit phản ánh phòng ban hiện tại.</span></div>
      </aside>}
      {notice && <div className="app-notice"><Check size={15} />{notice}</div>}
    </main>
  )
}

function Score({ label, value }) {
  return <div className="score-line"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>
}

export default App
