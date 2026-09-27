import { afterEach, describe, expect, test } from "bun:test";
import { RENDITION_WIDTHS } from "@/lib/storage-paths";
import { uploadVehiclePhoto, type ClientLike, type DecodedImage, type StorageError } from "./photo-upload";

const originalConsoleError = console.error;

afterEach(() => {
  console.error = originalConsoleError;
});

/** A decoder that never touches the DOM — reports fixed dimensions and "encodes" instantly. */
function fakeDecodeImage(width: number, height: number): () => Promise<DecodedImage> {
  return async () => ({
    width,
    height,
    renderRendition: async () => new Blob(["fake-webp-bytes"]),
    dispose: () => {},
  });
}

type UploadCall = { key: string };

/** A fake Supabase storage client. `failOnKeySuffix` simulates one specific upload failing. */
function fakeClient(options: { failOnKeySuffix?: string; removeError?: StorageError } = {}): {
  getClient: () => ClientLike;
  uploads: UploadCall[];
  removedKeys: string[][];
} {
  const uploads: UploadCall[] = [];
  const removedKeys: string[][] = [];

  const getClient = (): ClientLike => ({
    storage: {
      from: () => ({
        upload: async (key: string) => {
          uploads.push({ key });
          if (options.failOnKeySuffix && key.endsWith(options.failOnKeySuffix)) {
            return { error: { message: `upload failed for ${key}` } };
          }
          return { error: null };
        },
        remove: async (keys: string[]) => {
          removedKeys.push(keys);
          return { error: options.removeError ?? null };
        },
      }),
    },
  });

  return { getClient, uploads, removedKeys };
}

describe("uploadVehiclePhoto", () => {
  test("uploads all four rendition keys on success", async () => {
    const { getClient, uploads } = fakeClient();
    const decodeImage = fakeDecodeImage(2000, 1000);

    const result = await uploadVehiclePhoto(new File([], "car.jpg"), "vehicle-1", { getClient, decodeImage });

    expect(uploads).toHaveLength(RENDITION_WIDTHS.length);
    for (const width of RENDITION_WIDTHS) {
      expect(uploads.some(u => u.key === `${result.path}/w${width}.webp`)).toBe(true);
    }
    expect(result.width).toBe(2000);
    expect(result.height).toBe(1000);
  });

  test("a mid-loop failure removes exactly the renditions already uploaded", async () => {
    // RENDITION_WIDTHS = [480, 800, 1200, 1800]: fail on the 3rd (w1200), expect only
    // w480 and w800 to have been uploaded (and therefore removed), never w1800.
    const { getClient, uploads, removedKeys } = fakeClient({ failOnKeySuffix: "/w1200.webp" });
    const decodeImage = fakeDecodeImage(2000, 1000);

    await expect(uploadVehiclePhoto(new File([], "car.jpg"), "vehicle-1", { getClient, decodeImage })).rejects.toThrow(
      /upload failed/,
    );

    expect(uploads.map(u => u.key).some(key => key.endsWith("/w1800.webp"))).toBe(false);
    expect(removedKeys).toHaveLength(1);
    expect(removedKeys[0]).toEqual(
      uploads.filter(u => !u.key.endsWith("/w1200.webp")).map(u => u.key),
    );
    expect(removedKeys[0]).toHaveLength(2);
  });

  test("a failing cleanup still propagates the original upload error, and logs the orphaned keys", async () => {
    const { getClient } = fakeClient({
      failOnKeySuffix: "/w1200.webp",
      removeError: { message: "cleanup network error" },
    });
    const decodeImage = fakeDecodeImage(2000, 1000);

    let loggedArgs: unknown[] = [];
    console.error = (...args: unknown[]) => {
      loggedArgs = args;
    };

    await expect(uploadVehiclePhoto(new File([], "car.jpg"), "vehicle-1", { getClient, decodeImage })).rejects.toThrow(
      /upload failed/,
    );

    expect(loggedArgs.length).toBeGreaterThan(0);
    expect(String(loggedArgs[0])).toContain("cleanup failed");
  });

  test("never upscales: a small natural width still produces a result without throwing", async () => {
    const { getClient } = fakeClient();
    const decodeImage = fakeDecodeImage(300, 200);

    const result = await uploadVehiclePhoto(new File([], "small.jpg"), "vehicle-1", { getClient, decodeImage });
    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });
});
