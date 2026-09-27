import { describe, expect, test } from "bun:test";
import { matchRoute } from "./router";

describe("matchRoute", () => {
  test("matches static paths exactly", () => {
    expect(matchRoute("/inventory", "/inventory")).toEqual({});
    expect(matchRoute("/inventory", "/finance")).toBeNull();
  });

  test("extracts named params", () => {
    expect(matchRoute("/vehicle/:id", "/vehicle/2024-porsche-911-gt3-rs")).toEqual({
      id: "2024-porsche-911-gt3-rs",
    });
  });

  test("decodes encoded params", () => {
    expect(matchRoute("/vehicle/:id", "/vehicle/a%20b")).toEqual({ id: "a b" });
  });

  test("ignores trailing slashes", () => {
    expect(matchRoute("/inventory", "/inventory/")).toEqual({});
  });

  test("rejects paths with a different segment count", () => {
    expect(matchRoute("/vehicle/:id", "/vehicle")).toBeNull();
    expect(matchRoute("/vehicle/:id", "/vehicle/a/b")).toBeNull();
  });

  test("treats a malformed percent-encoding as no match instead of throwing", () => {
    expect(() => matchRoute("/vehicle/:id", "/vehicle/100%")).not.toThrow();
    expect(matchRoute("/vehicle/:id", "/vehicle/100%")).toBeNull();
  });

  test("matches the root path", () => {
    expect(matchRoute("/", "/")).toEqual({});
    expect(matchRoute("/", "/inventory")).toBeNull();
  });
});
