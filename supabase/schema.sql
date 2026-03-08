-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Helpers
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'rider')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_text text not null,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null,
  base_fare numeric(10,2) not null default 0,
  per_km_rate numeric(10,2) not null default 0,
  per_minute_rate numeric(10,2) not null default 0,
  weight_surcharge_rules jsonb not null default '{}'::jsonb,
  urgency_surcharge_rules jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  rule_name text not null,
  rule_type text not null,
  rule_config_json jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  polygon_json jsonb not null,
  surcharge numeric(10,2) not null default 0,
  active boolean not null default true
);

create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.profiles(id) on delete cascade,
  bike_code text unique not null,
  plate_or_identifier text,
  battery_level integer default 100 check (battery_level between 0 and 100),
  status text not null default 'offline' check (status in ('offline', 'available', 'busy', 'charging')),
  current_latitude double precision,
  current_longitude double precision,
  last_seen_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  customer_id uuid not null references public.profiles(id),
  service_id uuid not null references public.services(id),
  rider_id uuid references public.profiles(id),
  bike_id uuid references public.bikes(id),
  status text not null default 'pending' check (status in ('pending','confirmed','rider_assigned','picked_up','in_transit','delivered','cancelled')),
  pickup_address_text text not null,
  pickup_latitude double precision not null,
  pickup_longitude double precision not null,
  dropoff_address_text text not null,
  dropoff_latitude double precision not null,
  dropoff_longitude double precision not null,
  package_type text,
  package_weight_category text,
  urgency text,
  distance_km numeric(10,2),
  estimated_duration_minutes integer,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  sender_name text,
  sender_phone text,
  recipient_name text,
  recipient_phone text,
  notes text,
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
  rider_id uuid not null references public.profiles(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  speed numeric(8,2),
  heading numeric(8,2),
  recorded_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  hero_title text not null,
  hero_subtitle text not null,
  hero_cta_text text not null,
  services_section_title text not null,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_pricing_rules_service_id on public.pricing_rules(service_id);
create index if not exists idx_bikes_rider_id on public.bikes(rider_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_rider on public.orders(rider_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_status_history_order on public.order_status_history(order_id, created_at);
create index if not exists idx_rider_locations_rider_time on public.rider_locations(rider_id, recorded_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- Auto timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

-- Auth trigger: create customer profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.services enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.zones enable row level security;
alter table public.bikes enable row level security;
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.rider_locations enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;
alter table public.homepage_content enable row level security;

-- Profiles
create policy "profiles self read" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles
for update using (id = auth.uid() or public.is_admin());
create policy "profiles admin insert rider" on public.profiles
for insert with check (public.is_admin());

-- Public read for marketing/config
create policy "services public read" on public.services for select using (true);
create policy "pricing public read" on public.pricing_rules for select using (true);
create policy "zones public read" on public.zones for select using (true);
create policy "home public read" on public.homepage_content for select using (true);

-- Admin write for global config
create policy "services admin write" on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy "pricing admin write" on public.pricing_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "zones admin write" on public.zones for all using (public.is_admin()) with check (public.is_admin());
create policy "settings admin write" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "home admin write" on public.homepage_content for all using (public.is_admin()) with check (public.is_admin());

-- Addresses
create policy "addresses own" on public.addresses
for all using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

-- Orders
create policy "orders customer read own" on public.orders
for select using (customer_id = auth.uid() or rider_id = auth.uid() or public.is_admin());
create policy "orders customer create own" on public.orders
for insert with check (customer_id = auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders
for update using (public.is_admin() or rider_id = auth.uid());

-- Order history
create policy "history read related" on public.order_status_history
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.customer_id = auth.uid() or o.rider_id = auth.uid() or public.is_admin())
  )
);
create policy "history write admin_rider" on public.order_status_history
for insert with check (public.is_admin() or changed_by = auth.uid());

-- Bikes and locations
create policy "bikes read related" on public.bikes
for select using (public.is_admin() or rider_id = auth.uid());
create policy "bikes admin write" on public.bikes
for all using (public.is_admin()) with check (public.is_admin());

create policy "locations read related" on public.rider_locations
for select using (
  public.is_admin() or rider_id = auth.uid() or exists (
    select 1 from public.orders o where o.rider_id = rider_locations.rider_id and o.customer_id = auth.uid()
  )
);
create policy "locations write rider_admin" on public.rider_locations
for insert with check (public.is_admin() or rider_id = auth.uid());

-- Notifications
create policy "notifications own read" on public.notifications
for select using (user_id = auth.uid() or public.is_admin());
create policy "notifications admin write" on public.notifications
for all using (public.is_admin()) with check (public.is_admin());
