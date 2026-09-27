import { describe, expect, mock, test } from "bun:test";
import type { Vehicle } from "@/types/vehicle";
import type { VehicleImageRow, VehicleRow } from "@/lib/vehicle-rows";
import { createVehicleHandlers, createVehicleService, type FetchPublishedResult } from "./vehicles";

function makeRow(overrides: Partial<VehicleRow> = {}): VehicleRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "2024-porsche-911-gt3-rs-4f2a",
    status: "published",
    is_featured: true,
    is_new_arrival: false,
    display_order: 0,
    stock_number: "HP-1001",
    vin_tail: "A1B2C3",
    year: 2024,
    make: "Porsche",
    model: "911",
    trim: "GT3 RS",
    price: 250000,
    mileage: 1200,
    body_style: "Coupe",
    drivetrain: "RWD",
    powertrain: "Gasoline",
    transmission: "7-speed PDK",
    engine: "4.0L Flat-Six",
    horsepower: 518,
    torque_lb_ft: 343,
    zero_to_sixty: 3.0,
    top_speed_mph: 184,
    exterior_color: "Shark Blue",
    interior_color: "Black Leather",
    owners: 1,
    accident_free: true,
    location: "Miami, FL",
    characters: ["track"],
    highlights: [],
    story: "",
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const noImages: readonly VehicleImageRow[] = [];

describe("createVehicleService", () => {
  test("caches results within the TTL window", async () => {
    let calls = 0;
    let now = 0;
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => {
      calls++;
      return { vehicles: [makeRow()], images: noImages };
    });
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => now });

    await service.getVehicles();
    now = 500;
    await service.getVehicles();
    expect(calls).toBe(1);
  });

  test("refetches once the TTL has elapsed", async () => {
    let calls = 0;
    let now = 0;
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => {
      calls++;
      return { vehicles: [makeRow()], images: noImages };
    });
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => now });

    await service.getVehicles();
    now = 1001;
    await service.getVehicles();
    expect(calls).toBe(2);
  });

  test("dedupes concurrent in-flight requests into a single fetch", async () => {
    let calls = 0;
    let resolveFetch: (result: FetchPublishedResult) => void = () => {};
    const fetchPublished = mock(
      () =>
        new Promise<FetchPublishedResult>((resolve) => {
          calls++;
          resolveFetch = resolve;
        }),
    );
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => 0 });

    const first = service.getVehicles();
    const second = service.getVehicles();
    resolveFetch({ vehicles: [makeRow()], images: noImages });
    const [a, b] = await Promise.all([first, second]);

    expect(calls).toBe(1);
    expect(a).toEqual(b);
  });

  test("serves the stale cache when a refetch fails", async () => {
    let now = 0;
    let shouldFail = false;
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => {
      if (shouldFail) throw new Error("network down");
      return { vehicles: [makeRow()], images: noImages };
    });
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => now });

    const first = await service.getVehicles();
    now = 2000;
    shouldFail = true;
    const second = await service.getVehicles();
    expect(second).toEqual(first);
  });

  test("rejects when there is no cache to fall back on", async () => {
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => {
      throw new Error("network down");
    });
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => 0 });
    await expect(service.getVehicles()).rejects.toThrow("network down");
  });

  test("invalidate() forces the next call to refetch immediately", async () => {
    let calls = 0;
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => {
      calls++;
      return { vehicles: [makeRow()], images: noImages };
    });
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => 0 });

    await service.getVehicles();
    service.invalidate();
    await service.getVehicles();
    expect(calls).toBe(2);
  });

  test("skips rows that fail to map to a Vehicle", async () => {
    const fetchPublished = mock(async (): Promise<FetchPublishedResult> => ({
      vehicles: [makeRow(), makeRow({ id: "bad", slug: "bad-slug", make: "" })],
      images: noImages,
    }));
    const service = createVehicleService({ fetchPublished, ttlMs: 1000, now: () => 0 });
    const vehicles = await service.getVehicles();
    expect(vehicles).toHaveLength(1);
  });
});

function fakeService(vehicles: Vehicle[] = []) {
  return {
    getVehicles: mock(async () => vehicles),
    invalidate: mock(() => {}),
  };
}

describe("createVehicleHandlers", () => {
  test("handleListVehicles returns the published vehicles with a cache header", async () => {
    const service = fakeService([]);
    const { handleListVehicles } = createVehicleHandlers({ service, verifyAdmin: async () => true });
    const response = await handleListVehicles(new Request("http://x/api/vehicles"), "1.2.3.4");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=30");
    expect(await response.json()).toEqual({ success: true, data: [] });
  });

  test("handleListVehicles is rate-limited per client", async () => {
    const service = fakeService([]);
    const { handleListVehicles } = createVehicleHandlers({ service, verifyAdmin: async () => true });
    let lastStatus = 200;
    for (let i = 0; i < 121; i++) {
      const response = await handleListVehicles(new Request("http://x/api/vehicles"), "same-client");
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });

  test("handleRevalidate returns 401 when the bearer token is missing", async () => {
    const service = fakeService([]);
    const { handleRevalidate } = createVehicleHandlers({ service, verifyAdmin: async () => true });
    const response = await handleRevalidate(new Request("http://x/api/admin/revalidate", { method: "POST" }), "ip");
    expect(response.status).toBe(401);
  });

  test("handleRevalidate returns 401 when verifyAdmin rejects (invalid token)", async () => {
    const service = fakeService([]);
    const { handleRevalidate } = createVehicleHandlers({
      service,
      verifyAdmin: async () => {
        throw new Error("invalid token");
      },
    });
    const response = await handleRevalidate(
      new Request("http://x/api/admin/revalidate", { method: "POST", headers: { authorization: "Bearer bad" } }),
      "ip",
    );
    expect(response.status).toBe(401);
  });

  test("handleRevalidate returns 403 when the user is not an admin", async () => {
    const service = fakeService([]);
    const { handleRevalidate } = createVehicleHandlers({ service, verifyAdmin: async () => false });
    const response = await handleRevalidate(
      new Request("http://x/api/admin/revalidate", { method: "POST", headers: { authorization: "Bearer user" } }),
      "ip",
    );
    expect(response.status).toBe(403);
    expect(service.invalidate).not.toHaveBeenCalled();
  });

  test("handleRevalidate invalidates the cache and returns success for an admin", async () => {
    const service = fakeService([]);
    const { handleRevalidate } = createVehicleHandlers({ service, verifyAdmin: async () => true });
    const response = await handleRevalidate(
      new Request("http://x/api/admin/revalidate", { method: "POST", headers: { authorization: "Bearer admin" } }),
      "ip",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { revalidated: true } });
    expect(service.invalidate).toHaveBeenCalledTimes(1);
  });
});
