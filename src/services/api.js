import { mockId, mockStore } from '../lib/mockStore'
import { isSupabaseEnabled, supabase } from '../lib/supabase'
import { defaultPublicPages, mergePublicPages } from '../utils/publicPages'

const ok = (data) => Promise.resolve({ data, error: null })

const includeOrderMeta = (o) => {
  if (!o) return null
  const service = mockStore.services.find((s) => s.id === o.service_id)
  const bike = mockStore.bikes.find((b) => b.id === o.bike_id)
  const rider = (mockStore.riders || []).find((r) => r.id === o.rider_id)
  return {
    ...o,
    services: service ? { name: service.name } : null,
    bikes: bike || null,
    riders: rider || null,
    profiles: rider ? { full_name: rider.display_name } : null
  }
}

export const api = isSupabaseEnabled
  ? {
      services: () => supabase.from('services').select('*').eq('active', true).order('name'),
      vehicleTypes: () => supabase.from('vehicle_types').select('*').eq('active', true).order('name'),
      zones: () => supabase.from('zones').select('*').eq('active', true),
      pricingRules: (serviceId, vehicleTypeId) => {
        let q = supabase.from('pricing_configs').select('*').eq('active', true)
        if (serviceId) q = q.eq('service_id', serviceId)
        if (vehicleTypeId) q = q.eq('vehicle_type_id', vehicleTypeId)
        return q
      },
      settings: (key) => supabase.from('app_settings').select('*').eq('key', key).maybeSingle(),
      publicPages: async () => {
        const r = await supabase.from('app_settings').select('*').eq('key', 'public_pages').maybeSingle()
        return { ...r, data: mergePublicPages(r.data?.value_json) }
      },
      savePublicPages: (payload) =>
        supabase
          .from('app_settings')
          .upsert({ key: 'public_pages', value_json: payload }, { onConflict: 'key' })
          .select('*')
          .single(),
      homepage: () => supabase.from('homepage_content').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      createOrder: (payload) => supabase.from('orders').insert(payload).select('*').single(),
      myOrders: (customerId) =>
        supabase
          .from('orders')
          .select('*, services(name), bikes(*), riders(display_name)')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
      oneOrderByTracking: (trackingCode) =>
        supabase
          .from('orders')
          .select('*, services(name), bikes(*), riders(display_name,phone,profile_id)')
          .eq('tracking_code', trackingCode)
          .maybeSingle(),
      riderByProfile: (profileId) =>
        supabase
          .from('riders')
          .select('*, bikes(*)')
          .eq('profile_id', profileId)
          .maybeSingle(),
      riderOpenOrders: () =>
        supabase
          .from('orders')
          .select('*')
          .in('status', ['pending', 'confirmed'])
          .is('rider_id', null)
          .order('created_at', { ascending: true }),
      riderAssignedOrders: (riderId) =>
        !riderId
          ? Promise.resolve({ data: [], error: null })
          : supabase
              .from('orders')
              .select('*')
              .eq('rider_id', riderId)
              .in('status', ['rider_assigned', 'picked_up', 'in_transit'])
              .order('updated_at', { ascending: false }),
      acceptOrder: async ({ orderId, riderId, bikeId, changedBy }) => {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ rider_id: riderId, bike_id: bikeId, status: 'rider_assigned' })
          .eq('id', orderId)
          .is('rider_id', null)
        if (updateError) return { data: null, error: updateError }
        return supabase.from('order_status_history').insert({
          order_id: orderId,
          status: 'rider_assigned',
          note: 'Accepted by rider',
          changed_by: changedBy
        })
      },
      orderHistory: (orderId) => supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at'),
      orderMessages: (orderId) => supabase.from('order_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
      adminMessages: (limit = 500) => supabase.from('order_messages').select('*').order('created_at', { ascending: false }).limit(limit),
      sendOrderMessage: (payload) => supabase.from('order_messages').insert(payload),
      profileById: (id) => supabase.from('profiles').select('id,full_name,email,phone,role').eq('id', id).maybeSingle(),
      adminOrders: (limit = 250) => supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit),
      riders: () =>
        supabase
          .from('riders')
          .select('*, profiles(full_name,email,phone), bikes(*)')
          .order('created_at', { ascending: false }),
      promoteRiderByEmail: async (email, payload) => {
        const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
        if (!profile) return { data: null, error: { message: 'Profile not found for this email.' } }
        await supabase.from('profiles').update({ role: 'rider', is_active: true }).eq('id', profile.id)
        return supabase
          .from('riders')
          .upsert({ profile_id: profile.id, display_name: payload.full_name || profile.full_name || email, phone: payload.phone || profile.phone })
          .select('*')
          .maybeSingle()
      },
      updateOrder: (id, payload) => supabase.from('orders').update(payload).eq('id', id),
      addStatusHistory: (payload) => supabase.from('order_status_history').insert(payload),
      addRiderLocation: (payload) => supabase.from('rider_locations').insert(payload),
      updateBike: (id, payload) => supabase.from('bikes').update(payload).eq('id', id),
      bikes: () => supabase.from('bikes').select('*, vehicle_types(name), riders(display_name)').order('created_at', { ascending: false }),
      pricingAdmin: () => supabase.from('pricing_configs').select('*, services(name), vehicle_types(name)').order('created_at', { ascending: false }),
      savePricing: (payload) => supabase.from('pricing_configs').upsert(payload).select('*').single(),
      servicesAdmin: () => supabase.from('services').select('*').order('sort_order'),
      saveService: (payload) => supabase.from('services').upsert(payload).select('*').single(),
      vehicleTypesAdmin: () => supabase.from('vehicle_types').select('*').order('name'),
      saveVehicleType: (payload) => supabase.from('vehicle_types').upsert(payload).select('*').single(),
      zonesAdmin: () => supabase.from('zones').select('*').order('name'),
      saveZone: (payload) => supabase.from('zones').upsert(payload).select('*').single(),
      auditLogs: () => supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(150),
      logAdminAction: (payload) => supabase.from('admin_audit_logs').insert(payload),
      addresses: (userId) => supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      createAddress: (payload) => supabase.from('addresses').insert(payload),
      customers: () => supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
      notifications: () => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      allRatings: () =>
        supabase
          .from('order_ratings')
          .select('*, orders(tracking_code,pickup_address_text,dropoff_address_text), riders(display_name)')
          .order('created_at', { ascending: false })
          .limit(300),
      myRatings: (customerId) => supabase.from('order_ratings').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      submitOrderRating: (payload) => supabase.from('order_ratings').upsert(payload, { onConflict: 'order_id' }).select('*').single(),
      ratingSummary: () => supabase.rpc('get_rating_summary'),
      uploadAvatar: (userId, file) => supabase.storage.from('avatars').upload(`${userId}/${Date.now()}-${file.name}`, file)
      ,
      verifyAdminCredentials: async (username, password) => {
        const { data, error } = await supabase.rpc('verify_admin_credentials', {
          p_username: username,
          p_password: password
        })
        return { data: { ok: Boolean(data) }, error }
      }
    }
  : {
      services: () => ok(mockStore.services.filter((s) => s.active)),
      vehicleTypes: () => ok((mockStore.vehicleTypes || []).filter((v) => v.active)),
      zones: () => ok(mockStore.zones.filter((z) => z.active)),
      pricingRules: (serviceId, vehicleTypeId) =>
        ok(
          (mockStore.pricingConfigs || []).filter(
            (r) => (!serviceId || r.service_id === serviceId) && (!vehicleTypeId || r.vehicle_type_id === vehicleTypeId) && r.active
          )
        ),
      settings: (key) => ok({ key, value_json: {} }),
      publicPages: () => ok(mergePublicPages(mockStore.appSettings.find((s) => s.key === 'public_pages')?.value_json || defaultPublicPages)),
      savePublicPages: (payload) => {
        const list = (mockStore.appSettings ||= [])
        const idx = list.findIndex((x) => x.key === 'public_pages')
        const row = { id: idx >= 0 ? list[idx].id : mockId('set'), key: 'public_pages', value_json: payload, updated_at: new Date().toISOString() }
        if (idx >= 0) list[idx] = row
        else list.push(row)
        return ok(row)
      },
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
      orderMessages: (orderId) => ok((mockStore.orderMessages || []).filter((m) => m.order_id === orderId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))),
      adminMessages: () => ok((mockStore.orderMessages || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))),
      sendOrderMessage: (payload) => {
        const row = { id: mockId('msg'), created_at: new Date().toISOString(), ...payload }
        ;(mockStore.orderMessages ||= []).push(row)
        return ok(row)
      },
      profileById: (id) => ok(mockStore.profiles.find((p) => p.id === id) || null),
      riderByProfile: (profileId) => {
        const rider = (mockStore.riders || []).find((r) => r.profile_id === profileId)
        if (!rider) return ok(null)
        return ok({ ...rider, bikes: mockStore.bikes.filter((b) => b.rider_id === rider.id) })
      },
      riderOpenOrders: () => ok(mockStore.orders.filter((o) => ['pending', 'confirmed'].includes(o.status) && !o.rider_id)),
      riderAssignedOrders: (riderId) =>
        ok(mockStore.orders.filter((o) => o.rider_id === riderId && ['rider_assigned', 'picked_up', 'in_transit'].includes(o.status))),
      acceptOrder: ({ orderId, riderId, bikeId, changedBy }) => {
        const order = mockStore.orders.find((o) => o.id === orderId)
        if (!order || order.rider_id) return Promise.resolve({ data: null, error: { message: 'Order already assigned.' } })
        order.rider_id = riderId
        order.bike_id = bikeId
        order.status = 'rider_assigned'
        order.updated_at = new Date().toISOString()
        const hist = {
          id: mockId('hist'),
          order_id: orderId,
          status: 'rider_assigned',
          note: 'Accepted by rider',
          changed_by: changedBy,
          created_at: new Date().toISOString()
        }
        mockStore.orderStatusHistory.push(hist)
        return ok(hist)
      },
      orderHistory: (orderId) => ok(mockStore.orderStatusHistory.filter((h) => h.order_id === orderId)),
      adminOrders: () => ok(mockStore.orders),
      riders: () =>
        ok(
          (mockStore.riders || []).map((r) => ({
            ...r,
            profiles: mockStore.profiles.find((p) => p.id === r.profile_id),
            bikes: mockStore.bikes.filter((b) => b.rider_id === r.id)
          }))
        ),
      promoteRiderByEmail: (email, payload) => {
        const p = mockStore.profiles.find((x) => x.email === email)
        if (!p) return Promise.resolve({ data: null, error: { message: 'No matching user found in local account data.' } })
        p.role = 'rider'
        p.is_active = true
        p.full_name = payload.full_name || p.full_name
        p.phone = payload.phone || p.phone
        let rider = mockStore.riders.find((r) => r.profile_id === p.id)
        if (!rider) {
          rider = { id: mockId('rider'), profile_id: p.id, display_name: p.full_name, phone: p.phone, status: 'offline', is_available: false }
          mockStore.riders.push(rider)
        }
        return ok(rider)
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
      bikes: () => ok(mockStore.bikes),
      pricingAdmin: () => ok(mockStore.pricingConfigs || []),
      savePricing: (payload) => {
        const idx = (mockStore.pricingConfigs || []).findIndex((p) => p.id === payload.id)
        if (idx >= 0) mockStore.pricingConfigs[idx] = { ...mockStore.pricingConfigs[idx], ...payload }
        else (mockStore.pricingConfigs ||= []).push({ id: mockId('pc'), ...payload })
        return ok(payload)
      },
      servicesAdmin: () => ok(mockStore.services),
      saveService: (payload) => {
        const idx = mockStore.services.findIndex((s) => s.id === payload.id || s.slug === payload.slug)
        if (idx >= 0) mockStore.services[idx] = { ...mockStore.services[idx], ...payload }
        else mockStore.services.push({ id: mockId('svc'), ...payload })
        return ok(payload)
      },
      vehicleTypesAdmin: () => ok(mockStore.vehicleTypes || []),
      saveVehicleType: (payload) => {
        const list = (mockStore.vehicleTypes ||= [])
        const idx = list.findIndex((v) => v.id === payload.id || v.slug === payload.slug)
        if (idx >= 0) list[idx] = { ...list[idx], ...payload }
        else list.push({ id: mockId('veh'), ...payload })
        return ok(payload)
      },
      zonesAdmin: () => ok(mockStore.zones),
      saveZone: (payload) => {
        const idx = mockStore.zones.findIndex((z) => z.id === payload.id || z.name === payload.name)
        if (idx >= 0) mockStore.zones[idx] = { ...mockStore.zones[idx], ...payload }
        else mockStore.zones.push({ id: mockId('zone'), ...payload })
        return ok(payload)
      },
      auditLogs: () => ok(mockStore.adminAuditLogs || []),
      logAdminAction: (payload) => {
        ;(mockStore.adminAuditLogs ||= []).unshift({ id: mockId('audit'), created_at: new Date().toISOString(), ...payload })
        return ok(payload)
      },
      addresses: (userId) => ok((mockStore.addresses || []).filter((a) => a.user_id === userId)),
      createAddress: (payload) => {
        const row = { id: mockId('addr'), created_at: new Date().toISOString(), ...payload }
        ;(mockStore.addresses ||= []).push(row)
        return ok(row)
      },
      customers: () => ok(mockStore.profiles.filter((p) => p.role !== 'admin')),
      notifications: () => ok(mockStore.notifications),
      allRatings: () =>
        ok(
          (mockStore.orderRatings || []).map((r) => ({
            ...r,
            orders: mockStore.orders.find((o) => o.id === r.order_id) || null,
            riders: mockStore.riders.find((x) => x.id === r.rider_id) || null
          }))
        ),
      myRatings: (customerId) => ok((mockStore.orderRatings || []).filter((r) => r.customer_id === customerId)),
      submitOrderRating: (payload) => {
        const list = (mockStore.orderRatings ||= [])
        const idx = list.findIndex((r) => r.order_id === payload.order_id)
        const row = { id: idx >= 0 ? list[idx].id : mockId('rate'), created_at: idx >= 0 ? list[idx].created_at : new Date().toISOString(), updated_at: new Date().toISOString(), ...payload }
        if (idx >= 0) list[idx] = { ...list[idx], ...row }
        else list.unshift(row)
        return ok(row)
      },
      ratingSummary: () => {
        const list = mockStore.orderRatings || []
        if (!list.length) return ok({ rider_avg: 4.9, app_avg: 4.9, total_reviews: 0 })
        const rider_avg = list.reduce((a, r) => a + Number(r.rider_score || 0), 0) / list.length
        const app_avg = list.reduce((a, r) => a + Number(r.app_score || 0), 0) / list.length
        return ok({ rider_avg, app_avg, total_reviews: list.length })
      },
      uploadAvatar: () => Promise.resolve({ data: null, error: { message: 'Storage becomes available once backend is connected.' } }),
      verifyAdminCredentials: (username, password) => ok({ ok: username === 'admin' && password === 'admin123' })
    }

