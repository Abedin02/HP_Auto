-- HP Auto inventory schema: public.vehicles + public.vehicle_images.
-- Idempotent: safe to re-run (CREATE ... IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS).
--
-- Enum-shaped CHECK constraints mirror the readonly arrays in src/types/vehicle.ts
-- (MAKES, BODY_STYLES, DRIVETRAINS, POWERTRAINS, CHARACTERS, VEHICLE_STATUSES). If those
-- arrays change, this migration (or a follow-up one) must be updated to match.
--
-- gen_random_uuid() ships in Postgres core (no pgcrypto needed) on the Postgres versions
-- Supabase runs.

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[0-9]{4}-[a-z0-9-]+$'),
  status text not null default 'draft' check (status in ('draft', 'published', 'sold')),
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  display_order integer not null default 0,

  stock_number text not null unique,
  vin_tail text not null check (vin_tail ~ '^[A-Za-z0-9]{4,8}$'),
  year smallint not null check (year between 1950 and 2100),
  make text not null check (
    make in ('Porsche', 'BMW', 'Audi', 'Mercedes-AMG', 'Land Rover', 'Lamborghini', 'Ferrari', 'Bugatti')
  ),
  model text not null,
  trim text not null,

  price integer not null check (price > 0),
  mileage integer not null check (mileage >= 0),
  body_style text not null check (body_style in ('Coupe', 'Sedan', 'SUV', 'Convertible', 'Wagon')),
  drivetrain text not null check (drivetrain in ('RWD', 'AWD')),
  powertrain text not null check (powertrain in ('Gasoline', 'Hybrid', 'Electric')),
  transmission text not null,
  engine text not null,
  horsepower integer not null check (horsepower > 0),
  torque_lb_ft integer not null check (torque_lb_ft > 0),
  top_speed_mph integer not null check (top_speed_mph > 0),
  zero_to_sixty numeric(3, 1) not null check (zero_to_sixty > 0),

  exterior_color text not null,
  interior_color text not null,
  owners smallint not null default 0 check (owners >= 0),
  accident_free boolean not null default true,
  location text not null,

  characters text[] not null check (
    array_length(characters, 1) > 0
    and characters <@ array['track', 'grand-touring', 'utility', 'electric', 'heritage', 'hypercar']::text[]
  ),
  highlights text[] not null default '{}',
  story text not null default '',

  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Listing query is "published vehicles, ordered display_order asc, created_at desc".
drop index if exists public.vehicles_status_display_order_idx;
create index if not exists vehicles_listing_idx on public.vehicles (status, display_order, created_at desc);
create index if not exists vehicles_created_by_idx on public.vehicles (created_by);

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  path text not null unique check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  alt text not null,
  focus_x real check (focus_x is null or (focus_x >= 0 and focus_x <= 1)),
  focus_y real check (focus_y is null or (focus_y >= 0 and focus_y <= 1)),
  focus_z real check (focus_z is null or focus_z >= 1),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  constraint vehicle_images_focus_all_or_none check (
    (focus_x is null and focus_y is null and focus_z is null)
    or (focus_x is not null and focus_y is not null and focus_z is not null)
  ),
  -- Deferred to transaction-commit so a single-statement permutation of sort_order values
  -- (see reorder_vehicle_images below) never trips over its own intermediate state.
  constraint vehicle_images_vehicle_sort_order_key unique (vehicle_id, sort_order) deferrable initially deferred
);

create index if not exists vehicle_images_vehicle_sort_idx on public.vehicle_images (vehicle_id, sort_order);

-- updated_at trigger --------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row
  execute function public.set_updated_at();

-- is_admin(): true only when the JWT's app_metadata.role is "admin" (never user_metadata,
-- which the owning user could edit themselves). -----------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- reorder_vehicle_images: atomic drag-and-drop reorder. SECURITY INVOKER (the default) means
-- RLS is still enforced under the caller's role, so a non-admin gets zero rows updated (and
-- therefore a count mismatch -> exception) rather than needing a SECURITY DEFINER escape hatch.

create or replace function public.reorder_vehicle_images(p_vehicle_id uuid, p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_expected_count integer;
  v_given_count integer;
  v_matching_count integer;
begin
  select count(*) into v_expected_count
  from public.vehicle_images
  where vehicle_id = p_vehicle_id;

  v_given_count := coalesce(array_length(p_ids, 1), 0);
  if v_given_count <> v_expected_count then
    raise exception 'reorder_vehicle_images: expected % image id(s) for vehicle %, got %',
      v_expected_count, p_vehicle_id, v_given_count;
  end if;

  select count(*) into v_matching_count
  from public.vehicle_images
  where vehicle_id = p_vehicle_id
    and id = any (p_ids);

  if v_matching_count <> v_expected_count then
    raise exception 'reorder_vehicle_images: p_ids must be exactly vehicle %''s current image ids', p_vehicle_id;
  end if;

  update public.vehicle_images as vi
  set sort_order = ord.ordinality - 1
  from unnest(p_ids) with ordinality as ord (id, ordinality)
  where vi.id = ord.id
    and vi.vehicle_id = p_vehicle_id;
end;
$$;

grant execute on function public.reorder_vehicle_images(uuid, uuid[]) to authenticated;

-- Row Level Security ----------------------------------------------------------
-- Public (anon + authenticated, non-admin): read published vehicles/images only.
-- Admin (is_admin()): full read/write on both tables. No other write policy exists.
-- `(select public.is_admin())` (rather than a bare call) lets Postgres evaluate it once per
-- statement instead of once per row.

alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;

drop policy if exists vehicles_public_select on public.vehicles;
create policy vehicles_public_select on public.vehicles
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists vehicles_admin_all on public.vehicles;
create policy vehicles_admin_all on public.vehicles
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists vehicle_images_public_select on public.vehicle_images;
create policy vehicle_images_public_select on public.vehicle_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_images.vehicle_id and v.status = 'published'
    )
  );

drop policy if exists vehicle_images_admin_all on public.vehicle_images;
create policy vehicle_images_admin_all on public.vehicle_images
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
