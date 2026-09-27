import { describe, expect, test } from "bun:test";
import type { VehicleInput } from "./vehicle-validation";
import {
  inputToRow,
  isValidVehicleRow,
  rowToInput,
  rowToVehicle,
  VEHICLE_COLUMNS,
  VEHICLE_IMAGE_COLUMNS,
  type VehicleImageRow,
  type VehicleRow,
} from "./vehicle-rows";

const input: VehicleInput = {
  status: "published",
  isFeatured: true,
  isNewArrival: false,
  displayOrder: 2,
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
};

function makeRow(overrides: Partial<VehicleRow> = {}): VehicleRow {
  const partial = inputToRow(input);
  return {
    ...partial,
    id: "11111111-1111-1111-1111-111111111111",
    slug: "2024-porsche-911-gt3-rs-4f2a",
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const image: VehicleImageRow = {
  id: "22222222-2222-2222-2222-222222222222",
  vehicle_id: "11111111-1111-1111-1111-111111111111",
  path: "11111111-1111-1111-1111-111111111111/33333333-3333-3333-3333-333333333333",
  sort_order: 0,
  alt: "Front three-quarter",
  focus_x: 0.5,
  focus_y: 0.4,
  focus_z: 1.2,
  width: 1800,
  height: 1200,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("inputToRow / rowToInput round trip", () => {
  test("recovers the original input from its row", () => {
    const row = makeRow();
    expect(rowToInput(row)).toEqual(input);
  });

  test("converts numeric strings coming back from Postgres numeric columns", () => {
    const row = makeRow({ zero_to_sixty: "3.0" as unknown as number });
    expect(rowToInput(row).zeroToSixty).toBe(3.0);
  });

  test("round-trips null through the optional spec columns", () => {
    const nullableInput: VehicleInput = {
      ...input,
      transmission: null,
      horsepower: null,
      torqueLbFt: null,
      zeroToSixty: null,
      topSpeedMph: null,
    };
    const row = makeRow(inputToRow(nullableInput));
    expect(rowToInput(row)).toEqual(nullableInput);
  });
});

describe("rowToVehicle", () => {
  test("builds a public Vehicle from a row and its images", () => {
    const row = makeRow();
    const vehicle = rowToVehicle(row, [image]);
    expect(vehicle).not.toBeNull();
    expect(vehicle?.id).toBe(row.slug);
    expect(vehicle?.make).toBe("Porsche");
    expect(vehicle?.isFeatured).toBe(true);
    expect(vehicle?.images).toHaveLength(1);
    expect(vehicle?.images[0]?.source).toEqual({ kind: "storage", path: image.path });
    expect(vehicle?.images[0]?.focus).toEqual({ x: 0.5, y: 0.4, z: 1.2 });
  });

  test("returns null when make is empty", () => {
    const row = makeRow({ make: "" });
    expect(rowToVehicle(row, [])).toBeNull();
  });

  test("returns null for any invalid enum column", () => {
    expect(rowToVehicle(makeRow({ body_style: "Blimp" }), [])).toBeNull();
    expect(rowToVehicle(makeRow({ drivetrain: "2WD" }), [])).toBeNull();
    expect(rowToVehicle(makeRow({ powertrain: "Nuclear" }), [])).toBeNull();
  });

  test("sorts images by sort_order", () => {
    const second: VehicleImageRow = { ...image, id: "second", sort_order: 1, path: "v/second" };
    const row = makeRow();
    const vehicle = rowToVehicle(row, [second, image]);
    expect(vehicle?.images.map((img) => img.source)).toEqual([
      { kind: "storage", path: image.path },
      { kind: "storage", path: "v/second" },
    ]);
  });

  test("only sets focus when all three focus values are present", () => {
    const row = makeRow();
    const partialFocus: VehicleImageRow = { ...image, focus_y: null };
    const vehicle = rowToVehicle(row, [partialFocus]);
    expect(vehicle?.images[0]?.focus).toBeUndefined();
  });

  test("omits width/height when null", () => {
    const row = makeRow();
    const noDims: VehicleImageRow = { ...image, width: null, height: null };
    const vehicle = rowToVehicle(row, [noDims]);
    expect(vehicle?.images[0]?.width).toBeUndefined();
    expect(vehicle?.images[0]?.height).toBeUndefined();
  });

  test("returns null when a numeric column is NaN", () => {
    const row = makeRow({ zero_to_sixty: NaN });
    expect(rowToVehicle(row, [])).toBeNull();
  });

  test("returns null when a numeric column is Infinity", () => {
    const row = makeRow({ price: Number.POSITIVE_INFINITY });
    expect(rowToVehicle(row, [])).toBeNull();
  });

  test("accepts null for the optional spec columns", () => {
    const row = makeRow({ transmission: null, horsepower: null, torque_lb_ft: null, zero_to_sixty: null, top_speed_mph: null });
    const vehicle = rowToVehicle(row, []);
    expect(vehicle).not.toBeNull();
    expect(vehicle?.transmission).toBeNull();
    expect(vehicle?.horsepower).toBeNull();
    expect(vehicle?.torqueLbFt).toBeNull();
    expect(vehicle?.zeroToSixty).toBeNull();
    expect(vehicle?.topSpeedMph).toBeNull();
  });

  test("converts numeric spec columns returned as strings into numbers", () => {
    const row = makeRow({ horsepower: "518.5", torque_lb_ft: "343", zero_to_sixty: "3.45", top_speed_mph: "184" });
    const vehicle = rowToVehicle(row, []);
    expect(vehicle?.horsepower).toBe(518.5);
    expect(vehicle?.torqueLbFt).toBe(343);
    expect(vehicle?.zeroToSixty).toBe(3.45);
    expect(vehicle?.topSpeedMph).toBe(184);
  });

  test("accepts any non-empty make", () => {
    const row = makeRow({ make: "Bugatti" });
    expect(rowToVehicle(row, [])?.make).toBe("Bugatti");
  });

  test("breaks a sort_order tie using created_at, then id", () => {
    const tiedOlder: VehicleImageRow = {
      ...image,
      id: "a-tied",
      sort_order: 0,
      path: "v/older",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const tiedNewer: VehicleImageRow = {
      ...image,
      id: "b-tied",
      sort_order: 0,
      path: "v/newer",
      created_at: "2026-01-02T00:00:00.000Z",
    };
    const row = makeRow();
    const vehicle = rowToVehicle(row, [tiedNewer, tiedOlder]);
    expect(vehicle?.images.map((img) => img.source)).toEqual([
      { kind: "storage", path: "v/older" },
      { kind: "storage", path: "v/newer" },
    ]);
  });
});

describe("isValidVehicleRow", () => {
  test("accepts a well-formed row", () => {
    expect(isValidVehicleRow(makeRow())).toBe(true);
  });

  test("rejects non-object input", () => {
    expect(isValidVehicleRow(null)).toBe(false);
    expect(isValidVehicleRow("nope")).toBe(false);
    expect(isValidVehicleRow(undefined)).toBe(false);
  });

  test("rejects a row with the wrong type for a field", () => {
    expect(isValidVehicleRow({ ...makeRow(), is_featured: "yes" })).toBe(false);
  });

  test("rejects a row with a non-finite numeric field", () => {
    expect(isValidVehicleRow({ ...makeRow(), mileage: NaN })).toBe(false);
    expect(isValidVehicleRow({ ...makeRow(), horsepower: Number.POSITIVE_INFINITY })).toBe(false);
  });

  test("rejects a row with an unknown character tag", () => {
    expect(isValidVehicleRow({ ...makeRow(), characters: ["spaceship"] })).toBe(false);
  });

  test("accepts null for the optional spec columns", () => {
    expect(
      isValidVehicleRow({
        ...makeRow(),
        transmission: null,
        horsepower: null,
        torque_lb_ft: null,
        zero_to_sixty: null,
        top_speed_mph: null,
      }),
    ).toBe(true);
  });

  test("rejects an empty make, but accepts any other non-empty make", () => {
    expect(isValidVehicleRow({ ...makeRow(), make: "" })).toBe(false);
    expect(isValidVehicleRow({ ...makeRow(), make: "Bugatti" })).toBe(true);
    expect(isValidVehicleRow({ ...makeRow(), make: "Yugo" })).toBe(true);
  });
});

describe("VEHICLE_COLUMNS / VEHICLE_IMAGE_COLUMNS", () => {
  test("list exactly the VehicleRow field names, for explicit .select() calls", () => {
    const columns = VEHICLE_COLUMNS.split(",").map((c) => c.trim());
    expect(columns.sort()).toEqual(Object.keys(makeRow()).sort());
  });

  test("list exactly the VehicleImageRow field names", () => {
    const columns = VEHICLE_IMAGE_COLUMNS.split(",").map((c) => c.trim());
    expect(columns.sort()).toEqual(Object.keys(image).sort());
  });
});
