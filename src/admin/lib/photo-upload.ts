/**
 * Browser-side resize + upload for one vehicle photo. No Supabase plan here supports paid
 * image transforms, so every RENDITION_WIDTHS size is produced locally as WebP before
 * upload (see src/lib/storage-paths.ts for the on-disk layout `planRenditions` feeds into).
 *
 * Both browser-only pieces — decoding/canvas-encoding and the Supabase client — are taken as
 * injectable seams so this can be unit tested in Bun (no DOM, no network). See
 * photo-upload.test.ts.
 */
import { getSupabaseClient } from "@/admin/lib/supabase";
import { planRenditions } from "@/admin/lib/rendition-plan";
import { RENDITION_WIDTHS, VEHICLE_PHOTO_BUCKET, photoPath, renditionKey } from "@/lib/storage-paths";

export type UploadedPhoto = { path: string; width: number; height: number };

const WEBP_QUALITY = 0.82;

export type StorageError = { message: string } | null;

/** The slice of `SupabaseClient["storage"]` this module needs — easy to fake in tests. */
export type StorageLike = {
  from: (bucket: string) => {
    upload: (
      key: string,
      blob: Blob,
      options: { contentType: string; cacheControl: string; upsert: boolean },
    ) => Promise<{ error: StorageError }>;
    remove: (keys: string[]) => Promise<{ error: StorageError }>;
  };
};

export type ClientLike = { storage: StorageLike };

export type DecodedImage = {
  width: number;
  height: number;
  /** Renders this image at the given pixel size and encodes it as WebP. */
  renderRendition: (width: number, height: number) => Promise<Blob>;
  /** Releases any decoder resources (e.g. `ImageBitmap.close()`). */
  dispose: () => void;
};

export type UploadVehiclePhotoOptions = {
  getClient?: () => ClientLike;
  decodeImage?: (file: File) => Promise<DecodedImage>;
};

function drawToCanvas(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is not available in this browser.");
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Could not encode image as WebP."))),
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

async function defaultDecodeImage(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file);
  return {
    width: bitmap.width,
    height: bitmap.height,
    renderRendition: (width, height) => canvasToWebp(drawToCanvas(bitmap, width, height)),
    dispose: () => bitmap.close(),
  };
}

/**
 * Resizes one file and uploads all four RENDITION_WIDTHS objects for it. Each canonical
 * width is clamped to the natural width (never upscaled, via `planRenditions`); canonical
 * widths that clamp to the same pixel size reuse one encoded blob instead of re-encoding.
 * If any single rendition upload fails, every rendition already uploaded for this photo is
 * removed before the original error propagates. If that cleanup itself fails, the orphaned
 * keys are logged (so they can be swept manually) and the original error still propagates —
 * a cleanup failure must never mask why the upload failed.
 */
export async function uploadVehiclePhoto(
  file: File,
  vehicleId: string,
  options: UploadVehiclePhotoOptions = {},
): Promise<UploadedPhoto> {
  const getClient = options.getClient ?? getSupabaseClient;
  const decodeImage = options.decodeImage ?? defaultDecodeImage;

  const decoded = await decodeImage(file);
  try {
    const plan = planRenditions(decoded.width, decoded.height);
    if (plan.length === 0) throw new Error("Could not read this image's dimensions.");

    const blobsByWidth = new Map<number, Blob>();
    for (const item of plan) {
      blobsByWidth.set(item.width, await decoded.renderRendition(item.width, item.height));
    }

    const path = photoPath(vehicleId, crypto.randomUUID());
    const bucket = getClient().storage.from(VEHICLE_PHOTO_BUCKET);
    const uploadedKeys: string[] = [];

    try {
      for (const canonicalWidth of RENDITION_WIDTHS) {
        const clampedWidth = Math.min(canonicalWidth, decoded.width);
        const blob = blobsByWidth.get(clampedWidth);
        if (!blob) throw new Error("Internal error planning image renditions.");
        const key = renditionKey(path, canonicalWidth);
        const { error } = await bucket.upload(key, blob, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw new Error(error.message);
        uploadedKeys.push(key);
      }
    } catch (error) {
      if (uploadedKeys.length > 0) {
        const { error: removeError } = await bucket.remove(uploadedKeys);
        if (removeError) {
          console.error(
            `[photo-upload] cleanup failed after a rendition upload error — orphaned storage objects for ${path}:`,
            uploadedKeys,
            removeError.message,
          );
        }
      }
      throw error;
    }

    return { path, width: decoded.width, height: decoded.height };
  } finally {
    decoded.dispose();
  }
}
