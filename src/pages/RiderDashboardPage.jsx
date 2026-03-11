import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingCard from '../components/common/LoadingCard'
import EmptyState from '../components/common/EmptyState'
import Toast from '../components/common/Toast'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { statusLabel } from '../utils/status'
import { isSupabaseEnabled, supabase } from '../lib/supabase'

export default function RiderDashboardPage() {
  const { user, profile } = useAuth()
  const [rider, setRider] = useState(null)
  const [openOrders, setOpenOrders] = useState(null)
  const [myJobs, setMyJobs] = useState([])
  const [toast, setToast] = useState('')
  const prevOpenCount = useRef(0)
  const [tick, setTick] = useState(Date.now())
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`efk-rider-dismissed-${user?.id || 'x'}`) || '[]')
    } catch {
      return []
    }
  })

  const load = async () => {
    if (!user) return
    const { data: riderRow } = await api.riderByProfile(user.id)
    setRider(riderRow || null)
    const [{ data: pending }, { data: assigned }] = await Promise.all([
      api.riderOpenOrders(),
      api.riderAssignedOrders(riderRow?.id)
    ])
    setOpenOrders(pending || [])
    setMyJobs(assigned || [])
  }

  useEffect(() => {
    load()
  }, [user?.id])

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!openOrders) return
    const visibleCount = openOrders.filter((o) => !dismissed.includes(o.id)).length
    if (prevOpenCount.current && visibleCount > prevOpenCount.current) {
      setToast('New request available.')
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Efikishe', { body: 'New delivery request is available.' })
      }
    }
    prevOpenCount.current = visibleCount
  }, [openOrders, dismissed])

  useEffect(() => {
    if (!isSupabaseEnabled || !user?.id) return
    const channel = supabase
      .channel(`rider-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id, rider?.id])

  const accept = async (order) => {
    if (!rider?.id) return setToast('Rider profile missing. Ask admin to complete rider setup.')
    const bikeId = rider?.bikes?.[0]?.id || null
    const { error } = await api.acceptOrder({
      orderId: order.id,
      riderId: rider.id,
      bikeId,
      changedBy: user.id
    })
    if (error) return setToast(error.message)
    setToast('Order accepted.')
    load()
  }

  const reject = async (order) => {
    const next = Array.from(new Set([...dismissed, order.id]))
    setDismissed(next)
    sessionStorage.setItem(`efk-rider-dismissed-${user?.id || 'x'}`, JSON.stringify(next))
    await api.addStatusHistory({
      order_id: order.id,
      status: order.status,
      note: 'Declined by rider',
      changed_by: user.id
    })
    setToast('Request skipped.')
  }

  const visibleOpenOrders = useMemo(() => (openOrders || []).filter((o) => !dismissed.includes(o.id)), [openOrders, dismissed])
  const ageMinutes = (iso) => Math.max(0, Math.round((tick - new Date(iso).getTime()) / 60000))

  if (openOrders === null) return <LoadingCard text="Loading rider operations..." />
  if (!profile?.is_active) return <EmptyState title="Awaiting approval" subtitle="Your rider account is pending admin approval." />

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h1 className="text-2xl font-extrabold">Rider Dashboard</h1>
        <p className="text-sm text-slate-300">Accept requests and manage active deliveries.</p>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 text-lg font-bold">Open Requests</h2>
        {!visibleOpenOrders.length ? (
          <p className="text-sm text-slate-400">You are all caught up. New requests will appear here instantly.</p>
        ) : (
          <div className="space-y-2">
            {visibleOpenOrders.map((o) => (
              <article key={o.id} className="rounded-xl border border-line bg-[#0b271f] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-300">{o.tracking_code}</p>
                    <p className="font-bold">{o.pickup_address_text} {'->'} {o.dropoff_address_text}</p>
                    <p className="text-xs text-slate-400">KES {Number(o.estimated_price || 0).toFixed(0)} | {ageMinutes(o.created_at)} min ago</p>
                    {ageMinutes(o.created_at) >= 5 && <p className="mt-1 text-[11px] text-amber-300">Priority alert: this request needs quick pickup</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost px-3 py-1.5" onClick={() => reject(o)}>Skip</button>
                    <button className="btn-primary" onClick={() => accept(o)}>Accept</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 text-lg font-bold">My Active Jobs</h2>
        {!myJobs.length ? (
          <p className="text-sm text-slate-400">No active jobs at the moment. Keep the app open for live dispatch.</p>
        ) : (
          <div className="space-y-2">
            {myJobs.map((o) => (
              <article key={o.id} className="flex items-center justify-between rounded-xl border border-line bg-[#0b271f] p-3">
                <div>
                  <p className="text-sm text-slate-300">{o.tracking_code}</p>
                  <p className="font-bold">{o.pickup_address_text} {'->'} {o.dropoff_address_text}</p>
                </div>
                <div className="text-right">
                  <p className="badge">{statusLabel[o.status]}</p>
                  <Link className="mt-1 block text-sm text-brand" to={`/track/${o.tracking_code}`}>Track</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Toast message={toast} />
    </div>
  )
}

