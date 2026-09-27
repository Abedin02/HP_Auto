import { expect, test } from "bun:test";
import { deliveryWindow } from "./delivery";

test("deliveryWindow spans four to seven days out, across month boundaries", () => {
  expect(deliveryWindow(new Date(2026, 8, 24))).toBe("Sep 28 – Oct 1");
});
