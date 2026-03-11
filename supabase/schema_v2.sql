-- Efikishe v2 production schema (Supabase-compatible, rerunnable)

create extension if not exists pgcrypto;

-- =========================================================
-- Core helpers
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Tables
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'rider')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_text text not null,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  max_weight_kg numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_configs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  vehicle_type_id uuid references public.vehicle_types(id) on delete cascade,
  base_fare numeric(10,2) not null default 0,
  per_km_rate numeric(10,2) not null default 0,
  per_minute_rate numeric(10,2) not null default 0,
  urgency_rules_json jsonb not null default '{}'::jsonb,
  weight_rules_json jsonb not null default '{}'::jsonb,
  zone_rules_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, vehicle_type_id)
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  polygon_json jsonb,
  surcharge numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  phone text,
  status text not null default 'offline' check (status in ('offline', 'available', 'busy')),
  current_zone_id uuid references public.zones(id) on delete set null,
  is_available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid references public.riders(id) on delete set null,
  bike_code text not null unique,
  vehicle_type_id uuid references public.vehicle_types(id),
  identifier text,
  battery_level integer check (battery_level between 0 and 100),
  status text not null default 'offline' check (status in ('offline', 'available', 'busy', 'charging')),
  current_latitude double precision,
  current_longitude double precision,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  customer_id uuid not null references public.profiles(id),
  service_id uuid references public.services(id),
  vehicle_type_id uuid references public.vehicle_types(id),
  rider_id uuid references public.riders(id),
  bike_id uuid references public.bikes(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rider_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  pickup_address_text text not null,
  pickup_latitude double precision,
  pickup_longitude double precision,
  dropoff_address_text text not null,
  dropoff_latitude double precision,
  dropoff_longitude double precision,
  package_type text,
  package_weight_category text,
  urgency text,
  scheduled_for timestamptz,
  distance_km numeric(10,2),
  estimated_duration_minutes integer,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  sender_name text,
  sender_phone text,
  recipient_name text,
  recipient_phone text,
  notes text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'unpaid', 'paid', 'failed', 'refunded')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.rider_locations (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  speed numeric(10,2),
  heading numeric(10,2),
  recorded_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'rider', 'admin')),
  message_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rider_id uuid references public.riders(id) on delete set null,
  rider_score integer not null check (rider_score between 1 and 5),
  app_score integer not null check (app_score between 1 and 5),
  rider_feedback text,
  app_feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  hero_title text not null,
  hero_subtitle text not null,
  hero_cta_text text not null,
  services_section_title text not null,
  support_phone text,
  support_email text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_credentials (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Role helper functions (after profiles table exists)
-- SECURITY DEFINER avoids RLS recursion when policies call is_admin()
-- =========================================================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- =========================================================
-- Indexes
-- =========================================================
create index if not exists idx_orders_tracking on public.orders (tracking_code);
create index if not exists idx_orders_customer on public.orders (customer_id, created_at desc);
create index if not exists idx_orders_status on public.orders (status, created_at desc);
create index if not exists idx_rider_locations_rider on public.rider_locations (rider_id, recorded_at desc);
create index if not exists idx_pricing_cfg on public.pricing_configs (service_id, vehicle_type_id);
create index if not exists idx_order_messages_order on public.order_messages (order_id, created_at desc);
create index if not exists idx_order_ratings_customer on public.order_ratings (customer_id, created_at desc);
create index if not exists idx_order_ratings_rider on public.order_ratings (rider_id, created_at desc);

-- =========================================================
-- updated_at triggers
-- =========================================================
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists trg_vehicle_types_updated_at on public.vehicle_types;
create trigger trg_vehicle_types_updated_at
before update on public.vehicle_types
for each row execute function public.set_updated_at();

drop trigger if exists trg_pricing_configs_updated_at on public.pricing_configs;
create trigger trg_pricing_configs_updated_at
before update on public.pricing_configs
for each row execute function public.set_updated_at();

drop trigger if exists trg_zones_updated_at on public.zones;
create trigger trg_zones_updated_at
before update on public.zones
for each row execute function public.set_updated_at();

drop trigger if exists trg_riders_updated_at on public.riders;
create trigger trg_riders_updated_at
before update on public.riders
for each row execute function public.set_updated_at();

drop trigger if exists trg_bikes_updated_at on public.bikes;
create trigger trg_bikes_updated_at
before update on public.bikes
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_credentials_updated_at on public.admin_credentials;
create trigger trg_admin_credentials_updated_at
before update on public.admin_credentials
for each row execute function public.set_updated_at();

drop trigger if exists trg_order_ratings_updated_at on public.order_ratings;
create trigger trg_order_ratings_updated_at
before update on public.order_ratings
for each row execute function public.set_updated_at();

-- =========================================================
-- Signup profile trigger
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- Public tracking RPC
-- =========================================================
create or replace function public.get_public_order_tracking(p_tracking_code text)
returns table (
  tracking_code text,
  status text,
  pickup_address_text text,
  dropoff_address_text text,
  estimated_duration_minutes integer,
  rider_name text,
  bike_identifier text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.tracking_code,
    o.status,
    o.pickup_address_text,
    o.dropoff_address_text,
    o.estimated_duration_minutes,
    r.display_name as rider_name,
    b.identifier as bike_identifier,
    o.updated_at
  from public.orders o
  left join public.riders r on r.id = o.rider_id
  left join public.bikes b on b.id = o.bike_id
  where o.tracking_code = p_tracking_code
  limit 1
$$;

grant execute on function public.get_public_order_tracking(text) to anon, authenticated;

create or replace function public.get_rating_summary()
returns table (
  rider_avg numeric,
  app_avg numeric,
  total_reviews integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(round(avg(orx.rider_score)::numeric, 2), 4.9) as rider_avg,
    coalesce(round(avg(orx.app_score)::numeric, 2), 4.9) as app_avg,
    count(*)::integer as total_reviews
  from public.order_ratings orx
$$;

grant execute on function public.get_rating_summary() to anon, authenticated;

create or replace function public.verify_admin_credentials(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched boolean;
  admin_email text;
begin
  if public.current_user_role() <> 'admin' then
    return false;
  end if;

  select p.email into admin_email
  from public.profiles p
  where p.id = auth.uid();

  if admin_email is null or lower(admin_email) <> lower(coalesce(p_username, '')) then
    return false;
  end if;

  select exists (
    select 1
    from public.admin_credentials c
    where c.active = true
      and lower(c.username) = lower(admin_email)
      and c.password_hash = extensions.crypt(p_password, c.password_hash)
  )
  into matched;

  return coalesce(matched, false);
end;
$$;

grant execute on function public.verify_admin_credentials(text, text) to authenticated;

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.services enable row level security;
alter table public.vehicle_types enable row level security;
alter table public.pricing_configs enable row level security;
alter table public.zones enable row level security;
alter table public.riders enable row level security;
alter table public.bikes enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.rider_locations enable row level security;
alter table public.notifications enable row level security;
alter table public.order_messages enable row level security;
alter table public.order_ratings enable row level security;
alter table public.app_settings enable row level security;
alter table public.homepage_content enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_credentials enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
for insert
with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists addresses_crud on public.addresses;
create policy addresses_crud on public.addresses
for all
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists services_select on public.services;
create policy services_select on public.services
for select
using (active or public.is_admin());

drop policy if exists services_admin on public.services;
create policy services_admin on public.services
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists vehicle_types_select on public.vehicle_types;
create policy vehicle_types_select on public.vehicle_types
for select
using (active or public.is_admin());

drop policy if exists vehicle_types_admin on public.vehicle_types;
create policy vehicle_types_admin on public.vehicle_types
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists pricing_select on public.pricing_configs;
create policy pricing_select on public.pricing_configs
for select
using (active or public.is_admin());

drop policy if exists pricing_admin on public.pricing_configs;
create policy pricing_admin on public.pricing_configs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists zones_select on public.zones;
create policy zones_select on public.zones
for select
using (active or public.is_admin());

drop policy if exists zones_admin on public.zones;
create policy zones_admin on public.zones
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists riders_select on public.riders;
create policy riders_select on public.riders
for select
using (public.is_admin() or profile_id = auth.uid());

drop policy if exists riders_admin on public.riders;
create policy riders_admin on public.riders
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists bikes_select on public.bikes;
create policy bikes_select on public.bikes
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = bikes.rider_id
      and r.profile_id = auth.uid()
  )
);

drop policy if exists bikes_admin on public.bikes;
create policy bikes_admin on public.bikes
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
for select
using (
  public.is_admin()
  or customer_id = auth.uid()
  or (
    public.current_user_role() = 'rider'
    and rider_id is null
    and status in ('pending', 'confirmed')
  )
  or exists (
    select 1
    from public.riders r
    where r.id = orders.rider_id
      and r.profile_id = auth.uid()
  )
);

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
for insert
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
for update
using (
  public.is_admin()
  or (
    public.current_user_role() = 'rider'
    and rider_id is null
    and status in ('pending', 'confirmed')
  )
  or exists (
    select 1
    from public.riders r
    where r.id = orders.rider_id
      and r.profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = orders.rider_id
      and r.profile_id = auth.uid()
  )
);

drop policy if exists order_history_select on public.order_status_history;
create policy order_history_select on public.order_status_history
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_status_history.order_id
      and (
        public.is_admin()
        or o.customer_id = auth.uid()
        or exists (
          select 1
          from public.riders r
          where r.id = o.rider_id
            and r.profile_id = auth.uid()
        )
      )
  )
);

drop policy if exists order_history_insert on public.order_status_history;
create policy order_history_insert on public.order_status_history
for insert
with check (public.is_admin() or changed_by = auth.uid());

drop policy if exists rider_locations_select on public.rider_locations;
create policy rider_locations_select on public.rider_locations
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_locations.rider_id
      and r.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.orders o
    where o.rider_id = rider_locations.rider_id
      and o.customer_id = auth.uid()
  )
);

drop policy if exists rider_locations_insert on public.rider_locations;
create policy rider_locations_insert on public.rider_locations
for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.riders r
    where r.id = rider_locations.rider_id
      and r.profile_id = auth.uid()
  )
);

drop policy if exists order_messages_select on public.order_messages;
create policy order_messages_select on public.order_messages
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_messages.order_id
      and (
        o.customer_id = auth.uid()
        or exists (
          select 1
          from public.riders r
          where r.id = o.rider_id
            and r.profile_id = auth.uid()
        )
      )
  )
);

drop policy if exists order_messages_insert on public.order_messages;
create policy order_messages_insert on public.order_messages
for insert
with check (
  sender_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.orders o
      where o.id = order_messages.order_id
        and (
          o.customer_id = auth.uid()
          or exists (
            select 1
            from public.riders r
            where r.id = o.rider_id
              and r.profile_id = auth.uid()
          )
        )
    )
  )
);

drop policy if exists order_ratings_select on public.order_ratings;
create policy order_ratings_select on public.order_ratings
for select
using (
  public.is_admin()
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.riders r
    where r.id = order_ratings.rider_id
      and r.profile_id = auth.uid()
  )
);

drop policy if exists order_ratings_insert on public.order_ratings;
create policy order_ratings_insert on public.order_ratings
for insert
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.orders o
    where o.id = order_ratings.order_id
      and o.customer_id = auth.uid()
      and o.status = 'delivered'
  )
);

drop policy if exists order_ratings_update on public.order_ratings;
create policy order_ratings_update on public.order_ratings
for update
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
for update
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
for insert
with check (public.is_admin());

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
for select
using (public.is_admin() or key in ('theme', 'support', 'social', 'company', 'public_pages'));

drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_admin on public.app_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists homepage_public on public.homepage_content;
create policy homepage_public on public.homepage_content
for select
using (true);

drop policy if exists homepage_admin on public.homepage_content;
create policy homepage_admin on public.homepage_content
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists audit_admin_select on public.admin_audit_logs;
create policy audit_admin_select on public.admin_audit_logs
for select
using (public.is_admin());

drop policy if exists audit_admin_insert on public.admin_audit_logs;
create policy audit_admin_insert on public.admin_audit_logs
for insert
with check (public.is_admin());

drop policy if exists admin_credentials_admin on public.admin_credentials;
create policy admin_credentials_admin on public.admin_credentials
for all
using (public.is_admin())
with check (public.is_admin());
