# Supabase setup

This directory holds the SQL migrations for HP Auto's inventory: `public.vehicles`,
`public.vehicle_images`, the `is_admin()` helper, RLS policies, and the `vehicle-photos`
storage bucket. Nothing here needs real credentials to develop against — the server and
admin app read `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `BUN_PUBLIC_*` from the
environment (see `.env.example`), and `bun test` uses fakes, not a live database.

## 1. Apply the migrations

Pick one:

**Option A — Supabase SQL editor** (simplest, no CLI needed)
1. Open your project's SQL editor in the Supabase dashboard.
2. Paste and run `migrations/20260926000001_vehicles.sql`.
3. Paste and run `migrations/20260926000002_storage.sql`.
4. Paste and run `migrations/20260927000001_broaden_vehicle_specs.sql` (broadens `make` to a
   free-form string, widens the `body_style`/`drivetrain`/`powertrain`/`characters` sets, and
   makes `engine`/`torque_lb_ft`/`zero_to_sixty`/`top_speed_mph` nullable). Apply it even if
   `20260926000001_vehicles.sql` was already run against this database — it only adds/replaces
   constraints, it never drops data.

All three files are idempotent (`CREATE ... IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `DROP
CONSTRAINT IF EXISTS`, `ON CONFLICT DO UPDATE`), so re-running them after a mistake is safe.

**Option B — Supabase CLI**
```
supabase link --project-ref <your-project-ref>
supabase db push
```
This applies every file under `migrations/` in filename order.

## 2. Disable public sign-ups

There is exactly one admin account, created by `scripts/create-admin.ts` with the
service-role key — the public should never be able to self-register. In the dashboard:

**Authentication -> Providers -> Email**: turn off **"Allow new users to sign up"**
(or, in the Supabase CLI config, set `[auth] enable_signup = false` in `supabase/config.toml`
if you manage config as code).

With sign-ups disabled, only `scripts/create-admin.ts` (using `SUPABASE_SECRET_KEY`) can
create a user, and only that user carries `app_metadata.role = "admin"`.

## 3. Create the admin user

From the project root, with `SUPABASE_URL` and `SUPABASE_SECRET_KEY` set (see
`.env.example` — the secret key is script-only, never given to the server or the browser):

```
bun run create-admin -- --email you@example.com --password 'a-strong-password'
```

The script creates the user with `email_confirm: true` (or updates the existing user by
email) and sets `app_metadata.role = "admin"`. It never prints the password or the key.
Sign in at `/admin` with the same email/password afterwards.

## Notes

- `public.is_admin()` reads `auth.jwt() -> 'app_metadata' ->> 'role'` — never
  `user_metadata`, which an authenticated user could edit on themselves via the client SDK.
- The enum-shaped `CHECK` constraints (`body_style`, `drivetrain`, `powertrain`, `characters`,
  `status`) mirror the arrays in `src/types/vehicle.ts`. If those arrays change, add a
  follow-up migration to match. `make` is no longer an enum: any non-empty string up to 40
  characters with no leading/trailing whitespace (tabs and non-breaking spaces included) is
  accepted (see `20260927000001_broaden_vehicle_specs.sql`); the admin normalises common
  aliases/casing via `canonicalMake()` before saving, and `POPULAR_MAKES` only drives the
  admin's autocomplete list, not what can be stored. Make filtering/grouping happens
  client-side against the already-fetched vehicle list, so there's no index on `make`.
- `engine`, `torque_lb_ft`, `zero_to_sixty` and `top_speed_mph` are nullable — some
  manufacturers never publish those figures. `engine` keeps its 80-character cap and
  `torque_lb_ft`/`zero_to_sixty`/`top_speed_mph` keep their `> 0` checks, all now
  null-tolerant.
- The `vehicle-photos` bucket is public for reads (served via the public object URL), so no
  `SELECT` policy exists on `storage.objects` — only admin-authenticated `INSERT` / `UPDATE`
  / `DELETE` are policed.
- Both `public.is_admin()` and `public.set_updated_at()` pin `search_path = ''` and
  schema-qualify every identifier in their bodies, so they can't be tricked by a
  session/role that has manipulated its own `search_path`.
- Reordering photos goes through `public.reorder_vehicle_images(p_vehicle_id, p_ids)`
  (`SECURITY INVOKER`, so normal RLS applies) rather than N separate updates from the
  client, so a drag-and-drop reorder is one atomic statement instead of a race-prone
  sequence of writes. Call it with `client.rpc("reorder_vehicle_images", { p_vehicle_id,
  p_ids })`, where `p_ids` is the vehicle's full image id list in the new order.
