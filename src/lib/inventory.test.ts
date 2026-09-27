import { describe, expect, test } from "bun:test";
import type { Vehicle } from "@/types/vehicle";
import {
  EMPTY_FILTERS,
  canonicalMakeLabel,
  countActiveFilters,
  filterVehicles,
  makeFacets,
  makeKey,
  parseFilters,
  serializeFilters,
  sortVehicles,
  type InventoryFilters,
} from "./inventory";

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: "id",
    stockNumber: "HP0001",
    vinTail: "000001",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    price: 100_000,
    mileage: 10_000,
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

const gt3 = makeVehicle({ id: "gt3", model: "911 GT3 RS", price: 320_000, year: 2024, mileage: 900, horsepower: 518, characters: ["track"] });
const m4 = makeVehicle({ id: "m4", make: "BMW", model: "M4 Competition", price: 84_000, year: 2023, mileage: 8_000, horsepower: 503 });
const gclass = makeVehicle({ id: "g63", make: "Mercedes-AMG", model: "G 63", bodyStyle: "SUV", price: 189_000, year: 2024, mileage: 3_000, horsepower: 577, characters: ["utility"] });
const etron = makeVehicle({ id: "etron", make: "Audi", model: "RS e-tron GT", bodyStyle: "Sedan", powertrain: "Electric", price: 118_000, year: 2023, mileage: 12_000, horsepower: 637, characters: ["electric"] });
const all = [gt3, m4, gclass, etron];

const withFilters = (partial: Partial<InventoryFilters>): InventoryFilters => ({ ...EMPTY_FILTERS, ...partial });

describe("filterVehicles", () => {
  test("returns everything for empty filters", () => {
    expect(filterVehicles(all, EMPTY_FILTERS)).toHaveLength(4);
  });

  test("matches free-text query against make, model and trim, case-insensitively", () => {
    expect(filterVehicles(all, withFilters({ query: "gt3" })).map(v => v.id)).toEqual(["gt3"]);
    expect(filterVehicles(all, withFilters({ query: "bmw m4" })).map(v => v.id)).toEqual(["m4"]);
  });

  test("query terms match word prefixes, not arbitrary substrings", () => {
    const plainGt3 = makeVehicle({ id: "plain-gt3", model: "911 GT3", trim: "Touring" });
    // "rs" is inside "Porsche" but must not make a non-RS car match.
    expect(filterVehicles([gt3, plainGt3], withFilters({ query: "gt3 rs" })).map(v => v.id)).toEqual(["gt3"]);
  });

  test("hyphenated names match however they are typed", () => {
    expect(filterVehicles(all, withFilters({ query: "e-tron" })).map(v => v.id)).toEqual(["etron"]);
    expect(filterVehicles(all, withFilters({ query: "etron" })).map(v => v.id)).toEqual(["etron"]);
  });

  test("filters by one or more makes", () => {
    const result = filterVehicles(all, withFilters({ makes: ["BMW", "Audi"] }));
    expect(result.map(v => v.id).sort()).toEqual(["etron", "m4"]);
  });

  test("matches makes case- and whitespace-insensitively", () => {
    const result = filterVehicles(all, withFilters({ makes: [" bmw ", "AUDI"] }));
    expect(result.map(v => v.id).sort()).toEqual(["etron", "m4"]);
  });

  test("accepts any make string, not just a fixed enum", () => {
    const yugo = makeVehicle({ id: "yugo", make: "Yugo" });
    expect(filterVehicles([...all, yugo], withFilters({ makes: ["Yugo"] })).map(v => v.id)).toEqual(["yugo"]);
  });

  test("filters by body style and powertrain", () => {
    expect(filterVehicles(all, withFilters({ bodyStyles: ["SUV"] })).map(v => v.id)).toEqual(["g63"]);
    expect(filterVehicles(all, withFilters({ powertrains: ["Electric"] })).map(v => v.id)).toEqual(["etron"]);
  });

  test("filters by character", () => {
    expect(filterVehicles(all, withFilters({ character: "track" })).map(v => v.id)).toEqual(["gt3"]);
  });

  test("applies numeric bounds inclusively", () => {
    expect(filterVehicles(all, withFilters({ priceMax: 118_000 })).map(v => v.id).sort()).toEqual(["etron", "m4"]);
    expect(filterVehicles(all, withFilters({ yearMin: 2024 })).map(v => v.id).sort()).toEqual(["g63", "gt3"]);
    expect(filterVehicles(all, withFilters({ mileageMax: 3_000 })).map(v => v.id).sort()).toEqual(["g63", "gt3"]);
  });
});

describe("sortVehicles", () => {
  test("does not mutate the input", () => {
    const input = [...all];
    sortVehicles(input, "price-asc");
    expect(input).toEqual(all);
  });

  test("sorts by price both ways", () => {
    expect(sortVehicles(all, "price-asc").map(v => v.id)).toEqual(["m4", "etron", "g63", "gt3"]);
    expect(sortVehicles(all, "price-desc").map(v => v.id)).toEqual(["gt3", "g63", "etron", "m4"]);
  });

  test("sorts by newest, lowest mileage and horsepower", () => {
    expect(sortVehicles(all, "year-desc")[0]?.year).toBe(2024);
    expect(sortVehicles(all, "mileage-asc").map(v => v.id)[0]).toBe("gt3");
    expect(sortVehicles(all, "hp-desc").map(v => v.id)[0]).toBe("etron");
  });

  test("featured keeps original order", () => {
    expect(sortVehicles(all, "featured")).toEqual(all);
  });

  test("sorts by 0-60 and top speed, with nulls always last", () => {
    const quick = makeVehicle({ id: "quick", zeroToSixty: 2.5, topSpeedMph: 220 });
    const slower = makeVehicle({ id: "slower", zeroToSixty: 4.2, topSpeedMph: 155 });
    const noFigures = makeVehicle({ id: "no-figures", zeroToSixty: null, topSpeedMph: null });
    const pool = [noFigures, slower, quick];

    expect(sortVehicles(pool, "zero-to-sixty-asc").map(v => v.id)).toEqual(["quick", "slower", "no-figures"]);
    expect(sortVehicles(pool, "top-speed-desc").map(v => v.id)).toEqual(["quick", "slower", "no-figures"]);
  });

  test("sorts by horsepower with a missing figure last", () => {
    const strong = makeVehicle({ id: "strong", horsepower: 640 });
    const mild = makeVehicle({ id: "mild", horsepower: 300 });
    const unknown = makeVehicle({ id: "unknown", horsepower: null });
    expect(sortVehicles([unknown, mild, strong], "hp-desc").map(v => v.id)).toEqual(["strong", "mild", "unknown"]);
  });
});

describe("filter URL round-trip", () => {
  test("serialize then parse yields the same filters", () => {
    const filters = withFilters({
      query: "turbo",
      makes: ["Porsche", "BMW"],
      bodyStyles: ["Coupe"],
      powertrains: ["Hybrid"],
      character: "track",
      priceMax: 200_000,
      yearMin: 2020,
      mileageMax: 15_000,
    });
    expect(parseFilters(serializeFilters(filters))).toEqual(filters);
  });

  test("keeps a trailing space in the query so live typing works", () => {
    const params = serializeFilters(withFilters({ query: "bmw " }));
    expect(parseFilters(params).query).toBe("bmw ");
  });

  test("a whitespace-only query is dropped", () => {
    expect(serializeFilters(withFilters({ query: "   " })).toString()).toBe("");
  });

  test("empty filters serialize to an empty query string", () => {
    expect(serializeFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  test("parse accepts any make (no fixed enum), but still ignores bad numbers and bad characters", () => {
    const params = new URLSearchParams("make=Porsche,Yugo&priceMax=abc&character=boat&yearMin=-5");
    expect(parseFilters(params)).toEqual(withFilters({ makes: ["Porsche", "Yugo"] }));
  });

  test("parse trims and drops blank entries from the make list", () => {
    const params = new URLSearchParams("make=" + encodeURIComponent(" Porsche , , BMW "));
    expect(parseFilters(params).makes).toEqual(["Porsche", "BMW"]);
  });
});

describe("countActiveFilters", () => {
  test("counts every active constraint", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters(withFilters({ makes: ["BMW", "Audi"], priceMax: 1, query: "x" }))).toBe(4);
  });
});

describe("makeKey", () => {
  test("normalises case and surrounding whitespace", () => {
    expect(makeKey(" BMW ")).toBe(makeKey("bmw"));
    expect(makeKey("Mercedes-Benz")).toBe("mercedes-benz");
  });
});

describe("makeFacets", () => {
  test("groups makes case-insensitively and picks the most common spelling", () => {
    const pool = [
      makeVehicle({ id: "1", make: "BMW" }),
      makeVehicle({ id: "2", make: "bmw" }),
      makeVehicle({ id: "3", make: "bmw" }),
      makeVehicle({ id: "4", make: "Porsche" }),
    ];
    const facets = makeFacets(pool);
    expect(facets).toEqual([
      { make: "bmw", count: 3 },
      { make: "Porsche", count: 1 },
    ]);
  });

  test("sorts by count descending, then by name ascending", () => {
    const pool = [
      makeVehicle({ id: "1", make: "Audi" }),
      makeVehicle({ id: "2", make: "BMW" }),
      makeVehicle({ id: "3", make: "Porsche" }),
      makeVehicle({ id: "4", make: "Porsche" }),
    ];
    expect(makeFacets(pool).map(f => f.make)).toEqual(["Porsche", "Audi", "BMW"]);
  });

  test("returns an empty array for an empty pool", () => {
    expect(makeFacets([])).toEqual([]);
  });
});

describe("canonicalMakeLabel", () => {
  test("returns the facet's canonical spelling when the make matches, case-insensitively", () => {
    const facets = makeFacets([
      makeVehicle({ id: "1", make: "bmw" }),
      makeVehicle({ id: "2", make: "bmw" }),
      makeVehicle({ id: "3", make: "BMW" }),
    ]);
    expect(canonicalMakeLabel("bmw", facets)).toBe("bmw");
    expect(canonicalMakeLabel(" BMW ", facets)).toBe("bmw");
  });

  test("falls back to the raw value when no facet matches", () => {
    const facets = makeFacets([makeVehicle({ id: "1", make: "Porsche" })]);
    expect(canonicalMakeLabel("Yugo", facets)).toBe("Yugo");
  });

  test("falls back to the raw value for an empty facet list", () => {
    expect(canonicalMakeLabel("bmw", [])).toBe("bmw");
  });
});
