import { statusColor, statusLabel } from '../utils/status'

export default function LiveTrackingPanel({ order }) {
  if (!order) return null
  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{order.tracking_code}</h2>
        <span className={`badge border-0 ${statusColor[order.status] || 'bg-slate-700'}`}>{statusLabel[order.status] || order.status}</span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div><p>ETA</p><p className="font-bold text-white">{order.estimated_duration_minutes || '--'} min</p></div>
        <div><p>Rider</p><p className="font-bold text-white">{order.profiles?.full_name || 'Unassigned'}</p></div>
        <div><p>Bike</p><p className="font-bold text-white">{order.bikes?.bike_code || '--'}</p></div>
      </div>
    </section>
  )
}
