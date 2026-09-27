import { afterEach, describe, expect, test } from "bun:test";
import { randomSlugSuffix } from "./random-suffix";

const originalGetRandomValues = crypto.getRandomValues.bind(crypto);

afterEach(() => {
  crypto.getRandomValues = originalGetRandomValues;
});

describe("randomSlugSuffix", () => {
  test("returns a 4-character lowercase alphanumeric string by default", () => {
    const suffix = randomSlugSuffix();
    expect(suffix).toMatch(/^[a-z0-9]{4}$/);
  });

  test("honours a custom length", () => {
    expect(randomSlugSuffix(8)).toMatch(/^[a-z0-9]{8}$/);
  });

  test("is not obviously constant across calls", () => {
    const samples = new Set(Array.from({ length: 20 }, () => randomSlugSuffix()));
    expect(samples.size).toBeGreaterThan(1);
  });

  test("uses rejection sampling: bytes >= 252 (256 - 256%36) are discarded, not modulo-biased", () => {
    // 36-letter alphabet: 256 % 36 === 4, so byte values 252-255 would over-represent the
    // first 4 letters ("a","b","c","d") if reduced with a plain modulo. Feed two biased
    // bytes (252, 255) followed by two valid ones and confirm the biased draws are skipped.
    const queue = [252, 255, 0, 37]; // 0 -> "a", 37 % 36 = 1 -> "b"
    let cursor = 0;
    crypto.getRandomValues = (<T extends ArrayBufferView | null>(array: T): T => {
      if (array instanceof Uint8Array) {
        for (let i = 0; i < array.length; i++) {
          array[i] = queue[cursor % queue.length]!;
          cursor++;
        }
      }
      return array;
    }) as typeof crypto.getRandomValues;

    expect(randomSlugSuffix(2)).toBe("ab");
  });
});
