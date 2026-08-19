import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'

export function LoadState({ loading, error, onRetry }) {
  if (loading) return <section className="app-state" role="status"><LoaderCircle className="state-spinner" size={20} /><span>Đang tải dữ liệu tổ chức…</span></section>
  if (error) return <section className="app-state app-error" role="alert"><AlertCircle size={20} /><div><strong>Không thể tải dữ liệu từ backend</strong><small>{error.message}</small></div><button className="quiet-control" onClick={onRetry}><RefreshCw size={15} />Thử lại</button></section>
  return null
}
