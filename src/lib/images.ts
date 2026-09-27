import { PUBLIC_SUPABASE_URL } from "@/lib/public-env";
import { RENDITION_WIDTHS, renditionUrl, type RenditionWidth } from "@/lib/storage-paths";
import type { ImageFocus, ImageSource, Vehicle, VehicleImage } from "@/types/vehicle";

const UNSPLASH_BASE = "https://images.unsplash.com/photo-";

/** Marketing imagery lives on Unsplash; this is the one place that builds its ImageSource. */
export function unsplash(photoId: string): ImageSource {
  return { kind: "unsplash", photoId };
}

/** Stable identity for a source, used for React keys and cache-busting on source change. */
export function sourceKey(source: ImageSource): string {
  return source.kind === "unsplash" ? `unsplash:${source.photoId}` : `storage:${source.path}`;
}

type ImageOptions = {
  width: number;
  /** width / height. Unsplash only: when set, the image is cropped to this ratio. */
  aspect?: number;
  quality?: number;
  focus?: ImageFocus;
};

function unsplashUrl(photoId: string, { width, aspect, quality = 72, focus }: ImageOptions): string {
  const params = new URLSearchParams({ w: String(width), q: String(quality), auto: "format" });
  if (aspect) {
    params.set("h", String(Math.round(width / aspect)));
    params.set("fit", "crop");
    if (focus) {
      params.set("crop", "focalpoint");
      params.set("fp-x", String(focus.x));
      params.set("fp-y", String(focus.y));
      params.set("fp-z", String(focus.z));
    }
  }
  return `${UNSPLASH_BASE}${photoId}?${params.toString()}`;
}

const MAX_RENDITION_WIDTH = 1800;

/** Smallest pre-generated rendition at least as wide as requested, capped so we never ask to upscale. */
function smallestRendition(width: number): RenditionWidth {
  const capped = Math.min(width, MAX_RENDITION_WIDTH);
  return RENDITION_WIDTHS.find(candidate => candidate >= capped) ?? RENDITION_WIDTHS[RENDITION_WIDTHS.length - 1]!;
}

/**
 * Builds a display URL for a source. Unsplash keeps its imgix crop/quality behaviour; storage
 * has no transform plan, so it only ever picks the closest pre-sized rendition (no crop/focus
 * in the URL — see CarImage for the CSS-side aspect/focal emulation).
 */
export function imageUrl(source: ImageSource, options: ImageOptions): string {
  if (source.kind === "unsplash") return unsplashUrl(source.photoId, options);
  return renditionUrl(PUBLIC_SUPABASE_URL, source.path, smallestRendition(options.width));
}

const DEFAULT_UNSPLASH_WIDTHS = [480, 800, 1200, 1800] as const;

export function imageSrcSet(
  source: ImageSource,
  options: Omit<ImageOptions, "width"> = {},
  widths: readonly number[] = DEFAULT_UNSPLASH_WIDTHS,
): string {
  const sourceWidths = source.kind === "unsplash" ? widths : RENDITION_WIDTHS;
  return sourceWidths.map(width => `${imageUrl(source, { ...options, width })} ${width}w`).join(", ");
}

export type GalleryFrame = VehicleImage & { key: string };

const DETAIL_CROPS: readonly { label: string; focus: ImageFocus }[] = [
  { label: "detail", focus: { x: 0.5, y: 0.55, z: 1.8 } },
  { label: "close", focus: { x: 0.38, y: 0.6, z: 2.6 } },
];

const MIN_REAL_PHOTOS_BEFORE_SKIPPING_DETAIL_CROPS = 3;

/**
 * Builds the vehicle-page gallery: every real photo, then (for listings with fewer than 3
 * photos) two focal-zoom detail frames of the hero shot so the gallery never feels sparse.
 */
export function vehicleGallery(vehicle: Vehicle): GalleryFrame[] {
  const photos = vehicle.images.map((image, index) => ({ ...image, key: `${sourceKey(image.source)}-${index}` }));
  const hero = vehicle.images[0];
  if (!hero || vehicle.images.length >= MIN_REAL_PHOTOS_BEFORE_SKIPPING_DETAIL_CROPS) return photos;

  const details = DETAIL_CROPS.map(({ label, focus }) => ({
    source: hero.source,
    alt: `${hero.alt} (${label} view)`,
    focus,
    key: `${sourceKey(hero.source)}-${label}`,
  }));
  return [...photos, ...details];
}
