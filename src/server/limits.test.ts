import { describe, expect, test } from "bun:test";
import { createRateLimiter } from "./limits";

describe("createRateLimiter", () => {
  test("allows up to the limit within a window, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, maxClients: 100 });
    expect([1, 2, 3].map(() => limiter.isLimited("ip", 0))).toEqual([false, false, false]);
    expect(limiter.isLimited("ip", 10)).toBe(true);
  });

  test("resets once the window has passed", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxClients: 100 });
    limiter.isLimited("ip", 0);
    expect(limiter.isLimited("ip", 500)).toBe(true);
    expect(limiter.isLimited("ip", 1001)).toBe(false);
  });

  test("tracks clients independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxClients: 100 });
    limiter.isLimited("a", 0);
    expect(limiter.isLimited("b", 0)).toBe(false);
  });

  test("memory per client stays constant under sustained abuse", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, maxClients: 100 });
    for (let i = 0; i < 10_000; i++) limiter.isLimited("abuser", i);
    expect(limiter.size()).toBe(1);
    expect(limiter.isLimited("abuser", 10_001)).toBe(true);
  });

  test("a flood of new clients cannot reset an active client's limit", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxClients: 5 });
    limiter.isLimited("victim-of-reset", 0);
    for (let i = 0; i < 50; i++) limiter.isLimited(`flood-${i}`, 1);
    expect(limiter.isLimited("victim-of-reset", 2)).toBe(true);
    expect(limiter.size()).toBeLessThanOrEqual(6);
  });
});
