import { mockId, mockStore } from '../lib/mockStore'
import { isSupabaseEnabled, supabase } from '../lib/supabase'

const ok = (data) => Promise.resolve({ data, error: null })

const includeOrderMeta = (o) => {
  if (!o) return null
  const service = mockStore.services.find((s) => s.id === o.service_id)
  const bike = mockStore.bikes.find((b) => b.id === o.bike_id)
  const rider = mockStore.profiles.find((p) => p.id === o.rider_id)
  return { ...o, services: service ? { name: service.name } : null, bikes: bike || null, profiles: rider ? { full_name: rider.full_name } : null }
}

export const api = isSupabaseEnabled
  ? {
      services: () => supabase.from('services').select('*').eq('active', true).order('name'),
      zones: () => supabase.from('zones').select('*').eq('active', true),
      pricingRules: (serviceId) =>
        supabase.from('pricing_rules').select('*').eq('service_id', serviceId).eq('active', true),
      settings: (key) => supabase.from('app_settings').select('*').eq('key', key).maybeSingle(),
      homepage: () => supabase.from('homepage_content').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      createOrder: (payload) => supabase.from('orders').insert(payload).select('*').single(),
      myOrders: (customerId) =>
        supabase
          .from('orders')
          .select('*, services(name), bikes(bike_code), profiles!orders_rider_id_fkey(full_name)')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
      oneOrderByTracking: (trackingCode) =>
        supabase
          .from('orders')
          .select('*, services(name), bikes(*), profiles!orders_rider_id_fkey(full_name)')
          .eq('tracking_code', trackingCode)
          .maybeSingle(),
      orderHistory: (orderId) => supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at'),
      adminOrders: () => supabase.from('orders').select('*').order('created_at', { ascending: false }),
      riders: () =>
        supabase
          .from('profiles')
          .select('*, bikes(*)')
          .eq('role', 'rider')
          .order('created_at', { ascending: false }),
      promoteRiderByEmail: (email, payload) =>
        supabase.from('profiles').update({ ...payload, role: 'rider' }).eq('email', email).select('*').maybeSingle(),
      updateOrder: (id, payload) => supabase.from('orders').update(payload).eq('id', id),
      addStatusHistory: (payload) => supabase.from('order_status_history').insert(payload),
      addRiderLocation: (payload) => supabase.from('rider_locations').insert(payload),
      updateBike: (id, payload) => supabase.from('bikes').update(payload).eq('id', id),
      customers: () => supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
      notifications: () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      uploadAvatar: (userId, file) => supabase.storage.from('avatars').upload(`${userId}/${Date.now()}-${file.name}`, file)
    }
  : {
      services: () => ok(mockStore.services.filter((s) => s.active)),
      zones: () => ok(mockStore.zones.filter((z) => z.active)),
      pricingRules: (serviceId) => ok(mockStore.pricingRules.filter((r) => r.service_id === serviceId && r.active)),
      settings: (key) => ok({ key, value_json: {} }),
      homepage: () => ok(mockStore.homepage),
      createOrder: (payload) => {
        const rider = mockStore.profiles.find((p) => p.role === 'rider')
        const bike = mockStore.bikes.find((b) => b.rider_id === rider?.id)
        const row = {
          id: mockId('ord'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rider_id: rider?.id || null,
          bike_id: bike?.id || null,
          ...payload
        }
        mockStore.orders.unshift(row)
        return ok(row)
      },
      myOrders: (customerId) => ok(mockStore.orders.filter((o) => o.customer_id === customerId).map(includeOrderMeta)),
      oneOrderByTracking: (trackingCode) => ok(includeOrderMeta(mockStore.orders.find((o) => o.tracking_code === trackingCode) || null)),
      orderHistory: (orderId) => ok(mockStore.orderStatusHistory.filter((h) => h.order_id === orderId)),
      adminOrders: () => ok(mockStore.orders),
      riders: () =>
        ok(
          mockStore.profiles
            .filter((p) => p.role === 'rider')
            .map((p) => ({ ...p, bikes: mockStore.bikes.filter((b) => b.rider_id === p.id) }))
        ),
      promoteRiderByEmail: (email, payload) => {
        const p = mockStore.profiles.find((x) => x.email === email)
        if (!p) return Promise.resolve({ data: null, error: { message: 'No user with that email in the local preview account list.' } })
        p.role = 'rider'
        p.full_name = payload.full_name || p.full_name
        p.phone = payload.phone || p.phone
        return ok(p)
      },
      updateOrder: (id, payload) => {
        const o = mockStore.orders.find((x) => x.id === id)
        if (o) Object.assign(o, payload, { updated_at: new Date().toISOString() })
        return ok(o)
      },
      addStatusHistory: (payload) => {
        const row = { id: mockId('hist'), created_at: new Date().toISOString(), ...payload }
        mockStore.orderStatusHistory.push(row)
        return ok(row)
      },
      addRiderLocation: (payload) => {
        const row = { id: mockId('loc'), recorded_at: new Date().toISOString(), ...payload }
        mockStore.riderLocations.push(row)
        return ok(row)
      },
      updateBike: (id, payload) => {
        const b = mockStore.bikes.find((x) => x.id === id)
        if (b) Object.assign(b, payload)
        return ok(b)
      },
      customers: () => ok(mockStore.profiles.filter((p) => p.role === 'customer')),
      notifications: () => ok(mockStore.notifications),
      uploadAvatar: () => Promise.resolve({ data: null, error: { message: 'Storage becomes available once backend is connected.' } })
    }
