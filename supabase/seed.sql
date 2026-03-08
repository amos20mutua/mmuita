-- Demo content
insert into public.homepage_content (hero_title, hero_subtitle, hero_cta_text, services_section_title)
values ('Move anything. Quietly. Fast.', 'Premium electric delivery for Nairobi.', 'Request Delivery', 'Services')
on conflict do nothing;

insert into public.services (name, slug, description, base_fare, per_km_rate, per_minute_rate, weight_surcharge_rules, urgency_surcharge_rules, active)
values
  ('Parcel Delivery', 'parcel', 'Everyday parcel movement.', 250, 65, 2, '{"light":0,"medium":80,"heavy":180}', '{"standard":0,"priority":100,"express":220}', true),
  ('Food / Merchant Delivery', 'food', 'Fast merchant and meal dropoff.', 220, 55, 2, '{"light":0,"medium":40,"heavy":100}', '{"standard":0,"priority":90,"express":180}', true),
  ('Scheduled Business Delivery', 'business', 'Planned route support for teams.', 300, 60, 3, '{"light":0,"medium":70,"heavy":140}', '{"standard":0,"priority":80,"express":150}', true),
  ('Express / Same-Day Delivery', 'express', 'Critical same-day dispatch.', 320, 75, 3, '{"light":0,"medium":100,"heavy":220}', '{"standard":0,"priority":120,"express":260}', true),
  ('Bulk / Multi-stop Delivery', 'bulk', 'Batch movement for operations.', 400, 70, 3, '{"light":0,"medium":120,"heavy":260}', '{"standard":0,"priority":100,"express":200}', true)
on conflict (slug) do nothing;

insert into public.zones (name, polygon_json, surcharge, active)
values
  (
    'CBD Zone',
    '{"type":"Polygon","coordinates":[[[36.8000,-1.2800],[36.8400,-1.2800],[36.8400,-1.3100],[36.8000,-1.3100],[36.8000,-1.2800]]]}',
    80,
    true
  ),
  (
    'Westlands Zone',
    '{"type":"Polygon","coordinates":[[[36.7800,-1.2500],[36.8100,-1.2500],[36.8100,-1.2800],[36.7800,-1.2800],[36.7800,-1.2500]]]}',
    120,
    true
  )
on conflict (name) do nothing;

insert into public.app_settings (key, value_json)
values
  ('theme', '{"company":"Efikishe","primary":"#22c55e","surface":"#0f2f25","background":"#061f18"}'),
  ('support', '{"phone":"+254700000000","email":"support@efikishe.com"}'),
  ('social', '{"instagram":"https://instagram.com/efikishe","x":"https://x.com/efikishe"}')
on conflict (key) do update set value_json = excluded.value_json, updated_at = now();

-- Optional: link to real auth user IDs after creating admin/rider in Auth dashboard
-- insert into public.profiles (id, full_name, email, phone, role)
-- values ('<admin-uuid>', 'Efikishe Admin', 'admin@efikishe.com', '+254700111222', 'admin')
-- on conflict (id) do update set role = 'admin';
