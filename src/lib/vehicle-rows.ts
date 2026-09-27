/**
 * Pure mapping between `public.vehicles` / `public.vehicle_images` rows (snake_case, as
 * postgrest returns them) and the shared VehicleInput / Vehicle shapes.
 */
import {
  BODY_STYLES,
  CHARACTERS,
  DRIVETRAINS,
  POWERTRAINS,
  VEHICLE_STATUSES,
  type BodyStyle,
  type Character,
  type Drivetrain,
  type Make,
  type Powertrain,
  type Vehicle,
  type VehicleImage,
  type VehicleStatus,
} from "@/types/vehicle";
import type { VehicleInput } from "./vehicle-validation";

/** Column lists for explicit `.select(...)` calls — never `select("*")`. Order matches VehicleRow. */
export const VEHICLE_COLUMNS =
  "id, slug, status, is_featured, is_new_arrival, display_order, stock_number, vin_tail, year, make, model, " +
  "trim, price, mileage, body_style, drivetrain, powertrain, transmission, engine, horsepower, torque_lb_ft, " +
  "zero_to_sixty, top_speed_mph, exterior_color, interior_color, owners, accident_free, location, characters, " +
  "highlights, story, created_by, created_at, updated_at";

export const VEHICLE_IMAGE_COLUMNS =
  "id, vehicle_id, path, sort_order, alt, focus_x, focus_y, focus_z, width, height, created_at";

export type VehicleRow = {
  id: string;
  slug: string;
  status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  display_order: number;
  stock_number: string;
  vin_tail: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  body_style: string;
  drivetrain: string;
  powertrain: string;
  transmission: string | null;
  engine: string;
  // Postgres `numeric`: may come back as a string over postgrest (see toNumber).
  horsepower: number | string | null;
  torque_lb_ft: number | string | null;
  zero_to_sixty: number | string | null;
  top_speed_mph: number | string | null;
  exterior_color: string;
  interior_color: string;
  owners: number;
  accident_free: boolean;
  location: string;
  characters: string[];
  highlights: string[];
  story: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleImageRow = {
  id: string;
  vehicle_id: string;
  path: string;
  sort_order: number;
  alt: string;
  focus_x: number | null;
  focus_y: number | null;
  focus_z: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

/**
 * Postgres `numeric` columns come back as strings over postgrest; plain rows may already be
 * numbers. Anything non-finite comes back as NaN, which the `Number.isFinite` checks reject.
 */
function toNumber(value: number | string): number {
  const num = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(num) ? num : NaN;
}

/** Same as toNumber, but null (no manufacturer figure) passes straight through. */
function toNullableNumber(value: number | string | null): number | null {
  return value === null ? null : toNumber(value);
}

export function inputToRow(
  input: VehicleInput,
): Omit<VehicleRow, "id" | "slug" | "created_by" | "created_at" | "updated_at"> {
  return {
    status: input.status,
    is_featured: input.isFeatured,
    is_new_arrival: input.isNewArrival,
    display_order: input.displayOrder,
    stock_number: input.stockNumber,
    vin_tail: input.vinTail,
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim,
    price: input.price,
    mileage: input.mileage,
    body_style: input.bodyStyle,
    drivetrain: input.drivetrain,
    powertrain: input.powertrain,
    transmission: input.transmission,
    engine: input.engine,
    horsepower: input.horsepower,
    torque_lb_ft: input.torqueLbFt,
    zero_to_sixty: input.zeroToSixty,
    top_speed_mph: input.topSpeedMph,
    exterior_color: input.exteriorColor,
    interior_color: input.interiorColor,
    owners: input.owners,
    accident_free: input.accidentFree,
    location: input.location,
    characters: input.characters,
    highlights: input.highlights,
    story: input.story,
  };
}

export function rowToInput(row: VehicleRow): VehicleInput {
  // Read before the guard, because a failed guard narrows `row` to `never`.
  const id = row.id;
  if (!isValidVehicleRow(row)) {
    throw new Error(`rowToInput: row ${id} failed validation (invalid enum, type, or non-finite number).`);
  }
  return {
    status: row.status as VehicleStatus,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    displayOrder: row.display_order,
    stockNumber: row.stock_number,
    vinTail: row.vin_tail,
    year: row.year,
    make: row.make as Make,
    model: row.model,
    trim: row.trim,
    price: row.price,
    mileage: row.mileage,
    bodyStyle: row.body_style as BodyStyle,
    drivetrain: row.drivetrain as Drivetrain,
    powertrain: row.powertrain as Powertrain,
    transmission: row.transmission,
    engine: row.engine,
    horsepower: toNullableNumber(row.horsepower),
    torqueLbFt: toNullableNumber(row.torque_lb_ft),
    zeroToSixty: toNullableNumber(row.zero_to_sixty),
    topSpeedMph: toNullableNumber(row.top_speed_mph),
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    owners: row.owners,
    accidentFree: row.accident_free,
    location: row.location,
    characters: row.characters as Character[],
    highlights: row.highlights,
    story: row.story ?? "",
  };
}

function isEnumValue<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** number or a numeric-looking string, always finite once run through toNumber(). */
function isFiniteNumericLike(value: unknown): value is number | string {
  if (isFiniteNumber(value)) return true;
  return typeof value === "string" && Number.isFinite(Number(value));
}

/** isFiniteNumericLike, but null (no manufacturer figure) is also accepted. */
function isFiniteNumericLikeOrNull(value: unknown): value is number | string | null {
  return value === null || isFiniteNumericLike(value);
}

/**
 * Shape, enum and finite-number check for a row from Postgres. The admin uses it to narrow
 * `unknown` data before rowToInput, and rowToVehicle uses it to skip corrupt rows.
 */
export function isValidVehicleRow(row: unknown): row is VehicleRow {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;

  if (typeof r.id !== "string" || typeof r.slug !== "string") return false;
  if (!isEnumValue(VEHICLE_STATUSES, r.status)) return false;
  if (typeof r.is_featured !== "boolean" || typeof r.is_new_arrival !== "boolean") return false;
  if (!isFiniteNumber(r.display_order)) return false;
  if (typeof r.stock_number !== "string" || typeof r.vin_tail !== "string") return false;
  if (!isFiniteNumber(r.year)) return false;
  if (!isNonEmptyString(r.make)) return false;
  if (typeof r.model !== "string" || typeof r.trim !== "string") return false;
  if (!isFiniteNumber(r.price) || !isFiniteNumber(r.mileage)) return false;
  if (!isEnumValue(BODY_STYLES, r.body_style)) return false;
  if (!isEnumValue(DRIVETRAINS, r.drivetrain)) return false;
  if (!isEnumValue(POWERTRAINS, r.powertrain)) return false;
  if (r.transmission !== null && typeof r.transmission !== "string") return false;
  if (typeof r.engine !== "string") return false;
  if (!isFiniteNumericLikeOrNull(r.horsepower)) return false;
  if (!isFiniteNumericLikeOrNull(r.torque_lb_ft)) return false;
  if (!isFiniteNumericLikeOrNull(r.top_speed_mph)) return false;
  if (!isFiniteNumericLikeOrNull(r.zero_to_sixty)) return false;
  if (typeof r.exterior_color !== "string" || typeof r.interior_color !== "string") return false;
  if (!isFiniteNumber(r.owners)) return false;
  if (typeof r.accident_free !== "boolean") return false;
  if (typeof r.location !== "string") return false;
  if (!Array.isArray(r.characters) || r.characters.some((c) => !isEnumValue(CHARACTERS, c))) return false;
  if (!Array.isArray(r.highlights) || r.highlights.some((h) => typeof h !== "string")) return false;
  if (r.story !== null && typeof r.story !== "string") return false;
  if (r.created_by !== null && typeof r.created_by !== "string") return false;
  if (typeof r.created_at !== "string" || typeof r.updated_at !== "string") return false;

  return true;
}

function rowToImage(row: VehicleImageRow): VehicleImage {
  const hasFullFocus = row.focus_x !== null && row.focus_y !== null && row.focus_z !== null;
  const image: VehicleImage = {
    source: { kind: "storage", path: row.path },
    alt: row.alt,
  };
  if (hasFullFocus) {
    // Non-null asserted by hasFullFocus above.
    image.focus = { x: row.focus_x as number, y: row.focus_y as number, z: row.focus_z as number };
  }
  if (row.width !== null) image.width = row.width;
  if (row.height !== null) image.height = row.height;
  return image;
}

/**
 * Returns null when a row fails isValidVehicleRow (enum-backed column no longer matches the
 * known set, wrong type, or a non-finite number — schema drift or corrupt data).
 */
export function rowToVehicle(row: VehicleRow, images: readonly VehicleImageRow[]): Vehicle | null {
  if (!isValidVehicleRow(row)) return null;

  // Deterministic order: sort_order first, then created_at, then id as a final tiebreaker so
  // rows with an identical sort_order (e.g. before a reorder) never shuffle between reads.
  const sortedImages = [...images]
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map(rowToImage);

  return {
    id: row.slug,
    stockNumber: row.stock_number,
    vinTail: row.vin_tail,
    year: row.year,
    // isValidVehicleRow already checked these enums; the cast only tells TypeScript.
    make: row.make as Make,
    model: row.model,
    trim: row.trim,
    price: row.price,
    mileage: row.mileage,
    bodyStyle: row.body_style as BodyStyle,
    drivetrain: row.drivetrain as Drivetrain,
    powertrain: row.powertrain as Powertrain,
    transmission: row.transmission,
    engine: row.engine,
    horsepower: toNullableNumber(row.horsepower),
    torqueLbFt: toNullableNumber(row.torque_lb_ft),
    zeroToSixty: toNullableNumber(row.zero_to_sixty),
    topSpeedMph: toNullableNumber(row.top_speed_mph),
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    owners: row.owners,
    accidentFree: row.accident_free,
    location: row.location,
    characters: row.characters as Character[],
    highlights: row.highlights,
    story: row.story ?? "",
    images: sortedImages,
    isNewArrival: row.is_new_arrival,
    isFeatured: row.is_featured,
  };
}
