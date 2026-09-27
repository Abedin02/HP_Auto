import { describe, expect, test } from "bun:test";
import { validateVehicleInput, vehicleSlug, type VehicleInput } from "./vehicle-validation";

/** A minimal valid payload, reused and tweaked per test. */
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: "draft",
    isFeatured: false,
    isNewArrival: false,
    displayOrder: 0,
    stockNumber: "HP-1001",
    vinTail: "A1B2C3",
    year: 2024,
    make: "Porsche",
    model: "911",
    trim: "GT3 RS",
    price: 250000,
    mileage: 1200,
    bodyStyle: "Coupe",
    drivetrain: "RWD",
    powertrain: "Gasoline",
    transmission: "7-speed PDK",
    engine: "4.0L Flat-Six",
    horsepower: 518,
    torqueLbFt: 343,
    zeroToSixty: 3.0,
    topSpeedMph: 184,
    exteriorColor: "Shark Blue",
    interiorColor: "Black Leather",
    owners: 1,
    accidentFree: true,
    location: "Miami, FL",
    characters: ["track"],
    highlights: ["Carbon ceramic brakes"],
    story: "A pristine example.",
    ...overrides,
  };
}

describe("validateVehicleInput", () => {
  test("accepts a fully valid payload", () => {
    const result = validateVehicleInput(validPayload());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.make).toBe("Porsche");
    expect(result.value.zeroToSixty).toBe(3.0);
  });

  test("rejects non-object input", () => {
    expect(validateVehicleInput(null).ok).toBe(false);
    expect(validateVehicleInput("nope").ok).toBe(false);
    expect(validateVehicleInput(42).ok).toBe(false);
  });

  test("coerces numeric strings from form inputs", () => {
    const result = validateVehicleInput(
      validPayload({
        displayOrder: "3",
        price: "250000",
        mileage: "1200",
        horsepower: "518",
        torqueLbFt: "343",
        topSpeedMph: "184",
        owners: "1",
        zeroToSixty: "3.4",
        year: "2024",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.price).toBe(250000);
    expect(result.value.zeroToSixty).toBe(3.4);
    expect(result.value.year).toBe(2024);
  });

  test("trims surrounding whitespace from strings", () => {
    const result = validateVehicleInput(validPayload({ model: "  911  " }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.model).toBe("911");
  });

  test("rejects overlong text fields instead of silently truncating them", () => {
    const overlongStock = validateVehicleInput(validPayload({ stockNumber: "x".repeat(41) }));
    expect(overlongStock.ok).toBe(false);
    if (!overlongStock.ok) expect(overlongStock.errors.stockNumber).toBeDefined();

    const overlongModel = validateVehicleInput(validPayload({ model: "x".repeat(81) }));
    expect(overlongModel.ok).toBe(false);
    if (!overlongModel.ok) expect(overlongModel.errors.model).toBeDefined();

    const overlongLocation = validateVehicleInput(validPayload({ location: "x".repeat(101) }));
    expect(overlongLocation.ok).toBe(false);
    if (!overlongLocation.ok) expect(overlongLocation.errors.location).toBeDefined();

    const overlongStory = validateVehicleInput(validPayload({ story: "x".repeat(4001) }));
    expect(overlongStory.ok).toBe(false);
    if (!overlongStory.ok) expect(overlongStory.errors.story).toBeDefined();
  });

  test("accepts text fields right at their length cap", () => {
    const result = validateVehicleInput(validPayload({ stockNumber: "x".repeat(40), story: "y".repeat(4000) }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.stockNumber.length).toBe(40);
    expect(result.value.story.length).toBe(4000);
  });

  test("normalises negative zero to zero for numeric fields", () => {
    const result = validateVehicleInput(validPayload({ displayOrder: -0, mileage: -0, owners: -0 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.is(result.value.displayOrder, 0)).toBe(true);
    expect(Object.is(result.value.mileage, 0)).toBe(true);
    expect(Object.is(result.value.owners, 0)).toBe(true);
  });

  test("normalises a numeric-string negative zero to zero", () => {
    const result = validateVehicleInput(validPayload({ displayOrder: "-0" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.is(result.value.displayOrder, 0)).toBe(true);
  });

  test("rejects unknown enum values", () => {
    const result = validateVehicleInput(validPayload({ bodyStyle: "Blimp" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.bodyStyle).toBeDefined();
  });

  test("rejects a year outside the valid range", () => {
    const tooOld = validateVehicleInput(validPayload({ year: 1900 }));
    expect(tooOld.ok).toBe(false);
    if (!tooOld.ok) expect(tooOld.errors.year).toBeDefined();

    const tooNew = validateVehicleInput(validPayload({ year: new Date().getFullYear() + 5 }));
    expect(tooNew.ok).toBe(false);
  });

  test("requires at least one character tag from the known set", () => {
    const empty = validateVehicleInput(validPayload({ characters: [] }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.errors.characters).toBeDefined();

    const bad = validateVehicleInput(validPayload({ characters: ["spaceship"] }));
    expect(bad.ok).toBe(false);
  });

  test("caps highlights at 8 items of 140 chars each", () => {
    const tooMany = validateVehicleInput(validPayload({ highlights: Array.from({ length: 9 }, (_, i) => `h${i}`) }));
    expect(tooMany.ok).toBe(false);
    if (!tooMany.ok) expect(tooMany.errors.highlights).toBeDefined();

    const tooLong = validateVehicleInput(validPayload({ highlights: ["x".repeat(141)] }));
    expect(tooLong.ok).toBe(false);
  });

  test("requires vinTail to be 4-8 alphanumeric characters", () => {
    expect(validateVehicleInput(validPayload({ vinTail: "AB" })).ok).toBe(false);
    expect(validateVehicleInput(validPayload({ vinTail: "TOOLONGVIN" })).ok).toBe(false);
    expect(validateVehicleInput(validPayload({ vinTail: "AB-12" })).ok).toBe(false);
    expect(validateVehicleInput(validPayload({ vinTail: "ab12cd" })).ok).toBe(true);
  });

  test("collects multiple field errors at once", () => {
    const result = validateVehicleInput(validPayload({ bodyStyle: "Blimp", price: -5, characters: [] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.bodyStyle).toBeDefined();
    expect(result.errors.price).toBeDefined();
    expect(result.errors.characters).toBeDefined();
  });

  test("rejects non-boolean flags", () => {
    expect(validateVehicleInput(validPayload({ isFeatured: "true" })).ok).toBe(false);
    expect(validateVehicleInput(validPayload({ accidentFree: 1 })).ok).toBe(false);
  });

  describe("make", () => {
    test("is required", () => {
      const blank = validateVehicleInput(validPayload({ make: "" }));
      expect(blank.ok).toBe(false);
      if (!blank.ok) expect(blank.errors.make).toBeDefined();

      const whitespace = validateVehicleInput(validPayload({ make: "   " }));
      expect(whitespace.ok).toBe(false);

      const missing = validateVehicleInput(validPayload({ make: undefined }));
      expect(missing.ok).toBe(false);
    });

    test("is run through canonicalMake(), normalising known aliases and casing", () => {
      const result = validateVehicleInput(validPayload({ make: " chevy " }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.make).toBe("Chevrolet");
    });

    test("accepts a make outside POPULAR_MAKES unchanged (besides trimming)", () => {
      const result = validateVehicleInput(validPayload({ make: "Bugatti" }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.make).toBe("Bugatti");
    });

    test("rejects a make over 40 characters", () => {
      const result = validateVehicleInput(validPayload({ make: "x".repeat(41) }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors.make).toBeDefined();
    });

    test("accepts a make right at the 40-character cap", () => {
      const result = validateVehicleInput(validPayload({ make: "x".repeat(40) }));
      expect(result.ok).toBe(true);
    });
  });

  describe("performance fields", () => {
    test("requires an engine", () => {
      for (const engine of ["", "   ", null, undefined, 42]) {
        const result = validateVehicleInput(validPayload({ engine }));
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.errors.engine).toBeDefined();
      }
    });

    test("keeps a present engine string, trimmed", () => {
      const result = validateVehicleInput(validPayload({ engine: "  4.0L Flat-Six  " }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.engine).toBe("4.0L Flat-Six");
    });

    test("maps empty, whitespace-only, null and undefined to null for the optional specs", () => {
      const result = validateVehicleInput(
        validPayload({ transmission: "  ", horsepower: null, torqueLbFt: "", zeroToSixty: undefined, topSpeedMph: " " }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.transmission).toBeNull();
      expect(result.value.horsepower).toBeNull();
      expect(result.value.torqueLbFt).toBeNull();
      expect(result.value.zeroToSixty).toBeNull();
      expect(result.value.topSpeedMph).toBeNull();
    });

    test("accepts any filled-in number as entered: zero, negative, or with extra decimals", () => {
      const result = validateVehicleInput(
        validPayload({ horsepower: "518.5", torqueLbFt: 0, zeroToSixty: 3.45, topSpeedMph: -1 }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.horsepower).toBe(518.5);
      expect(result.value.torqueLbFt).toBe(0);
      expect(result.value.zeroToSixty).toBe(3.45);
      expect(result.value.topSpeedMph).toBe(-1);
    });

    test("accepts a transmission of any length", () => {
      const result = validateVehicleInput(validPayload({ transmission: "x".repeat(500) }));
      expect(result.ok).toBe(true);
    });

    test("still rejects a spec that is not a number at all", () => {
      const result = validateVehicleInput(validPayload({ horsepower: "lots" }));
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors.horsepower).toBeDefined();
    });
  });
});

describe("vehicleSlug", () => {
  const base: Pick<VehicleInput, "year" | "make" | "model" | "trim"> = {
    year: 2024,
    make: "Porsche",
    model: "911",
    trim: "GT3 RS",
  };

  test("builds a lowercase, ascii-folded, dash-separated slug", () => {
    const slug = vehicleSlug(base, "4f2a");
    expect(slug).toBe("2024-porsche-911-gt3-rs-4f2a");
  });

  test("always matches the year-prefixed slug pattern", () => {
    expect(vehicleSlug(base, "4f2a")).toMatch(/^[0-9]{4}-[a-z0-9-]+$/);
  });

  test("ascii-folds accented characters", () => {
    const accented = vehicleSlug({ year: 2024, make: "Porsche", model: "Événement", trim: "Édition" }, "1a2b");
    expect(accented).toMatch(/^[0-9]{4}-[a-z0-9-]+$/);
    expect(accented).not.toMatch(/[éÉ]/);
  });

  test("collapses non-alphanumerics and repeated dashes", () => {
    const slug = vehicleSlug({ year: 2024, make: "Mercedes-AMG", model: "  G 63  ", trim: "AMG!!" }, "zzzz");
    expect(slug).toMatch(/^[0-9]{4}-[a-z0-9-]+$/);
    expect(slug).not.toMatch(/--/);
    expect(slug.startsWith("-")).toBe(false);
    expect(slug.endsWith("-")).toBe(false);
  });

  test("truncates very long inputs sensibly while keeping the suffix", () => {
    const slug = vehicleSlug(
      { year: 2024, make: "Lamborghini", model: "x".repeat(200), trim: "y".repeat(200) },
      "9z8y",
    );
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("9z8y")).toBe(true);
    expect(slug).toMatch(/^[0-9]{4}-[a-z0-9-]+$/);
  });
});
