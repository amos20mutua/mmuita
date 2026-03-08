import { useEffect, useMemo, useState } from 'react'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminTable from '../components/admin/AdminTable'
import AddRiderForm from '../components/admin/AddRiderForm'
import SettingsForm from '../components/admin/SettingsForm'
import MapView from '../components/MapView'
import Toast from '../components/common/Toast'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { createSimulation } from '../services/simulator'

export default function AdminPage() {
  const { user } = useAuth()
  const [active, setActive] = useState('overview')
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState('')

  const load = async () => {
    const [o, r, s, c, n] = await Promise.all([api.adminOrders(), api.riders(), api.services(), api.customers(), api.notifications()])
    setOrders(o.data || [])
    setRiders(r.data || [])
    setServices(s.data || [])
    setCustomers(c.data || [])
    setNotifications(n.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const overview = useMemo(() => {
    const today = new Date().toDateString()
    const completeToday = orders.filter((o) => o.status === 'delivered' && new Date(o.updated_at).toDateString() === today).length
    return {
      total: orders.length,
      active: orders.filter((o) => ['confirmed', 'rider_assigned', 'picked_up', 'in_transit'].includes(o.status)).length,
      completeToday,
      revenue: orders.reduce((s, o) => s + Number(o.final_price || 0), 0),
      ridersOnline: riders.filter((r) => r.bikes?.some((b) => b.status !== 'offline')).length,
      fleet: riders.flatMap((r) => r.bikes || []).length
    }
  }, [orders, riders])

  const addRider = async (payload) => {
    const { error } = await api.promoteRiderByEmail(payload.email, payload)
    setToast(error ? error.message : 'Rider enabled. User must already exist in Auth.')
    load()
  }

  const runSim = async () => {
    const order = orders.find((o) => o.status !== 'delivered' && o.rider_id)
    const rider = riders.find((r) => r.id === order?.rider_id)
    const bike = rider?.bikes?.[0]
    if (!order || !bike) return setToast('Need one active order with assigned rider/bike.')
    createSimulation({ order, bike, riderId: rider.id, onTick: () => load() })
    setToast('Simulation started.')
  }

  const renderPane = () => {
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
        <AdminTable
          columns={[
            { key: 'tracking_code', label: 'Tracking' },
            { key: 'status', label: 'Status' },
            { key: 'estimated_price', label: 'Est. Price' },
            { key: 'final_price', label: 'Final' },
            { key: 'created_at', label: 'Created', render: (r) => new Date(r.created_at).toLocaleString() }
          ]}
          rows={orders}
        />
      )
    }

    if (active === 'riders') {
      return (
        <div className="space-y-3">
          <AddRiderForm onCreate={addRider} />
          <AdminTable
            columns={[
              { key: 'full_name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'status', label: 'Bike Status', render: (r) => r.bikes?.[0]?.status || 'offline' }
            ]}
            rows={riders}
          />
        </div>
      )
    }

    if (active === 'live_map') {
      const order = orders.find((o) => o.status !== 'delivered')
      const pickup = order ? { lat: order.pickup_latitude, lng: order.pickup_longitude } : null
      const dropoff = order ? { lat: order.dropoff_latitude, lng: order.dropoff_longitude } : null
      const rider = riders.find((r) => r.id === order?.rider_id)
      const riderPos = rider?.bikes?.[0]
        ? { lat: rider.bikes[0].current_latitude, lng: rider.bikes[0].current_longitude }
        : null

      return (
        <div className="space-y-3">
          <button className="btn-primary" onClick={runSim}>Run Rider Simulation</button>
          <MapView pickup={pickup} dropoff={dropoff} rider={riderPos} />
        </div>
      )
    }

    if (['services', 'zones', 'pricing', 'content', 'theme', 'analytics', 'profile'].includes(active)) {
      return <SettingsForm title={`${active} config`} initial={{ note: 'Admin editable config payload' }} onSave={() => setToast('Saved')} />
    }

    if (active === 'customers') {
      return <AdminTable columns={[{ key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }]} rows={customers} />
    }

    if (active === 'notifications') {
      return <AdminTable columns={[{ key: 'title', label: 'Title' }, { key: 'body', label: 'Body' }, { key: 'created_at', label: 'Time', render: (n) => new Date(n.created_at).toLocaleString() }]} rows={notifications} />
    }

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
