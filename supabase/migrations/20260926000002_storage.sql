-- Storage bucket for admin-uploaded vehicle photos (public, WebP renditions only).
-- Idempotent: safe to re-run.
--
-- Reads are served straight from the public object URL (see src/lib/storage-paths.ts ->
-- renditionUrl), which bypasses RLS entirely for a public bucket -- no SELECT policy is
-- needed on storage.objects. Only admin-authenticated writes are policed here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 5242880, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists vehicle_photos_admin_insert on storage.objects;
create policy vehicle_photos_admin_insert on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vehicle-photos' and (select public.is_admin()));

drop policy if exists vehicle_photos_admin_update on storage.objects;
create policy vehicle_photos_admin_update on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vehicle-photos' and (select public.is_admin()))
  with check (bucket_id = 'vehicle-photos' and (select public.is_admin()));

drop policy if exists vehicle_photos_admin_delete on storage.objects;
create policy vehicle_photos_admin_delete on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vehicle-photos' and (select public.is_admin()));
