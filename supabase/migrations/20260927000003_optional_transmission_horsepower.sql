-- Makes transmission and horsepower optional, like the other Performance fields made nullable in
-- 20260927000001. Both columns become nullable; their existing rules (transmission 1-80 chars,
-- horsepower > 0) still apply when a value is present. Mirrors validateOptionalText /
-- validateOptionalPositiveNumber in src/lib/vehicle-validation.ts.
--
-- Idempotent: constraints are dropped with IF EXISTS before being re-added.

alter table public.vehicles alter column transmission drop not null;
alter table public.vehicles alter column horsepower drop not null;

-- transmission leaves the shared short-text check (added in 20260927000002) for its own
-- null-tolerant one. Mirrors MAX_SHORT_TEXT_LENGTH (80).
alter table public.vehicles drop constraint if exists vehicles_short_text_length_check;
alter table public.vehicles add constraint vehicles_short_text_length_check
  check (
    char_length(model) between 1 and 80
    and char_length(trim) between 1 and 80
    and char_length(exterior_color) between 1 and 80
    and char_length(interior_color) between 1 and 80
  );

alter table public.vehicles drop constraint if exists vehicles_transmission_check;
alter table public.vehicles add constraint vehicles_transmission_check
  check (transmission is null or char_length(transmission) between 1 and 80);

alter table public.vehicles drop constraint if exists vehicles_horsepower_check;
alter table public.vehicles add constraint vehicles_horsepower_check
  check (horsepower is null or horsepower > 0);
