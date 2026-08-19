import { ChevronDown, Languages, Search, UserRound } from 'lucide-react'

export function AppHeader({ query, onQueryChange, role, onRoleChange }) {
  return <header className="app-header">
    <div className="brand-block"><strong>PeopleLens</strong><span>Musashino AI事業部</span><ChevronDown size={15} /></div>
    <label className="global-search"><Search size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="自然言語検索：挑戦心が80以上の人材…" /><kbd>⌘ K</kbd></label>
    <div className="user-block"><Languages size={16} /><span>JP</span><label className="role-select"><select aria-label="Vai trò demo" value={role} onChange={(event) => onRoleChange(event.target.value)}><option value="hr">HR Admin</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select></label><UserRound size={17} /><span>山田 太郎</span></div>
  </header>
}
