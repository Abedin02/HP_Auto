import { describe, expect, test } from "bun:test";
import { financeSummary, monthlyPayment } from "./finance";

describe("monthlyPayment", () => {
  test("matches the standard amortization formula", () => {
    // $100,000 at 6% APR over 60 months → $1,933.28
    const payment = monthlyPayment({ price: 100_000, downPayment: 0, aprPercent: 6, termMonths: 60 });
    expect(payment).toBeCloseTo(1933.28, 2);
  });

  test("subtracts the down payment from the financed amount", () => {
    const withDown = monthlyPayment({ price: 120_000, downPayment: 20_000, aprPercent: 6, termMonths: 60 });
    expect(withDown).toBeCloseTo(1933.28, 2);
  });

  test("divides evenly at 0% APR", () => {
    expect(monthlyPayment({ price: 60_000, downPayment: 0, aprPercent: 0, termMonths: 60 })).toBe(1000);
  });

  test("returns 0 when the down payment covers the price", () => {
    expect(monthlyPayment({ price: 50_000, downPayment: 60_000, aprPercent: 5, termMonths: 36 })).toBe(0);
  });

  test("returns 0 for a non-positive term", () => {
    expect(monthlyPayment({ price: 50_000, downPayment: 0, aprPercent: 5, termMonths: 0 })).toBe(0);
  });
});

describe("financeSummary", () => {
  test("reports financed amount, total interest and total cost", () => {
    const summary = financeSummary({ price: 100_000, downPayment: 10_000, aprPercent: 0, termMonths: 60 });
    expect(summary.financed).toBe(90_000);
    expect(summary.monthly).toBe(1500);
    expect(summary.totalInterest).toBe(0);
    expect(summary.totalCost).toBe(100_000);
  });

  test("total interest is positive when APR is positive", () => {
    const summary = financeSummary({ price: 100_000, downPayment: 0, aprPercent: 6, termMonths: 60 });
    expect(summary.totalInterest).toBeCloseTo(15_996.8, 0);
  });
});
