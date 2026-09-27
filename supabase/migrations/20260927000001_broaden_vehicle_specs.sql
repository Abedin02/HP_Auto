-- Broadens vehicle specs to match the rewritten src/types/vehicle.ts:
--   * make is no longer an enum. Any dealer may stock any make; the admin normalises common
--     aliases/casing via canonicalMake() before save. The CHECK only bounds length and rejects
--     leading/trailing whitespace (including tabs and non-breaking spaces).
--   * body_style, drivetrain, powertrain and characters gain new values (mirrors BODY_STYLES,
--     DRIVETRAINS, POWERTRAINS, CHARACTERS in src/types/vehicle.ts).
--   * engine, torque_lb_ft, zero_to_sixty and top_speed_mph become nullable: some manufacturers
--     (and some makes/models) never publish these figures. engine keeps its length cap (now
--     null-tolerant); the other three keep their existing ">0" checks, also null-tolerant.
--
-- Idempotent: every constraint is dropped with IF EXISTS before being re-added, so this file is
-- safe to re-run. Does not touch 20260926000001_vehicles.sql — that migration may already be
-- applied against a live database.

-- make ------------------------------------------------------------------------------------
-- `!~ '^\s|\s$'` (rather than `= btrim(make)`) also catches whitespace btrim() doesn't strip,
-- like tabs and non-breaking spaces — matching what JS's String.prototype.trim() rejects in
-- src/lib/vehicle-validation.ts's canonicalMake().

alter table public.vehicles drop constraint if exists vehicles_make_check;
alter table public.vehicles add constraint vehicles_make_check
  check (char_length(make) between 1 and 40 and make !~ '^\s|\s$');

-- Make filtering/grouping (src/lib/inventory.ts's makeFacets, the inventory "make" URL filter)
-- happens client-side against the already-fetched vehicle list, not via a database query, so
-- no index is needed here. Drop it in case an earlier run of this file created one.
drop index if exists public.vehicles_make_lower_idx;

-- body_style / drivetrain / powertrain / characters ----------------------------------------

alter table public.vehicles drop constraint if exists vehicles_body_style_check;
alter table public.vehicles add constraint vehicles_body_style_check
  check (
    body_style in (
      'SUV', 'Pickup Truck', 'Sedan', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Minivan', 'Van'
    )
  );

alter table public.vehicles drop constraint if exists vehicles_drivetrain_check;
alter table public.vehicles add constraint vehicles_drivetrain_check
  check (drivetrain in ('FWD', 'RWD', 'AWD', '4WD'));

alter table public.vehicles drop constraint if exists vehicles_powertrain_check;
alter table public.vehicles add constraint vehicles_powertrain_check
  check (powertrain in ('Gasoline', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'));

alter table public.vehicles drop constraint if exists vehicles_characters_check;
alter table public.vehicles add constraint vehicles_characters_check
  check (
    array_length(characters, 1) > 0
    and characters <@ array[
      'track', 'grand-touring', 'utility', 'off-road', 'family', 'commuter', 'luxury',
      'electric', 'heritage', 'hypercar'
    ]::text[]
  );

-- engine / torque_lb_ft / zero_to_sixty / top_speed_mph ------------------------------------
-- Drop NOT NULL first (a no-op if already nullable from a previous run of this file), then
-- replace the positive-value CHECKs with null-tolerant versions.

alter table public.vehicles alter column engine drop not null;
alter table public.vehicles alter column torque_lb_ft drop not null;
alter table public.vehicles alter column zero_to_sixty drop not null;
alter table public.vehicles alter column top_speed_mph drop not null;

-- Mirrors MAX_SHORT_TEXT_LENGTH (80) in src/lib/vehicle-validation.ts.
alter table public.vehicles drop constraint if exists vehicles_engine_check;
alter table public.vehicles add constraint vehicles_engine_check
  check (engine is null or char_length(engine) <= 80);

alter table public.vehicles drop constraint if exists vehicles_torque_lb_ft_check;
alter table public.vehicles add constraint vehicles_torque_lb_ft_check
  check (torque_lb_ft is null or torque_lb_ft > 0);

alter table public.vehicles drop constraint if exists vehicles_zero_to_sixty_check;
alter table public.vehicles add constraint vehicles_zero_to_sixty_check
  check (zero_to_sixty is null or zero_to_sixty > 0);

alter table public.vehicles drop constraint if exists vehicles_top_speed_mph_check;
alter table public.vehicles add constraint vehicles_top_speed_mph_check
  check (top_speed_mph is null or top_speed_mph > 0);
