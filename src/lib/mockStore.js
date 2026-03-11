const now = () => new Date().toISOString()

export const mockStore = {
  homepage: {
    id: 'home-1',
    hero_title: 'Move faster. Spend less. Keep Nairobi cleaner.',
    hero_subtitle: 'Electric-first delivery that saves time, money, and emissions.',
    hero_cta_text: 'Request Delivery',
    services_section_title: 'Services',
    support_phone: '+254700111222',
    support_email: 'support@efikishe.com',
    updated_at: now()
  },
  services: [
    { id: 'svc-parcel', name: 'Parcel Delivery', slug: 'parcel', description: 'Reliable electric parcel movement across Nairobi.', icon: 'package', active: true, sort_order: 1 },
    { id: 'svc-food', name: 'Food / Merchant Delivery', slug: 'food', description: 'Fast merchant and food delivery with electric bikes.', icon: 'utensils', active: true, sort_order: 2 },
    { id: 'svc-scheduled', name: 'Scheduled Delivery', slug: 'scheduled', description: 'Predictable scheduled dispatch for teams and offices.', icon: 'calendar', active: true, sort_order: 3 },
    { id: 'svc-express', name: 'Express / Same-Day Delivery', slug: 'express', description: 'Priority same-day movement for urgent items.', icon: 'zap', active: true, sort_order: 4 },
    { id: 'svc-bulk', name: 'Bulk / Multi-stop Delivery', slug: 'bulk', description: 'Efficient multi-stop routes for business operations.', icon: 'boxes', active: true, sort_order: 5 }
  ],
  vehicleTypes: [
    { id: 'veh-ebike', name: 'E-Bike', slug: 'e-bike', description: 'Normal electric bike', max_weight_kg: 20, active: true },
    { id: 'veh-cargo', name: 'Cargo E-Bike', slug: 'cargo-e-bike', description: 'Bike with parcel box', max_weight_kg: 45, active: true },
    { id: 'veh-van', name: 'Electric Van', slug: 'electric-van', description: 'Large electric cargo vehicle', max_weight_kg: 250, active: true }
  ],
  pricingConfigs: [
    { id: 'pc-1', service_id: 'svc-parcel', vehicle_type_id: 'veh-ebike', base_fare: 250, per_km_rate: 58, per_minute_rate: 2, urgency_rules_json: { standard: 0, priority: 90, express: 180 }, weight_rules_json: { small: 0, medium: 70, large: 160 }, zone_rules_json: { default: 0 }, active: true },
    { id: 'pc-2', service_id: 'svc-parcel', vehicle_type_id: 'veh-cargo', base_fare: 330, per_km_rate: 68, per_minute_rate: 2, urgency_rules_json: { standard: 0, priority: 90, express: 180 }, weight_rules_json: { small: 0, medium: 70, large: 160 }, zone_rules_json: { default: 0 }, active: true },
    { id: 'pc-3', service_id: 'svc-parcel', vehicle_type_id: 'veh-van', base_fare: 420, per_km_rate: 85, per_minute_rate: 2, urgency_rules_json: { standard: 0, priority: 90, express: 180 }, weight_rules_json: { small: 0, medium: 70, large: 160 }, zone_rules_json: { default: 0 }, active: true }
  ],
  zones: [
    {
      id: 'zone-cbd',
      name: 'CBD Zone',
      polygon_json: { type: 'Polygon', coordinates: [[[36.8, -1.28], [36.84, -1.28], [36.84, -1.31], [36.8, -1.31], [36.8, -1.28]]] },
      surcharge: 80,
      active: true
    }
  ],
  profiles: [
    { id: 'customer-main', full_name: 'Amina Njoroge', email: 'customer@efikishe.com', phone: '+254700000001', role: 'customer', is_active: true },
    { id: 'admin-main', full_name: 'Efikishe Operations', email: 'admin@efikishe.com', phone: '+254700000002', role: 'admin', is_active: true },
    { id: 'rider-profile', full_name: 'David Mwangi', email: 'rider@efikishe.com', phone: '+254700000003', role: 'rider', is_active: true }
  ],
  riders: [
    { id: 'rider-main', profile_id: 'rider-profile', display_name: 'David Mwangi', phone: '+254700000003', status: 'available', current_zone_id: 'zone-cbd', is_available: true }
  ],
  bikes: [
    { id: 'bike-1', rider_id: 'rider-main', bike_code: 'EFK-EB01', vehicle_type_id: 'veh-ebike', identifier: 'EB-01', battery_level: 87, status: 'available', current_latitude: -1.286, current_longitude: 36.817, last_seen_at: now() }
  ],
  addresses: [],
  orders: [
    {
      id: 'ord-sample-1',
      tracking_code: 'EFK240901',
      customer_id: 'customer-main',
      service_id: 'svc-parcel',
      vehicle_type_id: 'veh-ebike',
      rider_id: 'rider-main',
      bike_id: 'bike-1',
      status: 'in_transit',
      pickup_address_text: 'Westlands, Nairobi',
      pickup_latitude: -1.2676,
      pickup_longitude: 36.8108,
      dropoff_address_text: 'Kilimani, Nairobi',
      dropoff_latitude: -1.2921,
      dropoff_longitude: 36.7838,
      package_type: 'Parcel',
      package_weight_category: 'small',
      urgency: 'priority',
      scheduled_for: null,
      distance_km: 7.8,
      estimated_duration_minutes: 29,
      estimated_price: 980,
      final_price: 980,
      sender_name: 'Amina Njoroge',
      sender_phone: '+254700000001',
      recipient_name: 'Brian Otieno',
      recipient_phone: '+254700000004',
      notes: 'Handle with care',
      payment_status: 'pending',
      payment_reference: null,
      created_at: now(),
      updated_at: now()
    }
  ],
  orderStatusHistory: [
    { id: 'hist-1', order_id: 'ord-sample-1', status: 'pending', note: 'Order created', changed_by: 'customer-main', created_at: now() },
    { id: 'hist-2', order_id: 'ord-sample-1', status: 'confirmed', note: 'Order confirmed', changed_by: 'admin-main', created_at: now() },
    { id: 'hist-3', order_id: 'ord-sample-1', status: 'rider_assigned', note: 'Rider assigned', changed_by: 'admin-main', created_at: now() },
    { id: 'hist-4', order_id: 'ord-sample-1', status: 'in_transit', note: 'Rider in transit', changed_by: 'rider-profile', created_at: now() }
  ],
  riderLocations: [
    { id: 'loc-1', rider_id: 'rider-main', bike_id: 'bike-1', latitude: -1.279, longitude: 36.801, speed: 27, heading: 120, recorded_at: now() }
  ],
  orderMessages: [
    {
      id: 'msg-1',
      order_id: 'ord-sample-1',
      sender_id: 'customer-main',
      sender_role: 'customer',
      message_text: 'Hi rider, please call on arrival.',
      created_at: now()
    }
  ],
  orderRatings: [
    {
      id: 'rate-1',
      order_id: 'ord-sample-1',
      customer_id: 'customer-main',
      rider_id: 'rider-main',
      rider_score: 5,
      app_score: 5,
      rider_feedback: 'Fast and careful delivery.',
      app_feedback: 'Smooth booking and tracking.',
      created_at: now(),
      updated_at: now()
    }
  ],
  notifications: [{ id: 'ntf-1', user_id: 'admin-main', title: 'Operations ready', body: 'Operations center is live and dispatch-ready', type: 'info', is_read: false, created_at: now() }],
  appSettings: [
    { id: 'set-1', key: 'company', value_json: { name: 'Efikishe' }, updated_at: now() },
    { id: 'set-2', key: 'support', value_json: { phone: '+254700111222', email: 'support@efikishe.com' }, updated_at: now() },
    { id: 'set-3', key: 'public_pages', value_json: {}, updated_at: now() }
  ],
  adminAuditLogs: []
}

export const mockId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

