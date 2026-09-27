import { describe, expect, test } from "bun:test";
import { PUBLIC_SUPABASE_URL } from "@/lib/public-env";
import { RENDITION_WIDTHS, renditionUrl } from "@/lib/storage-paths";
import type { ImageFocus, Vehicle } from "@/types/vehicle";
import { imageSrcSet, imageUrl, sourceKey, unsplash, vehicleGallery } from "./images";

const FOCUS: ImageFocus = { x: 0.4, y: 0.6, z: 1.5 };

describe("unsplash", () => {
  test("wraps a photo id in an ImageSource", () => {
    expect(unsplash("abc123")).toEqual({ kind: "unsplash", photoId: "abc123" });
  });
});

describe("imageUrl", () => {
  test("builds an unsplash imgix URL with width and quality", () => {
    const url = imageUrl(unsplash("abc123"), { width: 800 });
    expect(url).toContain("https://images.unsplash.com/photo-abc123?");
    expect(url).toContain("w=800");
    expect(url).toContain("q=72");
    expect(url).toContain("auto=format");
  });

  test("adds crop params for unsplash sources only when an aspect is given", () => {
    const cropped = imageUrl(unsplash("abc123"), { width: 800, aspect: 4 / 3 });
    expect(cropped).toContain("h=600");
    expect(cropped).toContain("fit=crop");

    const uncropped = imageUrl(unsplash("abc123"), { width: 800 });
    expect(uncropped).not.toContain("fit=crop");
  });

  test("adds focal-point params for unsplash sources when both aspect and focus are given", () => {
    const url = imageUrl(unsplash("abc123"), { width: 800, aspect: 1, focus: FOCUS });
    expect(url).toContain("crop=focalpoint");
    expect(url).toContain("fp-x=0.4");
    expect(url).toContain("fp-y=0.6");
    expect(url).toContain("fp-z=1.5");
  });

  test("respects a custom quality for unsplash sources", () => {
    expect(imageUrl(unsplash("abc123"), { width: 800, quality: 40 })).toContain("q=40");
  });

  test("builds a storage rendition URL, ignoring aspect and focus (no transform plan)", () => {
    const url = imageUrl({ kind: "storage", path: "veh-1/img-1" }, { width: 500, aspect: 4 / 3, focus: FOCUS });
    expect(url).toBe(renditionUrl(PUBLIC_SUPABASE_URL, "veh-1/img-1", 800));
  });

  test("picks the smallest storage rendition that is >= the requested width", () => {
    expect(imageUrl({ kind: "storage", path: "p" }, { width: 1 })).toContain("/w480.webp");
    expect(imageUrl({ kind: "storage", path: "p" }, { width: 480 })).toContain("/w480.webp");
    expect(imageUrl({ kind: "storage", path: "p" }, { width: 481 })).toContain("/w800.webp");
    expect(imageUrl({ kind: "storage", path: "p" }, { width: 1200 })).toContain("/w1200.webp");
  });

  test("caps the requested storage width at 1800, never asking for an upscaled rendition", () => {
    expect(imageUrl({ kind: "storage", path: "p" }, { width: 5000 })).toContain("/w1800.webp");
  });
});

describe("imageSrcSet", () => {
  test("builds an unsplash srcset across the default widths", () => {
    const srcSet = imageSrcSet(unsplash("abc123"));
    const parts = srcSet.split(", ");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toContain("480w");
    expect(parts[3]).toContain("1800w");
  });

  test("builds a storage srcset over every rendition width regardless of the widths argument", () => {
    const srcSet = imageSrcSet({ kind: "storage", path: "veh-1/img-1" }, {}, [100, 200]);
    for (const width of RENDITION_WIDTHS) {
      expect(srcSet).toContain(`w${width}.webp ${width}w`);
    }
  });
});

describe("sourceKey", () => {
  test("is stable per source and distinguishes unsplash from storage", () => {
    expect(sourceKey(unsplash("abc123"))).toBe(sourceKey(unsplash("abc123")));
    expect(sourceKey(unsplash("abc123"))).not.toBe(sourceKey({ kind: "storage", path: "abc123" }));
  });
});

function makeVehicle(images: Vehicle["images"]): Vehicle {
  return {
    id: "id",
    stockNumber: "HP0001",
    vinTail: "000001",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    price: 100_000,
    mileage: 10_000,
    bodyStyle: "Coupe",
    drivetrain: "RWD",
    powertrain: "Gasoline",
    transmission: "PDK",
    engine: "3.0L flat-six",
    horsepower: 400,
    torqueLbFt: 350,
    zeroToSixty: 3.5,
    topSpeedMph: 180,
    exteriorColor: "White",
    interiorColor: "Black",
    owners: 1,
    accidentFree: true,
    location: "Beverly Hills",
    characters: ["grand-touring"],
    highlights: [],
    story: "",
    images,
  };
}

describe("vehicleGallery", () => {
  test("returns an empty gallery when there are no photos", () => {
    expect(vehicleGallery(makeVehicle([]))).toEqual([]);
  });

  test("adds two synthetic detail crops of the hero shot when there are fewer than 3 photos", () => {
    const hero = { source: unsplash("hero"), alt: "Hero shot" };
    const gallery = vehicleGallery(makeVehicle([hero]));
    expect(gallery).toHaveLength(3);
    expect(gallery[0]?.source).toEqual(hero.source);
    expect(gallery[1]?.source).toEqual(hero.source);
    expect(gallery[2]?.source).toEqual(hero.source);
    expect(gallery[1]?.alt).toContain("Hero shot");
    expect(new Set(gallery.map(frame => frame.key)).size).toBe(3);
  });

  test("does not add synthetic crops once there are 3 or more real photos", () => {
    const images = [
      { source: unsplash("a"), alt: "a" },
      { source: unsplash("b"), alt: "b" },
      { source: { kind: "storage", path: "veh/1" } as const, alt: "c" },
    ];
    const gallery = vehicleGallery(makeVehicle(images));
    expect(gallery).toHaveLength(3);
    expect(gallery.map(frame => frame.alt)).toEqual(["a", "b", "c"]);
  });
});
