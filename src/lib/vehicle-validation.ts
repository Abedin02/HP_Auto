/**
 * Hand-rolled validation for the admin vehicle form (no schema library). Shared by the admin
 * form (client) and, indirectly, by anything that writes to `public.vehicles` — the database
 * CHECK constraints in supabase/migrations/ mirror these rules.
 */
import {
  BODY_STYLES,
  CHARACTERS,
  DRIVETRAINS,
  POWERTRAINS,
  VEHICLE_STATUSES,
  canonicalMake,
  type BodyStyle,
  type Character,
  type Drivetrain,
  type Make,
  type Powertrain,
  type VehicleStatus,
} from "@/types/vehicle";

export type VehicleInput = {
  status: VehicleStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  displayOrder: number;
  stockNumber: string;
  vinTail: string;
  year: number;
  make: Make;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  bodyStyle: BodyStyle;
  drivetrain: Drivetrain;
  powertrain: Powertrain;
  transmission: string | null;
  /** e.g. "4.0L flat-six". The one required Performance field. */
  engine: string;
  horsepower: number | null;
  torqueLbFt: number | null;
  zeroToSixty: number | null;
  topSpeedMph: number | null;
  exteriorColor: string;
  interiorColor: string;
  owners: number;
  accidentFree: boolean;
  location: string;
  characters: Character[];
  highlights: string[];
  story: string;
};

export type FieldErrors = Partial<Record<keyof VehicleInput, string>>;

export type VehicleValidation = { ok: true; value: VehicleInput } | { ok: false; errors: FieldErrors };

const MIN_YEAR = 1950;
const MAX_HIGHLIGHTS = 8;
const MAX_HIGHLIGHT_LENGTH = 140;
const MAX_STORY_LENGTH = 4000;
const MAX_STOCK_NUMBER_LENGTH = 40;
const MAX_SHORT_TEXT_LENGTH = 80;
const MAX_LOCATION_LENGTH = 100;
const MAX_MAKE_LENGTH = 40;
const VIN_TAIL_PATTERN = /^[A-Za-z0-9]{4,8}$/;

/** Empty string, null and undefined all mean "not provided" for the optional spec fields. */
function isBlank(value: unknown): value is "" | null | undefined {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** -0 is never a meaningful distinct value for any field here; normalise it away. */
function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? normalizeZero(value) : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? normalizeZero(parsed) : null;
  }
  return null;
}

function isEnumValue<T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

function ok<T>(value: T): FieldResult<T> {
  return { ok: true, value };
}

function err<T>(message: string): FieldResult<T> {
  return { ok: false, error: message };
}

/**
 * Reads a field's validated value, recording `errors[key]` and returning `fallback` instead
 * when the field failed. `fallback` is a real, concrete value of the field's own type — never
 * `undefined` — so an invalid field can never smuggle `undefined` into the final VehicleInput;
 * it is only ever read when `errors` is non-empty, at which point validateVehicleInput bails
 * out before constructing a value.
 */
function orDefault<T>(result: FieldResult<T>, fallback: T, errors: FieldErrors, key: keyof VehicleInput): T {
  if (result.ok) return result.value;
  errors[key] = result.error;
  return fallback;
}

function validateEnumField<T extends string>(
  allowed: readonly T[],
  value: unknown,
  label: string,
): FieldResult<T> {
  if (isEnumValue(allowed, value)) return ok(value);
  return err(`${label} must be one of: ${allowed.join(", ")}.`);
}

function validateTextField(value: unknown, max: number, label: string): FieldResult<string> {
  if (typeof value !== "string") return err(`${label} is required.`);
  const trimmed = value.trim();
  if (!trimmed) return err(`${label} is required.`);
  if (trimmed.length > max) return err(`${label} must be ${max} characters or fewer.`);
  return ok(trimmed);
}

function validateBooleanField(value: unknown, label: string): FieldResult<boolean> {
  if (typeof value === "boolean") return ok(value);
  return err(`${label} must be true or false.`);
}

function validateIntegerField(value: unknown, min: number, label: string): FieldResult<number> {
  const num = coerceNumber(value);
  if (num === null || !Number.isInteger(num) || num < min) {
    return err(`${label} must be a whole number${min === 0 ? " of 0 or more" : ` greater than ${min - 1}`}.`);
  }
  return ok(num);
}

function validatePositiveNumberField(value: unknown, label: string): FieldResult<number> {
  const num = coerceNumber(value);
  if (num === null || num <= 0) return err(`${label} must be a positive number.`);
  return ok(num);
}

function validateYearField(value: unknown): FieldResult<number> {
  const num = coerceNumber(value);
  const maxYear = new Date().getFullYear() + 1;
  if (num === null || !Number.isInteger(num) || num < MIN_YEAR || num > maxYear) {
    return err(`Year must be between ${MIN_YEAR} and ${maxYear}.`);
  }
  return ok(num);
}

function validateVinTail(value: unknown): FieldResult<string> {
  const text = typeof value === "string" ? value.trim() : "";
  if (!VIN_TAIL_PATTERN.test(text)) return err("VIN tail must be 4-8 letters or numbers.");
  return ok(text);
}

/** Required make: run through canonicalMake() (trims, collapses whitespace, maps aliases). */
function validateMake(value: unknown): FieldResult<Make> {
  if (typeof value !== "string") return err("Make is required.");
  const canonical = canonicalMake(value);
  if (canonical === null) return err("Make is required.");
  if (canonical.length > MAX_MAKE_LENGTH) return err(`Make must be ${MAX_MAKE_LENGTH} characters or fewer.`);
  return ok(canonical);
}

/** Optional free text (transmission): blank -> null, otherwise trimmed. No length or format rules. */
function validateOptionalText(value: unknown, label: string): FieldResult<string | null> {
  if (isBlank(value)) return ok(null);
  if (typeof value !== "string") return err(`${label} must be text.`);
  return ok(value.trim());
}

/**
 * Optional number (horsepower, torque, 0-60, top speed): blank -> null, otherwise any finite
 * number as entered. The only rule is that it is a number, since the column stores one.
 */
function validateOptionalNumber(value: unknown, label: string): FieldResult<number | null> {
  if (isBlank(value)) return ok(null);
  const num = coerceNumber(value);
  if (num === null) return err(`${label} must be a number.`);
  return ok(num);
}

function validateCharacters(value: unknown): FieldResult<Character[]> {
  if (!Array.isArray(value) || value.length === 0) return err("Pick at least one character tag.");
  const characters: Character[] = [];
  for (const item of value) {
    if (!isEnumValue(CHARACTERS, item)) return err("Unknown character tag.");
    characters.push(item);
  }
  return ok(characters);
}

function validateHighlights(value: unknown): FieldResult<string[]> {
  if (value === undefined) return ok([]);
  if (!Array.isArray(value) || value.length > MAX_HIGHLIGHTS) {
    return err(`Highlights allow at most ${MAX_HIGHLIGHTS} items.`);
  }
  const highlights: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return err("Each highlight must be text.");
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > MAX_HIGHLIGHT_LENGTH) {
      return err(`Each highlight must be 1-${MAX_HIGHLIGHT_LENGTH} characters.`);
    }
    highlights.push(trimmed);
  }
  return ok(highlights);
}

function validateStory(value: unknown): FieldResult<string> {
  if (value === undefined) return ok("");
  if (typeof value !== "string") return err("Story must be text.");
  const trimmed = value.trim();
  if (trimmed.length > MAX_STORY_LENGTH) return err(`Story must be ${MAX_STORY_LENGTH} characters or fewer.`);
  return ok(trimmed);
}

export function validateVehicleInput(raw: unknown): VehicleValidation {
  if (!isRecord(raw)) return { ok: false, errors: {} };

  // Assign-as-you-go: every field is validated and immediately unwrapped via `orDefault`, whose
  // fallback is a real value of the correct type (never `undefined`). Errors accumulate as a
  // side effect so every field gets checked (not just the first failure), and the fallbacks are
  // only ever read when `errors` is non-empty below — at which point we return before touching
  // them. Nothing here casts `unknown`/`undefined` through as any of these field types.
  const errors: FieldErrors = {};

  const status = orDefault(validateEnumField(VEHICLE_STATUSES, raw.status, "Status"), "draft", errors, "status");
  const isFeatured = orDefault(validateBooleanField(raw.isFeatured, "Featured"), false, errors, "isFeatured");
  const isNewArrival = orDefault(
    validateBooleanField(raw.isNewArrival, "New arrival"),
    false,
    errors,
    "isNewArrival",
  );
  const displayOrder = orDefault(
    validateIntegerField(raw.displayOrder, 0, "Display order"),
    0,
    errors,
    "displayOrder",
  );
  const stockNumber = orDefault(
    validateTextField(raw.stockNumber, MAX_STOCK_NUMBER_LENGTH, "Stock number"),
    "",
    errors,
    "stockNumber",
  );
  const vinTail = orDefault(validateVinTail(raw.vinTail), "", errors, "vinTail");
  const year = orDefault(validateYearField(raw.year), MIN_YEAR, errors, "year");
  const make = orDefault(validateMake(raw.make), "", errors, "make");
  const model = orDefault(validateTextField(raw.model, MAX_SHORT_TEXT_LENGTH, "Model"), "", errors, "model");
  const trim = orDefault(validateTextField(raw.trim, MAX_SHORT_TEXT_LENGTH, "Trim"), "", errors, "trim");
  const price = orDefault(validatePositiveNumberField(raw.price, "Price"), 0, errors, "price");
  const mileage = orDefault(validateIntegerField(raw.mileage, 0, "Mileage"), 0, errors, "mileage");
  const bodyStyle = orDefault(
    validateEnumField(BODY_STYLES, raw.bodyStyle, "Body style"),
    "Coupe",
    errors,
    "bodyStyle",
  );
  const drivetrain = orDefault(
    validateEnumField(DRIVETRAINS, raw.drivetrain, "Drivetrain"),
    "RWD",
    errors,
    "drivetrain",
  );
  const powertrain = orDefault(
    validateEnumField(POWERTRAINS, raw.powertrain, "Powertrain"),
    "Gasoline",
    errors,
    "powertrain",
  );
  const transmission = orDefault(validateOptionalText(raw.transmission, "Transmission"), null, errors, "transmission");
  const engine = orDefault(validateTextField(raw.engine, MAX_SHORT_TEXT_LENGTH, "Engine"), "", errors, "engine");
  const horsepower = orDefault(validateOptionalNumber(raw.horsepower, "Horsepower"), null, errors, "horsepower");
  const torqueLbFt = orDefault(validateOptionalNumber(raw.torqueLbFt, "Torque"), null, errors, "torqueLbFt");
  const zeroToSixty = orDefault(validateOptionalNumber(raw.zeroToSixty, "0-60 time"), null, errors, "zeroToSixty");
  const topSpeedMph = orDefault(validateOptionalNumber(raw.topSpeedMph, "Top speed"), null, errors, "topSpeedMph");
  const exteriorColor = orDefault(
    validateTextField(raw.exteriorColor, MAX_SHORT_TEXT_LENGTH, "Exterior color"),
    "",
    errors,
    "exteriorColor",
  );
  const interiorColor = orDefault(
    validateTextField(raw.interiorColor, MAX_SHORT_TEXT_LENGTH, "Interior color"),
    "",
    errors,
    "interiorColor",
  );
  const owners = orDefault(validateIntegerField(raw.owners, 0, "Owners"), 0, errors, "owners");
  const accidentFree = orDefault(
    validateBooleanField(raw.accidentFree, "Accident-free"),
    false,
    errors,
    "accidentFree",
  );
  const location = orDefault(
    validateTextField(raw.location, MAX_LOCATION_LENGTH, "Location"),
    "",
    errors,
    "location",
  );
  const characters = orDefault(validateCharacters(raw.characters), [], errors, "characters");
  const highlights = orDefault(validateHighlights(raw.highlights), [], errors, "highlights");
  const story = orDefault(validateStory(raw.story), "", errors, "story");

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      status,
      isFeatured,
      isNewArrival,
      displayOrder,
      stockNumber,
      vinTail,
      year,
      make,
      model,
      trim,
      price,
      mileage,
      bodyStyle,
      drivetrain,
      powertrain,
      transmission,
      engine,
      horsepower,
      torqueLbFt,
      zeroToSixty,
      topSpeedMph,
      exteriorColor,
      interiorColor,
      owners,
      accidentFree,
      location,
      characters,
      highlights,
      story,
    },
  };
}

/** Lowercase, ascii-folds accents, and turns everything else into single dashes. */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const MAX_SLUG_LENGTH = 80;

/**
 * `${year}-${make}-${model}-${trim}-${suffix}`, always matching ^[0-9]{4}-[a-z0-9-]+$.
 * `v` is expected to already be validated (year is a plain 4-digit number).
 */
export function vehicleSlug(v: Pick<VehicleInput, "year" | "make" | "model" | "trim">, suffix: string): string {
  const year = String(Math.trunc(v.year));
  const suffixSlug = slugify(suffix) || "0000";
  const rest = [slugify(v.make), slugify(v.model), slugify(v.trim)].filter(Boolean).join("-");
  const base = rest ? `${year}-${rest}` : year;

  const maxBaseLength = Math.max(year.length, MAX_SLUG_LENGTH - suffixSlug.length - 1);
  const truncatedBase = base.length > maxBaseLength ? base.slice(0, maxBaseLength) : base;

  return `${truncatedBase}-${suffixSlug}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}
