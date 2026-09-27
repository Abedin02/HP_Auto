import { afterEach, describe, expect, test } from "bun:test";
import { requestRevalidate } from "./revalidate";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("requestRevalidate", () => {
  test("sends the bearer token and resolves ok on success", async () => {
    let capturedUrl: RequestInfo | URL | null = null;
    let capturedInit: RequestInit | undefined;
    global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input;
      capturedInit = init;
      return new Response(JSON.stringify({ success: true, data: { revalidated: true } }), { status: 200 });
    }) as typeof fetch;

    const result = await requestRevalidate("token-123");

    expect(result.ok).toBe(true);
    expect(String(capturedUrl)).toContain("/api/admin/revalidate");
    expect(capturedInit?.method).toBe("POST");
    const headers = new Headers(capturedInit?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  test("returns a failure message on a non-2xx response", async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ success: false, error: "nope" }), { status: 403 })) as unknown as typeof fetch;

    const result = await requestRevalidate("token-123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("403");
  });

  test("returns a failure message when the network call throws", async () => {
    global.fetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await requestRevalidate("token-123");
    expect(result.ok).toBe(false);
  });
});
