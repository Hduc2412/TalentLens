import { Check, X } from 'lucide-react'
import { departmentFit } from '../domain/scoring.js'

function Score({ label, value }) {
  return <div className="score-line"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>
}

export function EmployeeDetail({ person, onClose }) {
  if (!person) return null
  return <aside className="detail-drawer">
    <div className="drawer-heading"><div><span>HỒ SƠ NHÂN SỰ</span><h2>{person.name} <small>({person.latin})</small></h2><p>{person.id} · {person.role}</p></div><button onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
    <div className="score-block"><Score label="Job Fit" value={person.jobFit} /><Score label="Department Fit" value={departmentFit(person)} /></div>
    <div className="drawer-note"><Check size={17} /><span>Job Fit được ưu tiên trên thẻ; Department Fit phản ánh phòng ban hiện tại.</span></div>
  </aside>
}
