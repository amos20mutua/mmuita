-- Ratings feature migration (safe to run on existing projects)

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

create index if not exists idx_order_ratings_customer on public.order_ratings (customer_id, created_at desc);
create index if not exists idx_order_ratings_rider on public.order_ratings (rider_id, created_at desc);

drop trigger if exists trg_order_ratings_updated_at on public.order_ratings;
create trigger trg_order_ratings_updated_at
before update on public.order_ratings
for each row execute function public.set_updated_at();

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

alter table public.order_ratings enable row level security;

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
