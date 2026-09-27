-- Engine becomes required; every other Performance spec stays optional with no rules on the value.
--   * engine: NOT NULL, 1-80 characters (MAX_SHORT_TEXT_LENGTH in src/lib/vehicle-validation.ts).
--   * transmission: no length check.
--   * horsepower, torque_lb_ft, top_speed_mph, zero_to_sixty: no "> 0" checks, and plain numeric
--     (was integer / numeric(3,1)) so decimals and larger values are stored as entered.
--
-- Idempotent: constraints are dropped with IF EXISTS; re-running the type changes is a no-op.
-- The NOT NULL on engine fails if any existing vehicle has no engine, so I fill those in first.

alter table public.vehicles alter column engine set not null;
alter table public.vehicles drop constraint if exists vehicles_engine_check;
alter table public.vehicles add constraint vehicles_engine_check
  check (char_length(engine) between 1 and 80);

alter table public.vehicles drop constraint if exists vehicles_transmission_check;
alter table public.vehicles drop constraint if exists vehicles_horsepower_check;
alter table public.vehicles drop constraint if exists vehicles_torque_lb_ft_check;
alter table public.vehicles drop constraint if exists vehicles_top_speed_mph_check;
alter table public.vehicles drop constraint if exists vehicles_zero_to_sixty_check;

alter table public.vehicles alter column horsepower type numeric;
alter table public.vehicles alter column torque_lb_ft type numeric;
alter table public.vehicles alter column top_speed_mph type numeric;
alter table public.vehicles alter column zero_to_sixty type numeric;
