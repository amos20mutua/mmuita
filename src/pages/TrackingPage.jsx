import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import LiveTrackingPanel from '../components/LiveTrackingPanel'
import MapView from '../components/MapView'
import StatusTimeline from '../components/StatusTimeline'
import EmptyState from '../components/common/EmptyState'
import LoadingCard from '../components/common/LoadingCard'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { api } from '../services/api'

export default function TrackingPage() {
  const { trackingCode } = useParams()
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [rider, setRider] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.oneOrderByTracking(trackingCode)
      setOrder(data || null)
      if (data?.id) {
        const { data: hist } = await api.orderHistory(data.id)
        setHistory(hist || [])
        if (!isSupabaseEnabled && data.bikes?.current_latitude) {
          setRider({ lat: Number(data.bikes.current_latitude), lng: Number(data.bikes.current_longitude) })
        }
      }
      setReady(true)
    })()
  }, [trackingCode])

  useEffect(() => {
    if (!order?.id) return

    if (!isSupabaseEnabled) {
      const timer = setInterval(async () => {
        const { data } = await api.oneOrderByTracking(trackingCode)
        if (data) {
          setOrder(data)
          if (data.bikes?.current_latitude) setRider({ lat: Number(data.bikes.current_latitude), lng: Number(data.bikes.current_longitude) })
          const { data: hist } = await api.orderHistory(data.id)
          setHistory(hist || [])
        }
      }, 1800)
      return () => clearInterval(timer)
    }

    const channel = supabase
      .channel(`track-${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (p) => setOrder(p.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${order.id}` }, (p) =>
        setHistory((s) => [...s, p.new])
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rider_locations' }, (p) => {
        if (p.new.rider_id === order.rider_id) setRider({ lat: p.new.latitude, lng: p.new.longitude })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [order?.id, order?.rider_id, trackingCode])

  const pickup = useMemo(
    () => (order ? { lat: Number(order.pickup_latitude), lng: Number(order.pickup_longitude) } : null),
    [order]
  )
  const dropoff = useMemo(
    () => (order ? { lat: Number(order.dropoff_latitude), lng: Number(order.dropoff_longitude) } : null),
    [order]
  )

  if (!ready) return <LoadingCard text="Locating delivery..." />
  if (!order) return <EmptyState title="Tracking code not found" subtitle="Check and try again." />

  return (
    <div className="space-y-4">
      <LiveTrackingPanel order={order} />
      <MapView pickup={pickup} dropoff={dropoff} rider={rider} />
      <StatusTimeline current={order.status} history={history} />
    </div>
  )
}
