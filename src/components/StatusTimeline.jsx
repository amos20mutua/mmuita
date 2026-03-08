import { ORDER_STATUSES, statusColor, statusLabel } from '../utils/status'

export default function StatusTimeline({ current, history = [] }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold">Status Timeline</h3>
      <div className="mt-3 space-y-2">
        {ORDER_STATUSES.map((s) => {
          const done = ORDER_STATUSES.indexOf(s) <= ORDER_STATUSES.indexOf(current)
          const event = history.find((h) => h.status === s)
          return (
            <div key={s} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${done ? statusColor[s] : 'bg-[#0a291f]'}`}>
              <span>{statusLabel[s]}</span>
              <span className="text-xs">{event ? new Date(event.created_at).toLocaleTimeString() : '--'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
