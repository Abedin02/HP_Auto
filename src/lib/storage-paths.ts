/**
 * Supabase Storage layout for vehicle photos, shared by the admin uploader, the
 * server row mapper and the public image builder.
 *
 * Each uploaded photo is stored as pre-sized WebP renditions (resized in the admin's
 * browser, so no paid image-transform plan is needed):
 *   vehicle-photos/{vehicleUuid}/{imageUuid}/w480.webp … w1800.webp
 * `path` in the database and in ImageSource is "{vehicleUuid}/{imageUuid}".
 * Paths are never reused, so renditions are immutable and cache forever.
 */
export const VEHICLE_PHOTO_BUCKET = "vehicle-photos";

export const RENDITION_WIDTHS = [480, 800, 1200, 1800] as const;
export type RenditionWidth = (typeof RENDITION_WIDTHS)[number];

export function photoPath(vehicleUuid: string, imageUuid: string): string {
  return `${vehicleUuid}/${imageUuid}`;
}

export function renditionKey(path: string, width: RenditionWidth): string {
  return `${path}/w${width}.webp`;
}

export function renditionUrl(supabaseUrl: string, path: string, width: RenditionWidth): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${VEHICLE_PHOTO_BUCKET}/${renditionKey(path, width)}`;
}
