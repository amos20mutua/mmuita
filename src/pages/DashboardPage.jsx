import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import LoadingCard from '../components/common/LoadingCard'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { statusLabel } from '../utils/status'

export default function DashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (!user) return
    api.myOrders(user.id).then(({ data }) => setOrders(data || []))
  }, [user])

  if (!orders) return <LoadingCard text="Loading deliveries..." />
  if (!orders.length) return <EmptyState title="No deliveries yet" subtitle="Create your first request in under a minute." action={<Link to="/request" className="btn-primary">Request Delivery</Link>} />

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">My Deliveries</h1>
      {orders.map((o) => (
        <article key={o.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="text-sm text-slate-300">{o.tracking_code}</p>
            <p className="font-bold">{o.pickup_address_text} {'->'} {o.dropoff_address_text}</p>
            <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="badge">{statusLabel[o.status]}</p>
            <p className="mt-2 font-bold">KES {Number(o.final_price || o.estimated_price).toFixed(0)}</p>
            <Link className="text-sm text-brand" to={`/track/${o.tracking_code}`}>Open</Link>
          </div>
        </article>
      ))}
    </div>
  )
}
