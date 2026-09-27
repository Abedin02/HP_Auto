import { describe, expect, test } from "bun:test";
import { formatCompactPrice, formatMileage, formatPrice, vehicleTitle } from "./format";

describe("formatPrice", () => {
  test("formats whole dollars with thousands separators", () => {
    expect(formatPrice(164900)).toBe("$164,900");
  });

  test("rounds cents away", () => {
    expect(formatPrice(1234.56)).toBe("$1,235");
  });
});

describe("formatCompactPrice", () => {
  test("uses K below a million", () => {
    expect(formatCompactPrice(164900)).toBe("$165K");
  });

  test("uses M with one decimal at or above a million", () => {
    expect(formatCompactPrice(3250000)).toBe("$3.3M");
  });
});

describe("formatMileage", () => {
  test("adds unit and separators", () => {
    expect(formatMileage(12450)).toBe("12,450 mi");
  });

  test("special-cases delivery miles", () => {
    expect(formatMileage(0)).toBe("Delivery miles");
  });
});

describe("vehicleTitle", () => {
  test("joins year, make and model", () => {
    expect(vehicleTitle({ year: 2024, make: "Porsche", model: "911 GT3 RS" })).toBe("2024 Porsche 911 GT3 RS");
  });
});
