import { describe, expect, test } from "bun:test";
import { isBehindTrustedProxy, resolveClientKey } from "./client-ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("resolveClientKey", () => {
  test("uses the socket address when proxy headers are not trusted", () => {
    const result = resolveClientKey(headers({ "true-client-ip": "203.0.113.9" }), "10.0.0.1", false);
    expect(result).toBe("10.0.0.1");
  });

  test("prefers True-Client-IP behind a trusted proxy", () => {
    const result = resolveClientKey(
      headers({ "true-client-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.1, 10.0.0.1" }),
      "10.0.0.1",
      true,
    );
    expect(result).toBe("203.0.113.9");
  });

  test("falls back to the first X-Forwarded-For entry behind a trusted proxy", () => {
    const result = resolveClientKey(headers({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }), "10.0.0.1", true);
    expect(result).toBe("198.51.100.1");
  });

  test("falls back to the socket address when a trusted proxy sends no client headers", () => {
    expect(resolveClientKey(headers({}), "10.0.0.1", true)).toBe("10.0.0.1");
  });

  test("returns 'unknown' when nothing identifies the client", () => {
    expect(resolveClientKey(headers({ "x-forwarded-for": " , " }), undefined, true)).toBe("unknown");
  });
});

describe("isBehindTrustedProxy", () => {
  test("trusts the proxy on Render", () => {
    expect(isBehindTrustedProxy({ RENDER: "true" })).toBe(true);
  });

  test("trusts the proxy when TRUST_PROXY is opted in", () => {
    expect(isBehindTrustedProxy({ TRUST_PROXY: "true" })).toBe(true);
  });

  test("does not trust proxy headers by default", () => {
    expect(isBehindTrustedProxy({})).toBe(false);
  });
});
