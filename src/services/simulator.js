import { api } from './api'

const shift = (n, i) => n + i * 0.0007

export const createSimulation = ({ order, bike, riderId, onTick }) => {
  let step = 0
  const statuses = ['confirmed', 'rider_assigned', 'picked_up', 'in_transit', 'delivered']

  const timer = setInterval(async () => {
    step += 1
    const lat = shift(Number(order.pickup_latitude), step)
    const lng = shift(Number(order.pickup_longitude), step)
    await api.addRiderLocation({ rider_id: riderId, bike_id: bike.id, latitude: lat, longitude: lng, speed: 24, heading: 90 })
    await api.updateBike(bike.id, { current_latitude: lat, current_longitude: lng, last_seen_at: new Date().toISOString(), status: step > 4 ? 'available' : 'busy' })

    const status = statuses[Math.min(step - 1, statuses.length - 1)]
    await api.updateOrder(order.id, { status })
    await api.addStatusHistory({ order_id: order.id, status, note: 'Simulation tick', changed_by: riderId })
    onTick?.(status)

    if (status === 'delivered') clearInterval(timer)
  }, 7000)

  return () => clearInterval(timer)
}
