export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'rider_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled'
]

export const statusLabel = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export const statusColor = {
  pending: 'bg-slate-700',
  confirmed: 'bg-sky-700',
  rider_assigned: 'bg-indigo-700',
  picked_up: 'bg-cyan-700',
  in_transit: 'bg-amber-700 text-black',
  delivered: 'bg-emerald-600 text-emerald-950',
  cancelled: 'bg-rose-700'
}
