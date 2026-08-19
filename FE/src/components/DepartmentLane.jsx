import { Network } from 'lucide-react'
import { departmentFit } from '../domain/scoring.js'
import { EmployeeCard } from './EmployeeCard.jsx'

export function DepartmentLane({ department, departments, members, canEdit, isDropTarget, onDropTargetChange, onDrop, onMove, onSelect, onDragStart }) {
  const average = members.length ? Math.round(members.reduce((sum, person) => sum + departmentFit(person), 0) / members.length) : null
  return <section className={`department-lane ${isDropTarget ? 'drop-ready' : ''}`}
    onDragOver={(event) => { if (canEdit) { event.preventDefault(); onDropTargetChange(department.id) } }}
    onDragLeave={() => onDropTargetChange(null)}
    onDrop={(event) => { event.preventDefault(); onDrop(department.id) }}>
    <header className="lane-header"><div><h2>{department.name}</h2><p>{department.en}</p></div><div className="lane-summary"><strong>{average ?? '—'}%</strong><span>{members.length} thành viên</span></div></header>
    <div className="lane-content">
      {members.map((person) => <EmployeeCard key={person.id} person={person} departments={departments} canEdit={canEdit} onSelect={onSelect} onMove={onMove} onDragStart={onDragStart} />)}
      {!members.length && <div className="empty-drop"><Network size={20} /><span>Thả thẻ nhân sự vào đây</span><small>Dự kiến cập nhật Fit Score ngay lập tức</small></div>}
    </div>
  </section>
}
