import { Box, GitCommitHorizontal, Network, Redo2, Save, Undo2 } from 'lucide-react'

export function SimulationToolbar({ canEdit, canUndo, canRedo, role, onUndo, onRedo, onSave, onMainAction }) {
  return <nav className="work-toolbar" aria-label="Công cụ mô phỏng">
    <button className="quiet-control active"><Network size={16} />Sơ đồ cây 2D</button>
    <button className="quiet-control" disabled><Box size={16} />Mạng lưới 3D</button>
    <span className="toolbar-divider" />
    <label className="scenario-select"><span>Kịch bản</span><select aria-label="Kịch bản"><option>Kế hoạch T8/2026 (Draft)</option><option>Tái cấu trúc Sales (Draft)</option></select></label>
    <button className="icon-control" onClick={onUndo} disabled={!canUndo || !canEdit}><Undo2 size={16} /><span>Undo</span></button>
    <button className="icon-control" onClick={onRedo} disabled={!canRedo || !canEdit}><Redo2 size={16} /><span>Redo</span></button>
    <span className="toolbar-grow" />
    <button className="quiet-control" onClick={onSave} disabled={!canEdit}><Save size={16} />Lưu nháp</button>
    <button className="primary-control" onClick={onMainAction} disabled={!canEdit}><GitCommitHorizontal size={17} />{role === 'hr' ? 'Commit' : role === 'manager' ? 'Gửi duyệt' : 'Chỉ xem'}</button>
  </nav>
}
