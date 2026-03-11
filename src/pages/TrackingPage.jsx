import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import LiveTrackingPanel from '../components/LiveTrackingPanel'
import LazyMapView from '../components/LazyMapView'
import StatusTimeline from '../components/StatusTimeline'
import OrderChatPanel from '../components/OrderChatPanel'
import EmptyState from '../components/common/EmptyState'
import LoadingCard from '../components/common/LoadingCard'
import Toast from '../components/common/Toast'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

const qKey = (orderId, userId) => `efk-msg-queue-${orderId}-${userId}`

const readQueue = (orderId, userId) => {
  try {
    return JSON.parse(localStorage.getItem(qKey(orderId, userId)) || '[]')
  } catch {
    return []
  }
}

const writeQueue = (orderId, userId, queue) => localStorage.setItem(qKey(orderId, userId), JSON.stringify(queue))

export default function TrackingPage() {
  const { user, profile } = useAuth()
  const { trackingCode } = useParams()
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [rider, setRider] = useState(null)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const [trackInfo, setTrackInfo] = useState(null)

  useEffect(() => {
    api.publicPages?.().then(({ data }) => setTrackInfo(data?.track || null))
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.oneOrderByTracking(trackingCode)
      setOrder(data || null)
      if (data?.id) {
        const [{ data: hist }, { data: msgs }] = await Promise.all([api.orderHistory(data.id), api.orderMessages(data.id)])
        setHistory(hist || [])
        setMessages(msgs || [])
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
          const [{ data: hist }, { data: msgs }] = await Promise.all([api.orderHistory(data.id), api.orderMessages(data.id)])
          setHistory(hist || [])
          setMessages(msgs || [])
        }
      }, 1800)
      return () => clearInterval(timer)
    }

    const channel = supabase
      .channel(`track-${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (p) =>
        setOrder((s) => ({ ...(s || {}), ...p.new }))
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${order.id}` }, (p) =>
        setHistory((s) => [...s, p.new])
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${order.id}` }, (p) =>
        setMessages((s) => {
          if (p.new.sender_id !== user?.id) {
            setToast('New message received.')
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Efikishe chat', { body: p.new.message_text })
            }
          }
          return [...s, p.new]
        })
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rider_locations' }, (p) => {
        if (p.new.rider_id === order.rider_id) setRider({ lat: p.new.latitude, lng: p.new.longitude })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [order?.id, order?.rider_id, trackingCode, user?.id])

  const pickup = useMemo(
    () => (order ? { lat: Number(order.pickup_latitude), lng: Number(order.pickup_longitude) } : null),
    [order]
  )
  const dropoff = useMemo(
    () => (order ? { lat: Number(order.dropoff_latitude), lng: Number(order.dropoff_longitude) } : null),
    [order]
  )

  useEffect(() => {
    if (!order?.id || !user?.id || !profile?.role) return
    const flush = async () => {
      const queue = readQueue(order.id, user.id)
      if (!queue.length) return
      const pending = [...queue]
      const nextQueue = []
      for (const m of pending) {
        const { error } = await api.sendOrderMessage({
          order_id: order.id,
          sender_id: user.id,
          sender_role: profile.role,
          message_text: m
        })
        if (error) nextQueue.push(m)
      }
      writeQueue(order.id, user.id, nextQueue)
      if (queue.length && !nextQueue.length) setToast('Queued messages sent.')
    }

    const onOnline = () => flush()
    window.addEventListener('online', onOnline)
    flush()
    return () => window.removeEventListener('online', onOnline)
  }, [order?.id, user?.id, profile?.role])

  if (!ready) return <LoadingCard text="Locating delivery..." />
  if (!order) return <EmptyState title="Tracking code not found" subtitle="Check and try again." />

  const canChat = Boolean(user?.id && ['admin', 'customer', 'rider'].includes(profile?.role))
  const sendMessage = async (messageText) => {
    if (!canChat || !order?.id) return false
    const { error } = await api.sendOrderMessage({
      order_id: order.id,
      sender_id: user.id,
      sender_role: profile.role,
      message_text: messageText
    })
    if (!error) return true

    const queue = readQueue(order.id, user.id)
    writeQueue(order.id, user.id, [...queue, messageText])
    setToast('Message queued. Will send when connection is stable.')
    return true
  }

  return (
    <div className="space-y-4">
      {trackInfo && (
        <section className="card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-brand">{trackInfo.title}</p>
          <p className="mt-1 text-sm text-slate-200">{trackInfo.intro}</p>
        </section>
      )}
      <LiveTrackingPanel order={order} />
      <LazyMapView pickup={pickup} dropoff={dropoff} rider={rider} />
      <StatusTimeline current={order.status} history={history} />
      <OrderChatPanel order={order} user={user} messages={messages} onSend={sendMessage} disabled={!canChat} />
      <Toast message={toast} />
    </div>
  )
}

