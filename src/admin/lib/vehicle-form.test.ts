import { describe, expect, test } from "bun:test";
import type { VehicleInput } from "@/lib/vehicle-validation";
import { emptyVehicleFormDefaults, MAX_HIGHLIGHTS, vehicleInputToFormDefaults } from "./vehicle-form";

const FULL_INPUT: VehicleInput = {
  status: "published",
  isFeatured: true,
  isNewArrival: false,
  displayOrder: 3,
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
  characters: ["track", "heritage"],
  highlights: ["Carbon ceramic brakes", "Front-axle lift"],
  story: "A pristine example.",
};

describe("emptyVehicleFormDefaults", () => {
  test("provides sensible blank-form defaults", () => {
    const defaults = emptyVehicleFormDefaults();
    expect(defaults.status).toBe("draft");
    expect(defaults.isFeatured).toBe(false);
    expect(defaults.characters).toEqual([]);
    expect(defaults.highlights).toEqual([]);
    expect(defaults.owners).toBe("0");
    expect(Number(defaults.year)).toBeGreaterThan(2000);
    expect(defaults.make).toBe("");
  });

  test("leaves the optional performance fields blank", () => {
    const defaults = emptyVehicleFormDefaults();
    expect(defaults.transmission).toBe("");
    expect(defaults.horsepower).toBe("");
    expect(defaults.torqueLbFt).toBe("");
    expect(defaults.zeroToSixty).toBe("");
    expect(defaults.topSpeedMph).toBe("");
  });
});

describe("vehicleInputToFormDefaults", () => {
  test("stringifies numeric fields and preserves arrays/booleans", () => {
    const defaults = vehicleInputToFormDefaults(FULL_INPUT);
    expect(defaults.price).toBe("250000");
    expect(defaults.zeroToSixty).toBe("3");
    expect(defaults.isFeatured).toBe(true);
    expect(defaults.characters).toEqual(["track", "heritage"]);
    expect(defaults.highlights).toEqual(["Carbon ceramic brakes", "Front-axle lift"]);
    expect(defaults.make).toBe("Porsche");
  });

  test("maps null optional performance fields to a blank string, not the string 'null'", () => {
    const withNulls: VehicleInput = {
      ...FULL_INPUT,
      transmission: null,
      horsepower: null,
      torqueLbFt: null,
      zeroToSixty: null,
      topSpeedMph: null,
    };
    const defaults = vehicleInputToFormDefaults(withNulls);
    expect(defaults.transmission).toBe("");
    expect(defaults.horsepower).toBe("");
    expect(defaults.engine).toBe("4.0L Flat-Six");
    expect(defaults.torqueLbFt).toBe("");
    expect(defaults.zeroToSixty).toBe("");
    expect(defaults.topSpeedMph).toBe("");
  });
});

describe("MAX_HIGHLIGHTS", () => {
  test("matches the server-side cap of 8", () => {
    expect(MAX_HIGHLIGHTS).toBe(8);
  });
});
