/**
 * Pure planning for browser-side photo resizing. No Supabase plan supports paid image
 * transforms, so the admin uploader resizes each photo into fixed WebP renditions before
 * upload (see src/lib/storage-paths.ts for the on-disk layout).
 */
import { RENDITION_WIDTHS } from "@/lib/storage-paths";

export type RenditionPlanItem = { width: number; height: number };

/**
 * Maps RENDITION_WIDTHS to the widths actually worth generating for one source image:
 * never upscale (each target width is clamped to the natural width), duplicates collapse
 * once several targets clamp to the same value, and height is derived to preserve aspect.
 */
export function planRenditions(naturalWidth: number, naturalHeight: number): RenditionPlanItem[] {
  if (naturalWidth <= 0 || naturalHeight <= 0) return [];

  const aspect = naturalHeight / naturalWidth;
  const clampedWidths = RENDITION_WIDTHS.map(width => Math.min(width, naturalWidth));
  const widths = [...new Set(clampedWidths)].sort((a, b) => a - b);

  return widths.map(width => ({ width, height: Math.round(width * aspect) }));
}
