/**
 * Pure mapping between the vehicle editor form and `VehicleInput`. The form is fully controlled:
 * every field lives in a `VehicleFormDefaults` state object, and these functions convert to and
 * from that shape.
 */
import { BODY_STYLES, DRIVETRAINS, POWERTRAINS } from "@/types/vehicle";
import type { VehicleInput } from "@/lib/vehicle-validation";

/** Mirrors the cap enforced by `validateVehicleInput` in src/lib/vehicle-validation.ts. */
export const MAX_HIGHLIGHTS = 8;

/** Every VehicleInput field, stringified for use as `defaultValue`/`defaultChecked` in the form. */
export type VehicleFormDefaults = {
  status: VehicleInput["status"];
  isFeatured: boolean;
  isNewArrival: boolean;
  displayOrder: string;
  stockNumber: string;
  vinTail: string;
  year: string;
  make: VehicleInput["make"];
  model: string;
  trim: string;
  price: string;
  mileage: string;
  bodyStyle: VehicleInput["bodyStyle"];
  drivetrain: VehicleInput["drivetrain"];
  powertrain: VehicleInput["powertrain"];
  transmission: string;
  engine: string;
  horsepower: string;
  torqueLbFt: string;
  zeroToSixty: string;
  topSpeedMph: string;
  exteriorColor: string;
  interiorColor: string;
  owners: string;
  accidentFree: boolean;
  location: string;
  characters: readonly VehicleInput["characters"][number][];
  highlights: readonly string[];
  story: string;
};

/** Defaults for a brand-new vehicle: draft, unfeatured, first enum option, empty text. */
export function emptyVehicleFormDefaults(): VehicleFormDefaults {
  return {
    status: "draft",
    isFeatured: false,
    isNewArrival: false,
    displayOrder: "0",
    stockNumber: "",
    vinTail: "",
    year: String(new Date().getFullYear()),
    make: "",
    model: "",
    trim: "",
    price: "",
    mileage: "",
    bodyStyle: BODY_STYLES[0],
    drivetrain: DRIVETRAINS[0],
    powertrain: POWERTRAINS[0],
    transmission: "",
    engine: "",
    horsepower: "",
    torqueLbFt: "",
    zeroToSixty: "",
    topSpeedMph: "",
    exteriorColor: "",
    interiorColor: "",
    owners: "0",
    accidentFree: true,
    location: "",
    characters: [],
    highlights: [],
    story: "",
  };
}

/** Converts a loaded VehicleInput (e.g. from `rowToInput`) into form defaults for editing. */
export function vehicleInputToFormDefaults(input: VehicleInput): VehicleFormDefaults {
  return {
    status: input.status,
    isFeatured: input.isFeatured,
    isNewArrival: input.isNewArrival,
    displayOrder: String(input.displayOrder),
    stockNumber: input.stockNumber,
    vinTail: input.vinTail,
    year: String(input.year),
    make: input.make,
    model: input.model,
    trim: input.trim,
    price: String(input.price),
    mileage: String(input.mileage),
    bodyStyle: input.bodyStyle,
    drivetrain: input.drivetrain,
    powertrain: input.powertrain,
    transmission: input.transmission ?? "",
    engine: input.engine,
    horsepower: input.horsepower !== null ? String(input.horsepower) : "",
    torqueLbFt: input.torqueLbFt !== null ? String(input.torqueLbFt) : "",
    zeroToSixty: input.zeroToSixty !== null ? String(input.zeroToSixty) : "",
    topSpeedMph: input.topSpeedMph !== null ? String(input.topSpeedMph) : "",
    exteriorColor: input.exteriorColor,
    interiorColor: input.interiorColor,
    owners: String(input.owners),
    accidentFree: input.accidentFree,
    location: input.location,
    characters: input.characters,
    highlights: input.highlights,
    story: input.story,
  };
}
