import { scoreTone } from '../domain/scoring.js'

export function EmployeeCard({ person, departments, canEdit, onSelect, onMove, onDragStart }) {
  const tone = scoreTone(person.jobFit)
  return <article className={`person-card tone-${tone}`} draggable={canEdit} onDragStart={() => onDragStart(person.id)}>
    <button type="button" className="person-card-open" onClick={() => onSelect(person.id)} aria-label={`Xem hồ sơ ${person.id} ${person.name}`}>
      <div className="person-heading"><i className={`dot ${tone}`} /><div><h3>{person.id}: {person.name}</h3><p>{person.latin} · {person.role}</p></div><span className={`fit-pill ${tone}`}>Fit {person.jobFit}%</span></div>
      <div className="trait-row">{person.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
    </button>
    <select className="move-select" value="" disabled={!canEdit} aria-label={`Chuyển ${person.id} sang phòng ban khác`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} onChange={(event) => onMove(person.id, event.target.value)}>
      <option value="">Chuyển tới…</option>{departments.filter((item) => item.id !== person.dept).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
    </select>
  </article>
}
