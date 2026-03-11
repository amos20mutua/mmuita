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
  const [addresses, setAddresses] = useState([])
  const [ratingsByOrder, setRatingsByOrder] = useState({})
  const [rateOpen, setRateOpen] = useState(null)
  const [ratingForm, setRatingForm] = useState({ rider_score: 5, app_score: 5, rider_feedback: '', app_feedback: '' })
  const [savingRating, setSavingRating] = useState(false)

  useEffect(() => {
    if (!user) return
    api.myOrders(user.id).then(({ data }) => setOrders(data || []))
    api.addresses(user.id).then(({ data }) => setAddresses(data || []))
    api.myRatings?.(user.id).then(({ data }) => {
      const byOrder = {}
      ;(data || []).forEach((r) => {
        byOrder[r.order_id] = r
      })
      setRatingsByOrder(byOrder)
    })
  }, [user])

  const openRate = (orderId) => {
    const existing = ratingsByOrder[orderId]
    setRatingForm({
      rider_score: existing?.rider_score || 5,
      app_score: existing?.app_score || 5,
      rider_feedback: existing?.rider_feedback || '',
      app_feedback: existing?.app_feedback || ''
    })
    setRateOpen(orderId)
  }

  const submitRating = async (order) => {
    if (!user?.id || !order?.id) return
    setSavingRating(true)
    const payload = {
      order_id: order.id,
      customer_id: user.id,
      rider_id: order.rider_id || null,
      rider_score: Number(ratingForm.rider_score),
      app_score: Number(ratingForm.app_score),
      rider_feedback: ratingForm.rider_feedback?.trim() || null,
      app_feedback: ratingForm.app_feedback?.trim() || null
    }
    const { data, error } = await api.submitOrderRating(payload)
    setSavingRating(false)
    if (error) return
    const saved = Array.isArray(data) ? data[0] : data || payload
    setRatingsByOrder((prev) => ({ ...prev, [order.id]: saved }))
    setRateOpen(null)
  }

  if (!orders) return <LoadingCard text="Loading deliveries..." />
  if (!orders.length) return <EmptyState title="You are ready to send" subtitle="Your next delivery can be booked in seconds." action={<Link to="/request" className="btn-primary">Request Delivery</Link>} />

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">My Deliveries</h1>
      <section className="card p-4">
        <h2 className="text-sm font-bold">Saved Addresses</h2>
        {addresses.length ? (
          <div className="mt-2 space-y-1 text-sm text-slate-300">{addresses.slice(0, 3).map((a) => <p key={a.id}>{a.label}: {a.address_text}</p>)}</div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Saved addresses will appear here after your first delivery.</p>
        )}
      </section>
      {orders.map((o) => (
        <article key={o.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="text-sm text-slate-300">{o.tracking_code}</p>
            <p className="font-bold">{o.pickup_address_text} {'->'} {o.dropoff_address_text}</p>
            <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleString()}</p>
            {o.status === 'delivered' && ratingsByOrder[o.id] && (
              <p className="mt-1 text-xs text-brand">Rated: Rider {ratingsByOrder[o.id].rider_score}/5 | App {ratingsByOrder[o.id].app_score}/5</p>
            )}
          </div>
          <div className="text-right">
            <p className="badge">{statusLabel[o.status]}</p>
            <p className="mt-2 font-bold">KES {Number(o.final_price || o.estimated_price).toFixed(0)}</p>
            <Link className="text-sm text-brand" to={`/track/${o.tracking_code}`}>Open</Link>
            {o.status === 'delivered' && (
              <button className="ml-3 text-sm text-brand" onClick={() => openRate(o.id)}>
                {ratingsByOrder[o.id] ? 'Update Rating' : 'Rate Ride'}
              </button>
            )}
          </div>
          {rateOpen === o.id && (
            <div className="mt-3 w-full rounded-xl border border-line bg-[#0a291f] p-3 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs text-slate-300">Rider rating</span>
                  <select className="input h-10" value={ratingForm.rider_score} onChange={(e) => setRatingForm((s) => ({ ...s, rider_score: e.target.value }))}>
                    {[5, 4, 3, 2, 1].map((v) => <option key={v} value={v}>{v}/5</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-slate-300">Web app rating</span>
                  <select className="input h-10" value={ratingForm.app_score} onChange={(e) => setRatingForm((s) => ({ ...s, app_score: e.target.value }))}>
                    {[5, 4, 3, 2, 1].map((v) => <option key={v} value={v}>{v}/5</option>)}
                  </select>
                </label>
                <input className="input h-10" value={ratingForm.rider_feedback} onChange={(e) => setRatingForm((s) => ({ ...s, rider_feedback: e.target.value }))} placeholder="Rider feedback (optional)" />
                <input className="input h-10" value={ratingForm.app_feedback} onChange={(e) => setRatingForm((s) => ({ ...s, app_feedback: e.target.value }))} placeholder="App feedback (optional)" />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => setRateOpen(null)}>Cancel</button>
                <button className="btn-primary" disabled={savingRating} onClick={() => submitRating(o)}>{savingRating ? 'Saving...' : 'Submit Rating'}</button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

