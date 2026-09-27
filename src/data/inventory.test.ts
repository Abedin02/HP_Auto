import { describe, expect, test } from "bun:test";
import { CHARACTERS } from "@/types/vehicle";
import type { Vehicle } from "@/types/vehicle";
import { CHARACTER_META, getFeaturedVehicles, getSimilarVehicles } from "./inventory";

function makeVehicle(overrides: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    stockNumber: `HP-${overrides.id}`,
    vinTail: "000000",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    price: 100_000,
    mileage: 5_000,
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
    images: [],
    ...overrides,
  };
}

describe("CHARACTER_META", () => {
  test("has metadata for every character, keyed to itself, with a photo id", () => {
    for (const character of CHARACTERS) {
      expect(CHARACTER_META[character].key).toBe(character);
      expect(CHARACTER_META[character].photoId.length).toBeGreaterThan(0);
    }
  });
});

describe("getFeaturedVehicles", () => {
  test("returns only vehicles flagged as featured, preserving pool order", () => {
    const a = makeVehicle({ id: "a", isFeatured: true });
    const b = makeVehicle({ id: "b" });
    const c = makeVehicle({ id: "c", isFeatured: true });
    expect(getFeaturedVehicles([a, b, c]).map(v => v.id)).toEqual(["a", "c"]);
  });

  test("returns an empty array when nothing is featured", () => {
    expect(getFeaturedVehicles([makeVehicle({ id: "a" })])).toEqual([]);
  });

  test("returns an empty array for an empty pool", () => {
    expect(getFeaturedVehicles([])).toEqual([]);
  });
});

describe("getSimilarVehicles", () => {
  const gt3 = makeVehicle({ id: "gt3", make: "Porsche", price: 320_000, characters: ["track"] });
  const turboS = makeVehicle({ id: "turbo-s", make: "Porsche", price: 300_000, characters: ["grand-touring"] });
  const m4 = makeVehicle({ id: "m4", make: "BMW", price: 90_000, characters: ["track"] });
  const gclass = makeVehicle({ id: "g63", make: "Mercedes-AMG", price: 200_000, characters: ["utility"] });
  const pool = [gt3, turboS, m4, gclass];

  test("excludes the target and respects the limit", () => {
    const similar = getSimilarVehicles(gt3, 2, pool);
    expect(similar).toHaveLength(2);
    expect(similar.some(v => v.id === gt3.id)).toBe(false);
  });

  test("prefers the same make, then a shared character, then the closest price", () => {
    const similar = getSimilarVehicles(gt3, 3, pool);
    expect(similar.map(v => v.id)).toEqual(["turbo-s", "m4", "g63"]);
  });

  test("returns an empty array when the pool has nothing but the target", () => {
    expect(getSimilarVehicles(gt3, 3, [gt3])).toEqual([]);
  });
});
