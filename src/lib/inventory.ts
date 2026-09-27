import {
  BODY_STYLES,
  CHARACTERS,
  POWERTRAINS,
  type BodyStyle,
  type Character,
  type Make,
  type MakeFacet,
  type Powertrain,
  type Vehicle,
} from "@/types/vehicle";

export type InventoryFilters = {
  query: string;
  makes: Make[];
  bodyStyles: BodyStyle[];
  powertrains: Powertrain[];
  character: Character | null;
  priceMax: number | null;
  yearMin: number | null;
  mileageMax: number | null;
};

export const EMPTY_FILTERS: InventoryFilters = {
  query: "",
  makes: [],
  bodyStyles: [],
  powertrains: [],
  character: null,
  priceMax: null,
  yearMin: null,
  mileageMax: null,
};

export const SORT_OPTIONS = [
  { key: "featured", label: "Curated order" },
  { key: "price-desc", label: "Price — high to low" },
  { key: "price-asc", label: "Price — low to high" },
  { key: "year-desc", label: "Newest first" },
  { key: "mileage-asc", label: "Lowest mileage" },
  { key: "hp-desc", label: "Most powerful" },
  { key: "zero-to-sixty-asc", label: "Quickest 0–60" },
  { key: "top-speed-desc", label: "Highest top speed" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["key"];

const includesIfAny = <T>(selected: readonly T[], value: T): boolean =>
  selected.length === 0 || selected.includes(value);

const withinMax = (max: number | null, value: number): boolean => max === null || value <= max;

/** Case/whitespace-insensitive identity for a make: "bmw", "BMW " and "Bmw" are the same make. */
export function makeKey(make: string): string {
  return make.trim().toLowerCase();
}

const matchesAnyMake = (selected: readonly string[], make: string): boolean =>
  selected.length === 0 || selected.some(candidate => makeKey(candidate) === makeKey(make));

const compact = (text: string): string => text.replace(/[^a-z0-9]/g, "");

/**
 * Searchable words for a vehicle: every alphanumeric token ("e", "tron") plus each
 * whitespace chunk with punctuation removed ("etron"), so "e-tron" and "etron" both match.
 */
function searchWords(vehicle: Vehicle): string[] {
  const text = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.exteriorColor}`.toLowerCase();
  const tokens = text.split(/[^a-z0-9]+/);
  const chunks = text.split(/\s+/).map(compact);
  return [...tokens, ...chunks].filter(Boolean);
}

/** Every query term must be a prefix of some word, so "rs" matches "RS" but not "Porsche". */
function matchesQuery(vehicle: Vehicle, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).map(compact).filter(Boolean);
  if (terms.length === 0) return true;
  const words = searchWords(vehicle);
  return terms.every(term => words.some(word => word.startsWith(term)));
}

export function filterVehicles(vehicles: readonly Vehicle[], filters: InventoryFilters): Vehicle[] {
  return vehicles.filter(
    v =>
      matchesQuery(v, filters.query) &&
      matchesAnyMake(filters.makes, v.make) &&
      includesIfAny(filters.bodyStyles, v.bodyStyle) &&
      includesIfAny(filters.powertrains, v.powertrain) &&
      (filters.character === null || v.characters.includes(filters.character)) &&
      withinMax(filters.priceMax, v.price) &&
      withinMax(filters.mileageMax, v.mileage) &&
      (filters.yearMin === null || v.year >= filters.yearMin),
  );
}

/** Ascending by value, with `null` (no manufacturer figure) always sorted to the end. */
function compareNullableAsc(a: number | null, b: number | null): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return a - b;
}

/** Descending by value, with `null` (no manufacturer figure) always sorted to the end. */
function compareNullableDesc(a: number | null, b: number | null): number {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return b - a;
}

const COMPARATORS: Record<SortKey, ((a: Vehicle, b: Vehicle) => number) | null> = {
  featured: null,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "year-desc": (a, b) => b.year - a.year,
  "mileage-asc": (a, b) => a.mileage - b.mileage,
  "hp-desc": (a, b) => compareNullableDesc(a.horsepower, b.horsepower),
  "zero-to-sixty-asc": (a, b) => compareNullableAsc(a.zeroToSixty, b.zeroToSixty),
  "top-speed-desc": (a, b) => compareNullableDesc(a.topSpeedMph, b.topSpeedMph),
};

export function sortVehicles(vehicles: readonly Vehicle[], sort: SortKey): Vehicle[] {
  const comparator = COMPARATORS[sort];
  return comparator ? [...vehicles].sort(comparator) : [...vehicles];
}

export function isSortKey(value: string | null): value is SortKey {
  return SORT_OPTIONS.some(option => option.key === value);
}

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return [];
  return raw.split(",").filter((item): item is T => (allowed as readonly string[]).includes(item));
}

/** Unlike parseList, make has no fixed allowed set: any non-blank, comma-separated value is kept. */
function parseMakeList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function parseFilters(params: URLSearchParams): InventoryFilters {
  const character = params.get("character");
  return {
    query: params.get("q") ?? "",
    makes: parseMakeList(params.get("make")),
    bodyStyles: parseList(params.get("body"), BODY_STYLES),
    powertrains: parseList(params.get("power"), POWERTRAINS),
    character: (CHARACTERS as readonly string[]).includes(character ?? "") ? (character as Character) : null,
    priceMax: parsePositiveInt(params.get("priceMax")),
    yearMin: parsePositiveInt(params.get("yearMin")),
    mileageMax: parsePositiveInt(params.get("mileageMax")),
  };
}

export function serializeFilters(filters: InventoryFilters): URLSearchParams {
  const entries: [string, string][] = [
    // Untrimmed so a live search box can still type the space between words.
    ["q", filters.query.trim() ? filters.query : ""],
    ["make", filters.makes.join(",")],
    ["body", filters.bodyStyles.join(",")],
    ["power", filters.powertrains.join(",")],
    ["character", filters.character ?? ""],
    ["priceMax", filters.priceMax?.toString() ?? ""],
    ["yearMin", filters.yearMin?.toString() ?? ""],
    ["mileageMax", filters.mileageMax?.toString() ?? ""],
  ];
  return new URLSearchParams(entries.filter(([, value]) => value !== ""));
}

export function countActiveFilters(filters: InventoryFilters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.makes.length +
    filters.bodyStyles.length +
    filters.powertrains.length +
    (filters.character ? 1 : 0) +
    (filters.priceMax !== null ? 1 : 0) +
    (filters.yearMin !== null ? 1 : 0) +
    (filters.mileageMax !== null ? 1 : 0)
  );
}

/**
 * Builds the public "filter by make" facet list from live inventory: groups makes
 * case/whitespace-insensitively (so "BMW" and "bmw" count together), picks the most common
 * spelling to display (ties broken alphabetically for determinism), and sorts by count
 * descending, then by name.
 */
export function makeFacets(pool: readonly Vehicle[]): MakeFacet[] {
  const spellingCountsByKey = new Map<string, Map<string, number>>();

  for (const vehicle of pool) {
    const key = makeKey(vehicle.make);
    const spellingCounts = spellingCountsByKey.get(key) ?? new Map<string, number>();
    spellingCounts.set(vehicle.make, (spellingCounts.get(vehicle.make) ?? 0) + 1);
    spellingCountsByKey.set(key, spellingCounts);
  }

  const facets: MakeFacet[] = [];
  for (const spellingCounts of spellingCountsByKey.values()) {
    let bestSpelling = "";
    let bestSpellingCount = -1;
    let total = 0;
    for (const [spelling, count] of spellingCounts) {
      total += count;
      if (count > bestSpellingCount || (count === bestSpellingCount && spelling < bestSpelling)) {
        bestSpelling = spelling;
        bestSpellingCount = count;
      }
    }
    facets.push({ make: bestSpelling, count: total });
  }

  return facets.sort((a, b) => b.count - a.count || a.make.localeCompare(b.make));
}

/**
 * The display spelling for a make: the canonical spelling from `facets` when one matches
 * (case/whitespace-insensitively), otherwise `make` unchanged. Used to label chips/filters
 * built from raw URL values (which keep whatever casing the visitor typed or shared).
 */
export function canonicalMakeLabel(make: string, facets: readonly MakeFacet[]): string {
  const match = facets.find(facet => makeKey(facet.make) === makeKey(make));
  return match ? match.make : make;
}
