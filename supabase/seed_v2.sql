-- Efikishe v2 seed data
insert into public.homepage_content (hero_title, hero_subtitle, hero_cta_text, services_section_title, support_phone, support_email)
values ('Move faster. Spend less. Keep Nairobi cleaner.', 'Electric-first delivery that saves time, money, and emissions.', 'Request Delivery', 'Services', '+254 700 111 222', 'support@efikishe.com')
on conflict do nothing;

insert into public.services (name, slug, description, icon, active, sort_order)
values
  ('Parcel Delivery','parcel','Reliable electric parcel movement across Nairobi.','package',true,1),
  ('Food / Merchant Delivery','food','Fast merchant and food delivery with electric bikes.','utensils',true,2),
  ('Scheduled Delivery','scheduled','Predictable scheduled dispatch for teams and offices.','calendar',true,3),
  ('Express / Same-Day Delivery','express','Priority same-day movement for urgent items.','zap',true,4),
  ('Bulk / Multi-stop Delivery','bulk','Efficient multi-stop routes for business operations.','boxes',true,5)
on conflict (slug) do update set description=excluded.description, active=excluded.active;

insert into public.vehicle_types (name, slug, description, max_weight_kg, active)
values
  ('E-Bike','e-bike','Normal electric bike for small loads.',20,true),
  ('Cargo E-Bike','cargo-e-bike','Electric bike with parcel box.',45,true),
  ('Electric Van','electric-van','Larger electric vehicle for bulk routes.',250,true)
on conflict (slug) do update set description=excluded.description, active=excluded.active;

insert into public.zones (name, polygon_json, surcharge, active)
values
  ('CBD','{"type":"Polygon","coordinates":[[[36.8000,-1.2800],[36.8400,-1.2800],[36.8400,-1.3100],[36.8000,-1.3100],[36.8000,-1.2800]]]}',80,true),
  ('Westlands','{"type":"Polygon","coordinates":[[[36.7800,-1.2500],[36.8100,-1.2500],[36.8100,-1.2800],[36.7800,-1.2800],[36.7800,-1.2500]]]}',120,true)
on conflict (name) do update set surcharge=excluded.surcharge, active=excluded.active;

insert into public.pricing_configs (service_id, vehicle_type_id, base_fare, per_km_rate, per_minute_rate, urgency_rules_json, weight_rules_json, zone_rules_json, active)
select s.id, v.id,
  case s.slug when 'parcel' then 250 when 'food' then 220 when 'scheduled' then 300 when 'express' then 330 else 420 end,
  case v.slug when 'e-bike' then 58 when 'cargo-e-bike' then 68 else 85 end,
  2,
  '{"standard":0,"priority":90,"express":180}'::jsonb,
  '{"small":0,"medium":70,"large":160}'::jsonb,
  '{"default":0}'::jsonb,
  true
from public.services s
cross join public.vehicle_types v
on conflict (service_id, vehicle_type_id) do update set
  base_fare = excluded.base_fare,
  per_km_rate = excluded.per_km_rate,
  urgency_rules_json = excluded.urgency_rules_json,
  weight_rules_json = excluded.weight_rules_json,
  active = excluded.active;

insert into public.app_settings (key, value_json)
values
  ('company', '{"name":"Efikishe","city":"Nairobi"}'),
  ('support', '{"phone":"+254700111222","email":"support@efikishe.com"}'),
  ('public_pages', '{"track":{"title":"Track Delivery","intro":"Track your delivery in real time with your code and get clear status updates from pickup to dropoff.","points":["Enter your tracking code and view live progress instantly.","See rider assignment, status updates, and route movement.","Chat or call when needed during active deliveries."],"footer":"Need help with tracking? Contact support with your tracking code for fast resolution."},"promotions":{"title":"Promotions","intro":"Smart rewards for repeat customers, referrals, and business volume.","points":["First request: 15% off up to KES 300.","5+ deliveries in 7 days: 8% loyalty discount.","Business volume pricing from 50 monthly deliveries.","Referral bonus: KES 200 credit after first successful referral order."],"footer":"Every active offer is shown clearly before you confirm your request."},"support":{"title":"Support","intro":"Real people, fast response, and practical help for every delivery.","points":["Call: +254 700 111 222","WhatsApp: +254 700 111 222","Email: support@efikishe.com","Hours: 06:00 - 22:00 EAT, all week"],"footer":"For active deliveries, include your tracking code for priority assistance."},"about":{"title":"About Efikishe","intro":"Efikishe is built to move Nairobi faster while protecting the environment through electric delivery.","points":["Electric-first dispatch to reduce emissions and urban noise.","Lower operating costs translated into better prices.","Reliable same-day movement for homes, merchants, and businesses.","Rider dignity, safety, and consistent earnings at the center of operations."],"footer":"Our mission is simple: save time, save money, and keep our city cleaner."},"payments":{"title":"Payments","intro":"Simple, secure, and flexible payment options for individuals and businesses.","points":["M-Pesa STK Push for instant checkout.","Visa and Mastercard support.","Monthly invoicing for approved business accounts.","Automatic receipts after every successful payment."],"footer":"Payment support is available on payments@efikishe.com for quick issue resolution."}}'),
  ('theme', '{"primary":"#22c55e","background":"#061f18","surface":"#0f2f25"}'),
  ('payment', '{"status":"placeholder","methods":["mpesa","card"]}')
on conflict (key) do update set value_json=excluded.value_json, updated_at=now();

-- Admin assignment guidance:
-- update public.profiles set role='admin' where email='your-admin@email.com';

-- Default admin gate credential (use your real admin email; change password immediately after first login).
insert into public.admin_credentials (username, password_hash, active)
values ('admin@efikishe.com', extensions.crypt('Admin@12345', extensions.gen_salt('bf')), true)
on conflict (username) do nothing;

insert into public.order_messages (order_id, sender_id, sender_role, message_text)
select o.id, o.customer_id, 'customer', 'Hi rider, please call on arrival.'
from public.orders o
order by o.created_at
limit 1
on conflict do nothing;

insert into public.order_ratings (order_id, customer_id, rider_id, rider_score, app_score, rider_feedback, app_feedback)
select o.id, o.customer_id, o.rider_id, 5, 5, 'Fast and careful delivery.', 'Smooth booking and tracking.'
from public.orders o
where o.status = 'delivered'
order by o.updated_at desc
limit 1
on conflict (order_id) do nothing;
