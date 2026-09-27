import { describe, expect, test } from "bun:test";
import { PRICE_STOPS, stopIndex, stopValue } from "./filter-options";

describe("stepped slider helpers", () => {
  test("null maps to the trailing 'no limit' index and back", () => {
    const index = stopIndex(PRICE_STOPS, null);
    expect(index).toBe(PRICE_STOPS.length);
    expect(stopValue(PRICE_STOPS, index)).toBeNull();
  });

  test("exact stops round-trip", () => {
    expect(stopValue(PRICE_STOPS, stopIndex(PRICE_STOPS, 150_000))).toBe(150_000);
  });

  test("values between stops snap up to the next stop", () => {
    expect(stopValue(PRICE_STOPS, stopIndex(PRICE_STOPS, 120_000))).toBe(150_000);
  });

  test("values above the last stop mean no limit", () => {
    expect(stopIndex(PRICE_STOPS, 9_000_000)).toBe(PRICE_STOPS.length);
  });
});
