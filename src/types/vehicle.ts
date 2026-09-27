/**
 * Shared vehicle types and constants.
 *
 * This file is imported by both the server and the browser bundle, so it must stay
 * free of server-only imports (Supabase clients, Bun APIs, `./index.html`, etc.).
 */

// ---------------------------------------------------------------------------
// Makes
// ---------------------------------------------------------------------------

/**
 * The 25 highest-volume brands in the U.S. new-vehicle market (approximate 2024–25
 * rankings), alphabetized for display. This drives the admin make picker; it is NOT
 * the full set of makes a vehicle may have. Anything else goes in via "Other".
 */
export const POPULAR_MAKES = [
  "Acura",
  "Audi",
  "BMW",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Dodge",
  "Ford",
  "GMC",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Lexus",
  "Lincoln",
  "Mazda",
  "Mercedes-Benz",
  "Mitsubishi",
  "Nissan",
  "Ram",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
] as const;
export type PopularMake = (typeof POPULAR_MAKES)[number];

/**
 * A vehicle's make. Deliberately a plain string: the database is the source of truth,
 * and a dealer can stock makes outside POPULAR_MAKES (Porsche, Ferrari, ...).
 * Normalize with `canonicalMake()` before saving so filtering stays consistent.
 */
export type Make = string;

/** Common spellings admins type, mapped to the canonical make name. Keys are normalized. */
const MAKE_ALIASES: Readonly<Record<string, string>> = {
  chevy: "Chevrolet",
  mercedes: "Mercedes-Benz",
  "mercedes benz": "Mercedes-Benz",
  benz: "Mercedes-Benz",
  mb: "Mercedes-Benz",
  vw: "Volkswagen",
  "land-rover": "Land Rover",
  landrover: "Land Rover",
  "range rover": "Land Rover",
  "alfa-romeo": "Alfa Romeo",
  "rolls royce": "Rolls-Royce",
  "aston-martin": "Aston Martin",
};

const POPULAR_BY_KEY: ReadonlyMap<string, PopularMake> = new Map(
  POPULAR_MAKES.map((m) => [normalizeKey(m), m]),
);

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isPopularMake(value: string): value is PopularMake {
  return (POPULAR_MAKES as readonly string[]).includes(value);
}

/**
 * Turns admin input into the stored make name.
 *   "  chevy " -> "Chevrolet", "BMW" -> "BMW", "mercedes benz" -> "Mercedes-Benz"
 * Unknown makes are trimmed and whitespace-collapsed but otherwise kept as typed,
 * so "Porsche" stays "Porsche". Returns null for empty input.
 */
export function canonicalMake(input: string): Make | null {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (cleaned === "") return null;
  const key = normalizeKey(cleaned);
  return POPULAR_BY_KEY.get(key) ?? MAKE_ALIASES[key] ?? cleaned;
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

export const BODY_STYLES = [
  "SUV",
  "Pickup Truck",
  "Sedan",
  "Hatchback",
  "Coupe",
  "Convertible",
  "Wagon",
  "Minivan",
  "Van",
] as const;
export type BodyStyle = (typeof BODY_STYLES)[number];

export const DRIVETRAINS = ["FWD", "RWD", "AWD", "4WD"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];

export const POWERTRAINS = ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"] as const;
export type Powertrain = (typeof POWERTRAINS)[number];

/** Editorial tags used for curated collections on the public site. */
export const CHARACTERS = [
  "track",
  "grand-touring",
  "utility",
  "off-road",
  "family",
  "commuter",
  "luxury",
  "electric",
  "heritage",
  "hypercar",
] as const;
export type Character = (typeof CHARACTERS)[number];

/** Admin-controlled visibility. Only "published" vehicles reach the public site. */
export const VEHICLE_STATUSES = ["draft", "published", "sold"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/** Focal point: x/y in 0..1, z is zoom (1 = no zoom). */
export type ImageFocus = {
  x: number;
  y: number;
  z: number;
};

/**
 * Where a picture lives. Marketing imagery stays on Unsplash; vehicle photos are
 * admin uploads in Supabase Storage, stored as pre-sized WebP renditions under `path`
 * (see src/lib/storage-paths.ts).
 */
export type ImageSource = { kind: "unsplash"; photoId: string } | { kind: "storage"; path: string };

export type VehicleImage = {
  source: ImageSource;
  alt: string;
  focus?: ImageFocus;
  /** Intrinsic size of the original upload, when known. */
  width?: number;
  height?: number;
};

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

/** Public vehicle shape. `id` is the URL slug (e.g. "2024-porsche-911-gt3-rs-4f2a"). */
export type Vehicle = {
  id: string;
  stockNumber: string;
  vinTail: string;
  year: number;
  make: Make;
  model: string;
  trim: string;
  /** Asking price in whole U.S. dollars. */
  price: number;
  /** Odometer reading in miles. */
  mileage: number;
  bodyStyle: BodyStyle;
  drivetrain: Drivetrain;
  powertrain: Powertrain;
  /** Free-form description, e.g. "7-speed PDK" or "10-speed automatic". Null when not listed. */
  transmission: string | null;
  /** e.g. "4.0L flat-six" or "Dual-motor electric". Always present. */
  engine: string;
  horsepower: number | null;
  torqueLbFt: number | null;
  /** Seconds. Null when the manufacturer doesn't publish a figure. */
  zeroToSixty: number | null;
  topSpeedMph: number | null;
  exteriorColor: string;
  interiorColor: string;
  owners: number;
  accidentFree: boolean;
  location: string;
  characters: readonly Character[];
  highlights: readonly string[];
  story: string;
  images: readonly VehicleImage[];
  isNewArrival?: boolean;
  isFeatured?: boolean;
};

// ---------------------------------------------------------------------------
// Inventory facets
// ---------------------------------------------------------------------------

/** One entry in the public "filter by make" list, built from live inventory. */
export type MakeFacet = {
  make: Make;
  count: number;
};
