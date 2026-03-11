import { useEffect, useMemo, useRef, useState } from 'react'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTable from '../components/admin/AdminTable'
import AddRiderForm from '../components/admin/AddRiderForm'
import SettingsForm from '../components/admin/SettingsForm'
import LazyMapView from '../components/LazyMapView'
import Toast from '../components/common/Toast'
import LoadingCard from '../components/common/LoadingCard'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { createSimulation } from '../services/simulator'
import { statusLabel } from '../utils/status'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { defaultPublicPages, mergePublicPages } from '../utils/publicPages'

const tabLoaders = {
  overview: ['orders', 'riders', 'bikes'],
  orders: ['orders', 'riders'],
  riders: ['riders', 'customers'],
  fleet: ['bikes'],
  live_map: ['orders', 'riders'],
  services: ['services'],
  vehicle_types: ['vehicleTypes'],
  zones: ['zones'],
  pricing: ['pricingConfigs'],
  content: ['publicPages'],
  customers: ['customers'],
  support: ['orders', 'supportMessages'],
  analytics: ['ratings'],
  notifications: ['notifications'],
  logs: ['logs']
}

export default function AdminPage() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState({})
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [services, setServices] = useState([])
  const [zones, setZones] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [pricingConfigs, setPricingConfigs] = useState([])
  const [bikes, setBikes] = useState([])
  const [customers, setCustomers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [supportMessages, setSupportMessages] = useState([])
  const [ratings, setRatings] = useState([])
  const [publicPages, setPublicPages] = useState(defaultPublicPages)
  const [logs, setLogs] = useState([])
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [orderEdits, setOrderEdits] = useState({})
  const [toast, setToast] = useState('')
  const prevOrderCount = useRef(0)
  const pendingRiderProfiles = customers.filter((c) => c.role === 'rider' && !c.is_active)

  const loadPart = async (key) => {
    if (key === 'orders') {
      const r = await api.adminOrders(active === 'orders' ? 500 : 120)
      setOrders(r.data || [])
    }
    if (key === 'riders') {
      const r = await api.riders()
      setRiders(r.data || [])
    }
    if (key === 'bikes') {
      const r = await api.bikes()
      setBikes(r.data || [])
    }
    if (key === 'services') {
      const r = await (api.servicesAdmin ? api.servicesAdmin() : api.services())
      setServices(r.data || [])
    }
    if (key === 'zones') {
      const r = await (api.zonesAdmin ? api.zonesAdmin() : api.zones())
      setZones(r.data || [])
    }
    if (key === 'vehicleTypes') {
      const r = await (api.vehicleTypesAdmin ? api.vehicleTypesAdmin() : api.vehicleTypes())
      setVehicleTypes(r.data || [])
    }
    if (key === 'pricingConfigs') {
      const r = await (api.pricingAdmin ? api.pricingAdmin() : api.pricingRules())
      setPricingConfigs(r.data || [])
    }
    if (key === 'customers') {
      const r = await api.customers()
      setCustomers(r.data || [])
    }
    if (key === 'supportMessages') {
      const r = await api.adminMessages(600)
      setSupportMessages(r.data || [])
    }
    if (key === 'publicPages') {
      const r = await api.publicPages()
      setPublicPages(mergePublicPages(r.data))
    }
    if (key === 'ratings') {
      const r = await (api.allRatings ? api.allRatings() : Promise.resolve({ data: [] }))
      setRatings(r.data || [])
    }
    if (key === 'notifications') {
      const r = await api.notifications()
      setNotifications(r.data || [])
    }
    if (key === 'logs') {
      const r = await (api.auditLogs ? api.auditLogs() : Promise.resolve({ data: [] }))
      setLogs(r.data || [])
    }
  }

  const ensureForTab = async (tab) => {
    const needs = tabLoaders[tab] || []
    const missing = needs.filter((n) => !loaded[n])
    if (!missing.length) return
    setLoading(true)
    await Promise.all(missing.map(loadPart))
    setLoaded((s) => Object.fromEntries([...Object.keys(s), ...missing].map((k) => [k, true])))
    setLoading(false)
  }

  useEffect(() => {
    ensureForTab('overview')
  }, [])

  useEffect(() => {
    ensureForTab(active)
  }, [active])

  useEffect(() => {
    if (active !== 'overview') return
    const id = setInterval(async () => {
      await Promise.all([loadPart('orders'), loadPart('riders'), loadPart('bikes')])
    }, 10000)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    if (!isSupabaseEnabled) return
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        loadPart('orders')
        setToast('New order received.')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => loadPart('orders'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages' }, () => {
        loadPart('supportMessages')
        setToast('New customer/rider message.')
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (!orders.length) return
    if (prevOrderCount.current && orders.length > prevOrderCount.current) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Efikishe', { body: 'New delivery request received.' })
      }
    }
    prevOrderCount.current = orders.length
  }, [orders.length])

  const overview = useMemo(() => {
    const today = new Date().toDateString()
    const completeToday = orders.filter((o) => o.status === 'delivered' && new Date(o.updated_at).toDateString() === today).length
    return {
      total: orders.length,
      active: orders.filter((o) => ['confirmed', 'rider_assigned', 'picked_up', 'in_transit'].includes(o.status)).length,
      completeToday,
      revenue: orders.reduce((s, o) => s + Number(o.final_price || 0), 0),
      ridersOnline: riders.filter((r) => r.bikes?.some((b) => b.status !== 'offline')).length,
      fleet: bikes.length
    }
  }, [orders, riders, bikes])

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => {
      const byStatus = orderStatus === 'all' || o.status === orderStatus
      const q = orderSearch.trim().toLowerCase()
      const bySearch =
        !q ||
        (o.pickup_address_text || '').toLowerCase().includes(q) ||
        (o.dropoff_address_text || '').toLowerCase().includes(q) ||
        (o.sender_name || '').toLowerCase().includes(q) ||
        (o.recipient_name || '').toLowerCase().includes(q)
      return byStatus && bySearch
    })
  }, [orders, orderSearch, orderStatus])

  const supportThreads = useMemo(() => {
    const grouped = new Map()
    for (const m of supportMessages) {
      if (!grouped.has(m.order_id)) grouped.set(m.order_id, [])
      grouped.get(m.order_id).push(m)
    }
    return Array.from(grouped.entries()).map(([orderId, msgs]) => {
      const order = orders.find((o) => o.id === orderId)
      const last = msgs[0]
      return {
        id: orderId,
        order,
        count: msgs.length,
        last_text: last?.message_text,
        last_at: last?.created_at
      }
    })
  }, [supportMessages, orders])

  const addRider = async (payload) => {
    const { error } = await api.promoteRiderByEmail(payload.email, payload)
    setToast(error ? error.message : 'Rider enabled.')
    await Promise.all([loadPart('riders'), loadPart('customers')])
  }

  const draftFor = (o) =>
    orderEdits[o.id] || {
      status: o.status,
      rider_id: o.rider_id || ''
    }

  const updateDraft = (orderId, patch) => {
    setOrderEdits((s) => ({ ...s, [orderId]: { ...(s[orderId] || {}), ...patch } }))
  }

  const saveOrderOps = async (order, overrideDraft) => {
    const d = overrideDraft || draftFor(order)
    const riderRow = riders.find((r) => r.id === d.rider_id)
    const bikeId = riderRow?.bikes?.[0]?.id || null
    const payload = {
      status: d.status || order.status,
      rider_id: d.rider_id || null,
      bike_id: d.rider_id ? bikeId : null
    }
    const { error } = await api.updateOrder(order.id, payload)
    if (error) return setToast(error.message || 'Failed to update order')
    if (payload.status !== order.status) {
      await api.addStatusHistory({
        order_id: order.id,
        status: payload.status,
        note: `Updated from admin to ${payload.status}`,
        changed_by: user.id
      })
    }
    if (api.logAdminAction) {
      await api.logAdminAction({
        admin_user_id: user.id,
        action: 'order_update',
        entity_type: 'orders',
        entity_id: order.id,
        payload_json: payload
      })
    }
    setToast('Order updated.')
    await loadPart('orders')
  }

  const autoAssignOrder = async (order) => {
    const candidates = riders
      .filter((r) => ['available', 'online', 'idle'].includes((r.status || '').toLowerCase()) || r.is_available)
      .map((r) => ({ rider: r, bike: (r.bikes || []).find((b) => b.status === 'available') || (r.bikes || [])[0] }))
      .filter((x) => x.rider && x.bike)
    if (!candidates.length) return setToast('No available riders/bikes for auto-assign.')
    const matched = candidates.find((x) => x.bike.vehicle_type_id === order.vehicle_type_id) || candidates[0]
    updateDraft(order.id, { rider_id: matched.rider.id, status: 'rider_assigned' })
    await saveOrderOps(order, { rider_id: matched.rider.id, status: 'rider_assigned' })
  }

  const runSim = async () => {
    const order = orders.find((o) => o.status !== 'delivered' && o.rider_id)
    const rider = riders.find((r) => r.id === order?.rider_id)
    const bike = rider?.bikes?.[0]
    if (!order || !bike) return setToast('Need one active order with assigned rider/bike.')
    createSimulation({ order, bike, riderId: rider.id, riderProfileId: rider.profile_id, onTick: () => loadPart('orders') })
    setToast('Simulation started.')
  }

  const updatePublicPageField = (pageKey, field, value) => {
    setPublicPages((s) => ({ ...s, [pageKey]: { ...(s[pageKey] || {}), [field]: value } }))
  }

  const savePublicContent = async () => {
    const normalized = Object.fromEntries(
      Object.entries(publicPages).map(([k, v]) => [
        k,
        {
          ...v,
          points: Array.isArray(v.points)
            ? v.points.map((x) => String(x).trim()).filter(Boolean)
            : String(v.points || '')
                .split('\n')
                .map((x) => x.trim())
                .filter(Boolean)
        }
      ])
    )
    const { error } = await api.savePublicPages(normalized)
    setToast(error ? error.message : 'Public page content saved.')
    if (!error) setPublicPages(normalized)
  }

  const renderPane = () => {
    if (loading && !(tabLoaders[active] || []).every((k) => loaded[k])) return <LoadingCard text="Loading operations..." />

    if (active === 'overview') {
      return (
        <section className="grid gap-3 md:grid-cols-3">
          <Stat l="Total orders" v={overview.total} />
          <Stat l="Active deliveries" v={overview.active} />
          <Stat l="Completed today" v={overview.completeToday} />
          <Stat l="Revenue" v={`KES ${overview.revenue.toFixed(0)}`} />
          <Stat l="Riders online" v={overview.ridersOnline} />
          <Stat l="Fleet size" v={overview.fleet} />
        </section>
      )
    }

    if (active === 'orders') {
      return (
        <div className="space-y-3">
          <div className="card flex flex-col gap-2 p-3 md:flex-row">
            <input className="input" placeholder="Search route or names..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
            <select className="input md:w-52" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rider_assigned">Rider assigned</option>
              <option value="picked_up">Picked up</option>
              <option value="in_transit">In transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <AdminTable
            columns={[
              { key: 'route', label: 'Route', render: (o) => <span>{o.pickup_address_text} {'->'} {o.dropoff_address_text}</span> },
              { key: 'contacts', label: 'Contacts', render: (o) => <span>{o.sender_name || '--'} / {o.recipient_name || '--'}</span> },
              { key: 'rider', label: 'Rider', render: (o) => riders.find((r) => r.id === o.rider_id)?.display_name || 'Unassigned' },
              { key: 'status', label: 'Status', render: (o) => statusLabel[o.status] || o.status },
              { key: 'fare', label: 'Fare', render: (o) => `KES ${Number(o.final_price || o.estimated_price || 0).toFixed(0)}` },
              { key: 'created_at', label: 'Created', render: (o) => new Date(o.created_at).toLocaleString() },
              {
                key: 'actions',
                label: 'Actions',
                render: (o) => {
                  const d = draftFor(o)
                  return (
                    <div className="flex min-w-[260px] flex-col gap-1">
                      <select className="input h-8 py-1 text-xs" value={d.status} onChange={(e) => updateDraft(o.id, { status: e.target.value })}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rider_assigned">Rider Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select className="input h-8 py-1 text-xs" value={d.rider_id || ''} onChange={(e) => updateDraft(o.id, { rider_id: e.target.value })}>
                        <option value="">Unassigned</option>
                        {riders.map((r) => (
                          <option key={r.id} value={r.id}>{r.display_name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button className="btn-primary h-8 flex-1 px-3 py-1 text-xs" onClick={() => saveOrderOps(o)}>Save</button>
                        <button className="btn-ghost h-8 px-2 py-1 text-xs" onClick={() => autoAssignOrder(o)}>Auto</button>
                      </div>
                    </div>
                  )
                }
              }
            ]}
            rows={visibleOrders}
          />
        </div>
      )
    }

    if (active === 'riders') {
      return (
        <div className="space-y-3">
          <AddRiderForm onCreate={addRider} />
          {!!pendingRiderProfiles.length && (
            <div className="card p-3">
              <p className="mb-2 text-sm font-bold">Pending Rider Approvals</p>
              <div className="space-y-2">
                {pendingRiderProfiles.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-[#0b271f] p-2">
                    <div>
                      <p className="font-bold">{p.full_name || 'Unnamed rider'}</p>
                      <p className="text-xs text-slate-400">{p.email} {p.phone ? `| ${p.phone}` : ''}</p>
                    </div>
                    <button className="btn-primary" onClick={() => addRider({ email: p.email, full_name: p.full_name, phone: p.phone })}>Approve</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <AdminTable
            columns={[
              { key: 'display_name', label: 'Name' },
              { key: 'email', label: 'Email', render: (r) => r.profiles?.email || '--' },
              { key: 'phone', label: 'Phone', render: (r) => r.phone || r.profiles?.phone || '--' },
              { key: 'status', label: 'Rider Status' },
              { key: 'bike_status', label: 'Bike Status', render: (r) => r.bikes?.[0]?.status || 'offline' }
            ]}
            rows={riders}
          />
        </div>
      )
    }

    if (active === 'fleet') {
      return (
        <AdminTable
          columns={[
            { key: 'bike_code', label: 'Bike Code' },
            { key: 'identifier', label: 'Identifier' },
            { key: 'status', label: 'Status' },
            { key: 'battery_level', label: 'Battery', render: (b) => `${b.battery_level ?? 0}%` },
            { key: 'rider', label: 'Rider', render: (b) => b.riders?.display_name || '--' }
          ]}
          rows={bikes}
        />
      )
    }

    if (active === 'live_map') {
      const order = orders.find((o) => o.status !== 'delivered')
      const pickup = order ? { lat: order.pickup_latitude, lng: order.pickup_longitude } : null
      const dropoff = order ? { lat: order.dropoff_latitude, lng: order.dropoff_longitude } : null
      const rider = riders.find((r) => r.id === order?.rider_id)
      const riderPos = rider?.bikes?.[0] ? { lat: rider.bikes[0].current_latitude, lng: rider.bikes[0].current_longitude } : null
      return (
        <div className="space-y-3">
          <button className="btn-primary" onClick={runSim}>Run Rider Simulation</button>
          <LazyMapView pickup={pickup} dropoff={dropoff} rider={riderPos} />
        </div>
      )
    }

    if (active === 'services') return <AdminTable columns={[{ key: 'name', label: 'Service' }, { key: 'slug', label: 'Slug' }, { key: 'active', label: 'Active' }]} rows={services} />
    if (active === 'vehicle_types') return <AdminTable columns={[{ key: 'name', label: 'Vehicle Type' }, { key: 'slug', label: 'Slug' }, { key: 'description', label: 'Description' }, { key: 'active', label: 'Active' }]} rows={vehicleTypes} />
    if (active === 'pricing') return <AdminTable columns={[{ key: 'service', label: 'Service', render: (p) => p.services?.name || p.service_id }, { key: 'vehicle', label: 'Vehicle', render: (p) => p.vehicle_types?.name || p.vehicle_type_id }, { key: 'base_fare', label: 'Base Fare' }, { key: 'per_km_rate', label: 'Per KM' }, { key: 'active', label: 'Active' }]} rows={pricingConfigs} />
    if (active === 'zones') return <AdminTable columns={[{ key: 'name', label: 'Zone' }, { key: 'surcharge', label: 'Surcharge' }, { key: 'active', label: 'Active' }]} rows={zones} />
    if (active === 'content') {
      return (
        <div className="space-y-3">
          {['track', 'promotions', 'support', 'about', 'payments'].map((key) => {
            const row = publicPages[key] || {}
            return (
              <section key={key} className="card p-4">
                <h3 className="mb-3 text-sm font-bold capitalize">{key} page</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <input className="input" value={row.title || ''} onChange={(e) => updatePublicPageField(key, 'title', e.target.value)} placeholder="Title" />
                  <input className="input" value={row.intro || ''} onChange={(e) => updatePublicPageField(key, 'intro', e.target.value)} placeholder="Intro" />
                  <textarea className="input min-h-24 md:col-span-2" value={Array.isArray(row.points) ? row.points.join('\n') : row.points || ''} onChange={(e) => updatePublicPageField(key, 'points', e.target.value)} placeholder="One bullet per line" />
                  <input className="input md:col-span-2" value={row.footer || ''} onChange={(e) => updatePublicPageField(key, 'footer', e.target.value)} placeholder="Footer" />
                </div>
              </section>
            )
          })}
          <button className="btn-primary" onClick={savePublicContent}>Save Public Content</button>
        </div>
      )
    }
    if (active === 'settings') return <SettingsForm title="App settings" initial={{ note: 'Operational settings are managed in app_settings.', updated_at: new Date().toISOString() }} onSave={() => setToast('Saved')} />
    if (active === 'analytics') {
      const riderAvg = ratings.length ? (ratings.reduce((s, r) => s + Number(r.rider_score || 0), 0) / ratings.length).toFixed(2) : '0.00'
      const appAvg = ratings.length ? (ratings.reduce((s, r) => s + Number(r.app_score || 0), 0) / ratings.length).toFixed(2) : '0.00'
      return (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat l="Total ratings" v={ratings.length} />
            <Stat l="Rider avg" v={riderAvg} />
            <Stat l="App avg" v={appAvg} />
          </div>
          <AdminTable
            columns={[
              { key: 'order', label: 'Order', render: (r) => r.orders?.tracking_code || r.order_id },
              { key: 'route', label: 'Route', render: (r) => (r.orders ? `${r.orders.pickup_address_text} -> ${r.orders.dropoff_address_text}` : '--') },
              { key: 'rider', label: 'Rider', render: (r) => r.riders?.display_name || '--' },
              { key: 'scores', label: 'Scores', render: (r) => `Rider ${r.rider_score}/5 | App ${r.app_score}/5` },
              { key: 'feedback', label: 'Feedback', render: (r) => [r.rider_feedback, r.app_feedback].filter(Boolean).join(' | ') || '--' },
              { key: 'created_at', label: 'Time', render: (r) => new Date(r.created_at).toLocaleString() }
            ]}
            rows={ratings}
          />
        </div>
      )
    }
    if (active === 'customers') return <AdminTable columns={[{ key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'role', label: 'Role' }, { key: 'is_active', label: 'Active' }]} rows={customers} />
    if (active === 'support') {
      return (
        <AdminTable
          columns={[
            { key: 'tracking', label: 'Order', render: (t) => t.order?.tracking_code || t.id },
            { key: 'route', label: 'Route', render: (t) => (t.order ? `${t.order.pickup_address_text} -> ${t.order.dropoff_address_text}` : '--') },
            { key: 'count', label: 'Messages', render: (t) => t.count },
            { key: 'last_text', label: 'Latest', render: (t) => t.last_text || '--' },
            { key: 'last_at', label: 'Updated', render: (t) => (t.last_at ? new Date(t.last_at).toLocaleString() : '--') }
          ]}
          rows={supportThreads}
        />
      )
    }
    if (active === 'notifications') return <AdminTable columns={[{ key: 'title', label: 'Title' }, { key: 'body', label: 'Body' }, { key: 'created_at', label: 'Time', render: (n) => new Date(n.created_at).toLocaleString() }]} rows={notifications} />
    if (active === 'logs') return <AdminTable columns={[{ key: 'action', label: 'Action' }, { key: 'entity_type', label: 'Entity' }, { key: 'entity_id', label: 'Entity ID' }, { key: 'created_at', label: 'Time', render: (n) => new Date(n.created_at).toLocaleString() }]} rows={logs} />
    return null
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <AdminSidebar active={active} setActive={setActive} />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Admin Control Center</h1>
          <p className="text-sm text-slate-300">{user?.email}</p>
        </div>
        {renderPane()}
      </section>
      <Toast message={toast} />
    </div>
  )
}

const Stat = ({ l, v }) => (
  <div className="card p-4">
    <p className="text-sm text-slate-300">{l}</p>
    <p className="text-2xl font-extrabold">{v}</p>
  </div>
)

