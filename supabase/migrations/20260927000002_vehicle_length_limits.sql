-- Length limits that were previously enforced only by the admin form. They mirror the MAX_* constants
-- in src/lib/vehicle-validation.ts, and I change both together.
--
-- char_length() counts code points while JS .length counts UTF-16 units, so the database is never
-- stricter than the form (an emoji is 1 here, 2 in JS).
--
-- Idempotent: every constraint is dropped with IF EXISTS before being re-added.

-- highlights: at most MAX_HIGHLIGHTS (8) items, each 1..MAX_HIGHLIGHT_LENGTH (140) characters and
-- already trimmed. A CHECK can't hold a subquery, so the per-element test lives in an IMMUTABLE
-- helper.
create or replace function public.vehicle_highlights_are_valid(p_highlights text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(p_highlights, 1), 0) <= 8
    and not exists (
      select 1
      from unnest(p_highlights) as h (item)
      where item is null
        or char_length(item) not between 1 and 140
        or item ~ '^\s|\s$'
    );
$$;

alter table public.vehicles drop constraint if exists vehicles_highlights_check;
alter table public.vehicles add constraint vehicles_highlights_check
  check (public.vehicle_highlights_are_valid(highlights));

-- MAX_STORY_LENGTH
alter table public.vehicles drop constraint if exists vehicles_story_length_check;
alter table public.vehicles add constraint vehicles_story_length_check
  check (char_length(story) <= 4000);

-- MAX_STOCK_NUMBER_LENGTH
alter table public.vehicles drop constraint if exists vehicles_stock_number_length_check;
alter table public.vehicles add constraint vehicles_stock_number_length_check
  check (char_length(stock_number) between 1 and 40);

-- MAX_SHORT_TEXT_LENGTH (engine already has its own check in 20260927000001).
alter table public.vehicles drop constraint if exists vehicles_short_text_length_check;
alter table public.vehicles add constraint vehicles_short_text_length_check
  check (
    char_length(model) between 1 and 80
    and char_length(trim) between 1 and 80
    and char_length(transmission) between 1 and 80
    and char_length(exterior_color) between 1 and 80
    and char_length(interior_color) between 1 and 80
  );

-- MAX_LOCATION_LENGTH
alter table public.vehicles drop constraint if exists vehicles_location_length_check;
alter table public.vehicles add constraint vehicles_location_length_check
  check (char_length(location) between 1 and 100);

-- Slug length cap (MAX_SLUG_LENGTH in vehicle-validation.ts).
alter table public.vehicles drop constraint if exists vehicles_slug_length_check;
alter table public.vehicles add constraint vehicles_slug_length_check
  check (char_length(slug) <= 80);
