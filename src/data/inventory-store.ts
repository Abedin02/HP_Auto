/**
 * Public-site inventory store: fetches GET /api/vehicles once, shares the result across every
 * consumer (see src/hooks/use-inventory.ts), and exposes a useSyncExternalStore-friendly
 * subscribe/getSnapshot pair (mirrors the pattern in src/hooks/use-garage.ts).
 */
import {
  BODY_STYLES,
  CHARACTERS,
  DRIVETRAINS,
  POWERTRAINS,
  type Character,
  type ImageFocus,
  type ImageSource,
  type Vehicle,
  type VehicleImage,
} from "@/types/vehicle";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

export type InventoryState = AsyncState<readonly Vehicle[]>;

export type InventoryFetcher = () => Promise<readonly Vehicle[]>;

export type InventoryStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => InventoryState;
  /** Kicks off the first fetch. A no-op once a load has started or succeeded. */
  load: () => void;
  /** Re-fetches unconditionally (used to recover from an error state). */
  retry: () => void;
};

const FETCH_TIMEOUT_MS = 10_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load the collection.";
}

export function createInventoryStore(fetcher: InventoryFetcher): InventoryStore {
  let state: InventoryState = { status: "loading" };
  let started = false;
  let inflight: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const setState = (next: InventoryState): void => {
    state = next;
    listeners.forEach(listener => listener());
  };

  const run = (): Promise<void> => {
    if (inflight) return inflight;
    setState({ status: "loading" });
    inflight = fetcher()
      .then(data => setState({ status: "ready", data }))
      .catch((error: unknown) => setState({ status: "error", message: errorMessage(error) }))
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    load: () => {
      if (started) return;
      started = true;
      void run();
    },
    retry: () => {
      void run();
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function isCharacterArray(value: unknown): value is Character[] {
  return Array.isArray(value) && value.every(item => isOneOf(item, CHARACTERS));
}

/** `id` doubles as the URL slug: a 4-digit model year, a dash, then slug-safe characters. */
const SLUG_PATTERN = /^[0-9]{4}-[a-z0-9-]+$/;

function isImageFocus(value: unknown): value is ImageFocus {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y) && isFiniteNumber(value.z);
}

function isImageSource(value: unknown): value is ImageSource {
  if (!isRecord(value)) return false;
  if (value.kind === "storage") return isNonEmptyString(value.path);
  if (value.kind === "unsplash") return isNonEmptyString(value.photoId);
  return false;
}

function isVehicleImage(value: unknown): value is VehicleImage {
  if (!isRecord(value)) return false;
  if (!isImageSource(value.source) || !isNonEmptyString(value.alt)) return false;
  if (value.focus !== undefined && !isImageFocus(value.focus)) return false;
  if (value.width !== undefined && !isFiniteNumber(value.width)) return false;
  if (value.height !== undefined && !isFiniteNumber(value.height)) return false;
  return true;
}

/** Defensive per-element shape check: every enum, numeric and nested field is validated. */
function isVehicle(value: unknown): value is Vehicle {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    SLUG_PATTERN.test(value.id) &&
    isNonEmptyString(value.stockNumber) &&
    isNonEmptyString(value.vinTail) &&
    isFiniteNumber(value.year) &&
    isNonEmptyString(value.make) &&
    isNonEmptyString(value.model) &&
    typeof value.trim === "string" &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.mileage) &&
    isOneOf(value.bodyStyle, BODY_STYLES) &&
    isOneOf(value.drivetrain, DRIVETRAINS) &&
    isOneOf(value.powertrain, POWERTRAINS) &&
    (value.transmission === null || typeof value.transmission === "string") &&
    typeof value.engine === "string" &&
    (value.horsepower === null || isFiniteNumber(value.horsepower)) &&
    (value.torqueLbFt === null || isFiniteNumber(value.torqueLbFt)) &&
    (value.zeroToSixty === null || isFiniteNumber(value.zeroToSixty)) &&
    (value.topSpeedMph === null || isFiniteNumber(value.topSpeedMph)) &&
    typeof value.exteriorColor === "string" &&
    typeof value.interiorColor === "string" &&
    isFiniteNumber(value.owners) &&
    typeof value.accidentFree === "boolean" &&
    typeof value.location === "string" &&
    isCharacterArray(value.characters) &&
    isStringArray(value.highlights) &&
    typeof value.story === "string" &&
    Array.isArray(value.images) &&
    value.images.every(isVehicleImage) &&
    (value.isNewArrival === undefined || typeof value.isNewArrival === "boolean") &&
    (value.isFeatured === undefined || typeof value.isFeatured === "boolean")
  );
}

/**
 * Defensive envelope check: only trust `{ success: true, data: [...] }`, then validate every
 * element's shape individually. A malformed envelope throws (nothing to show); a malformed
 * element is dropped so one bad row doesn't take down the whole listing.
 */
export function parseVehiclesEnvelope(payload: unknown): readonly Vehicle[] {
  if (!isRecord(payload) || payload.success !== true || !Array.isArray(payload.data)) {
    throw new Error("Unexpected response from the server.");
  }
  return payload.data.filter(isVehicle);
}

async function fetchVehicles(): Promise<readonly Vehicle[]> {
  const response = await fetch("/api/vehicles", { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
  const payload: unknown = await response.json();
  return parseVehiclesEnvelope(payload);
}

/** Shared instance every hook reads from — one fetch, no matter how many components mount. */
export const inventoryStore: InventoryStore = createInventoryStore(fetchVehicles);
