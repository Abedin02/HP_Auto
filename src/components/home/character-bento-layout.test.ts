import { describe, expect, test } from "bun:test";
import { bentoTileLayouts } from "./character-bento-layout";

describe("bentoTileLayouts", () => {
  test("returns an empty array for zero or negative counts", () => {
    expect(bentoTileLayouts(0)).toEqual([]);
    expect(bentoTileLayouts(-1)).toEqual([]);
  });

  test("returns exactly `count` entries for every count from 1 to 10", () => {
    for (let count = 1; count <= 10; count++) {
      expect(bentoTileLayouts(count)).toHaveLength(count);
    }
  });

  test("a single tile spans the full width", () => {
    const [tile] = bentoTileLayouts(1);
    expect(tile?.span).toContain("col-span-12");
  });

  test("two tiles split the row evenly", () => {
    const tiles = bentoTileLayouts(2);
    expect(tiles.every(tile => tile.span.includes("col-span-6"))).toBe(true);
  });

  test("three or more tiles lead with an editorial hero, then a wide companion", () => {
    for (const count of [3, 4, 7, 10]) {
      const tiles = bentoTileLayouts(count);
      expect(tiles[0]?.span).toContain("row-span-2");
      expect(tiles[1]?.span).toContain("col-span-5");
    }
  });

  test("tiles after the hero and wide companion are standard-sized", () => {
    const tiles = bentoTileLayouts(6);
    for (const tile of tiles.slice(2)) {
      expect(tile.span).toContain("col-span-4");
    }
  });

  test("is deterministic: the same count always produces the same layout", () => {
    expect(bentoTileLayouts(5)).toEqual(bentoTileLayouts(5));
  });

  test("every tile has a positive aspect ratio", () => {
    for (let count = 1; count <= 10; count++) {
      for (const tile of bentoTileLayouts(count)) {
        expect(tile.aspect).toBeGreaterThan(0);
      }
    }
  });
});
