const now = () => new Date().toISOString()

export const mockStore = {
  homepage: {
    id: 'home-1',
    hero_title: 'Move anything. Quietly. Fast.',
    hero_subtitle: 'Premium electric delivery for Nairobi.',
    hero_cta_text: 'Request Delivery',
    services_section_title: 'Services',
    updated_at: now()
  },
  services: [
    {
      id: 'svc-parcel',
      name: 'Parcel Delivery',
      slug: 'parcel',
      description: 'Everyday parcel movement.',
      base_fare: 250,
      per_km_rate: 65,
      per_minute_rate: 2,
      weight_surcharge_rules: { light: 0, medium: 80, heavy: 180 },
      urgency_surcharge_rules: { standard: 0, priority: 100, express: 220 },
      active: true
    },
    {
      id: 'svc-food',
      name: 'Food / Merchant Delivery',
      slug: 'food',
      description: 'Fast merchant and meal dropoff.',
      base_fare: 220,
      per_km_rate: 55,
      per_minute_rate: 2,
      weight_surcharge_rules: { light: 0, medium: 40, heavy: 100 },
      urgency_surcharge_rules: { standard: 0, priority: 90, express: 180 },
      active: true
    },
    {
      id: 'svc-business',
      name: 'Scheduled Business Delivery',
      slug: 'business',
      description: 'Planned route support for teams.',
      base_fare: 300,
      per_km_rate: 60,
      per_minute_rate: 3,
      weight_surcharge_rules: { light: 0, medium: 70, heavy: 140 },
      urgency_surcharge_rules: { standard: 0, priority: 80, express: 150 },
      active: true
    },
    {
      id: 'svc-express',
      name: 'Express / Same-Day Delivery',
      slug: 'express',
      description: 'Critical same-day dispatch.',
      base_fare: 320,
      per_km_rate: 75,
      per_minute_rate: 3,
      weight_surcharge_rules: { light: 0, medium: 100, heavy: 220 },
      urgency_surcharge_rules: { standard: 0, priority: 120, express: 260 },
      active: true
    },
    {
      id: 'svc-bulk',
      name: 'Bulk / Multi-stop Delivery',
      slug: 'bulk',
      description: 'Batch movement for operations.',
      base_fare: 400,
      per_km_rate: 70,
      per_minute_rate: 3,
      weight_surcharge_rules: { light: 0, medium: 120, heavy: 260 },
      urgency_surcharge_rules: { standard: 0, priority: 100, express: 200 },
      active: true
    }
  ],
  pricingRules: [],
  zones: [
    {
      id: 'zone-cbd',
      name: 'CBD Zone',
      polygon_json: {
        type: 'Polygon',
        coordinates: [[[36.8, -1.28], [36.84, -1.28], [36.84, -1.31], [36.8, -1.31], [36.8, -1.28]]]
      },
      surcharge: 80,
      active: true
    }
  ],
  profiles: [
    { id: 'customer-main', full_name: 'Amina Njoroge', email: 'customer@efikishe.com', phone: '+254700000001', role: 'customer' },
    { id: 'admin-main', full_name: 'Efikishe Operations', email: 'admin@efikishe.com', phone: '+254700000002', role: 'admin' },
    { id: 'rider-main', full_name: 'David Mwangi', email: 'rider@efikishe.com', phone: '+254700000003', role: 'rider' }
  ],
  bikes: [
    { id: 'bike-1', rider_id: 'rider-main', bike_code: 'EFK-EB01', plate_or_identifier: 'EB-01', battery_level: 87, status: 'available', current_latitude: -1.286, current_longitude: 36.817, last_seen_at: now() }
  ],
  orders: [
    {
      id: 'ord-sample-1',
      tracking_code: 'EFK240901',
      customer_id: 'customer-main',
      service_id: 'svc-parcel',
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
      package_weight_category: 'light',
      urgency: 'priority',
      distance_km: 7.8,
      estimated_duration_minutes: 29,
      estimated_price: 980,
      final_price: 980,
      sender_name: 'Amina Njoroge',
      sender_phone: '+254700000001',
      recipient_name: 'Brian Otieno',
      recipient_phone: '+254700000004',
      notes: 'Handle with care',
      created_at: now(),
      updated_at: now()
    }
  ],
  orderStatusHistory: [
    { id: 'hist-1', order_id: 'ord-sample-1', status: 'pending', note: 'Order created', changed_by: 'customer-main', created_at: now() },
    { id: 'hist-2', order_id: 'ord-sample-1', status: 'confirmed', note: 'Order confirmed', changed_by: 'admin-main', created_at: now() },
    { id: 'hist-3', order_id: 'ord-sample-1', status: 'rider_assigned', note: 'Rider assigned', changed_by: 'admin-main', created_at: now() },
    { id: 'hist-4', order_id: 'ord-sample-1', status: 'in_transit', note: 'Rider in transit', changed_by: 'rider-main', created_at: now() }
  ],
  riderLocations: [
    { id: 'loc-1', rider_id: 'rider-main', bike_id: 'bike-1', latitude: -1.279, longitude: 36.801, speed: 27, heading: 120, recorded_at: now() }
  ],
  notifications: [{ id: 'ntf-1', user_id: 'admin-main', title: 'Operations ready', body: 'Live preview data loaded', type: 'info', created_at: now() }]
}

export const mockId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
