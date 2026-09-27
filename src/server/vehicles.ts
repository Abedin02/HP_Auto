import type { Vehicle } from "@/types/vehicle";
import {
  rowToVehicle,
  VEHICLE_COLUMNS,
  VEHICLE_IMAGE_COLUMNS,
  type VehicleImageRow,
  type VehicleRow,
} from "@/lib/vehicle-rows";
import { getServerSupabaseClient } from "./supabase";
import { createRateLimiter } from "./limits";

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

const json = <T>(body: ApiResponse<T>, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

/** Rows + their images, exactly as read from `public.vehicles` / `public.vehicle_images`. */
export type FetchPublishedResult = { vehicles: readonly VehicleRow[]; images: readonly VehicleImageRow[] };
export type FetchPublished = () => Promise<FetchPublishedResult>;

/** Verifies a Supabase access token belongs to an admin. Should throw for a missing/invalid token. */
export type VerifyAdmin = (token: string) => Promise<boolean>;

export type VehicleService = {
  getVehicles: () => Promise<Vehicle[]>;
  invalidate: () => void;
};

export type CreateVehicleServiceOptions = {
  fetchPublished: FetchPublished;
  /** Cache lifetime in ms. Defaults to 60s, per the public /api/vehicles contract. */
  ttlMs?: number;
  now?: () => number;
};

function assembleVehicles(result: FetchPublishedResult): Vehicle[] {
  const imagesByVehicle = new Map<string, VehicleImageRow[]>();
  for (const image of result.images) {
    const list = imagesByVehicle.get(image.vehicle_id) ?? [];
    list.push(image);
    imagesByVehicle.set(image.vehicle_id, list);
  }

  const vehicles: Vehicle[] = [];
  for (const row of result.vehicles) {
    const vehicle = rowToVehicle(row, imagesByVehicle.get(row.id) ?? []);
    if (!vehicle) {
      console.error(`[vehicles] skipped invalid row: ${row.slug}`);
      continue;
    }
    vehicles.push(vehicle);
  }
  return vehicles;
}

/**
 * TTL cache with in-flight dedupe and stale-on-error: a failing refetch serves the last good
 * result instead of an error, as long as one exists. `now` is injectable for tests.
 */
export function createVehicleService(options: CreateVehicleServiceOptions): VehicleService {
  const ttlMs = options.ttlMs ?? 60_000;
  const now = options.now ?? Date.now;

  let cache: { vehicles: Vehicle[]; fetchedAt: number } | null = null;
  let inFlight: Promise<Vehicle[]> | null = null;

  async function loadFresh(): Promise<Vehicle[]> {
    const result = await options.fetchPublished();
    return assembleVehicles(result);
  }

  function getVehicles(): Promise<Vehicle[]> {
    const currentNow = now();
    if (cache && currentNow - cache.fetchedAt < ttlMs) return Promise.resolve(cache.vehicles);
    if (inFlight) return inFlight;

    const staleVehicles = cache?.vehicles;
    const request = loadFresh()
      .then((vehicles) => {
        cache = { vehicles, fetchedAt: now() };
        return vehicles;
      })
      .catch((error: unknown) => {
        if (staleVehicles) {
          console.error("[vehicles] revalidation failed, serving stale cache", error);
          return staleVehicles;
        }
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });

    inFlight = request;
    return request;
  }

  function invalidate(): void {
    cache = null;
  }

  return { getVehicles, invalidate };
}

export type CreateVehicleHandlersOptions = {
  service: VehicleService;
  verifyAdmin: VerifyAdmin;
};

export type VehicleHandlers = {
  handleListVehicles: (req: Request, clientKey: string) => Promise<Response>;
  handleRevalidate: (req: Request, clientKey: string) => Promise<Response>;
};

const RATE_LIMITED: ApiResponse<never> = { success: false, error: "Too many requests. Please try again in a minute." };

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export function createVehicleHandlers({ service, verifyAdmin }: CreateVehicleHandlersOptions): VehicleHandlers {
  const listLimiter = createRateLimiter({ limit: 120, windowMs: 60_000, maxClients: 10_000 });
  const revalidateLimiter = createRateLimiter({ limit: 30, windowMs: 60_000, maxClients: 10_000 });

  async function handleListVehicles(_req: Request, clientKey: string): Promise<Response> {
    if (listLimiter.isLimited(clientKey, Date.now())) return json(RATE_LIMITED, 429);

    const vehicles = await service.getVehicles();
    return json({ success: true, data: vehicles }, 200, { "Cache-Control": "public, max-age=30" });
  }

  async function handleRevalidate(req: Request, clientKey: string): Promise<Response> {
    if (revalidateLimiter.isLimited(clientKey, Date.now())) return json(RATE_LIMITED, 429);

    const token = bearerToken(req);
    if (!token) return json({ success: false, error: "Missing bearer token." }, 401);

    let isAdmin: boolean;
    try {
      isAdmin = await verifyAdmin(token);
    } catch {
      return json({ success: false, error: "Invalid or expired token." }, 401);
    }
    if (!isAdmin) return json({ success: false, error: "Admin access required." }, 403);

    service.invalidate();
    return json({ success: true, data: { revalidated: true } }, 200);
  }

  return { handleListVehicles, handleRevalidate };
}

/** Real fetchPublished: published vehicles + their images, via the publishable-key server client. */
function createSupabaseFetchPublished(): FetchPublished {
  return async () => {
    const client = getServerSupabaseClient();
    if (!client) return { vehicles: [], images: [] };

    const { data: vehicles, error: vehiclesError } = await client
      .from("vehicles")
      .select(VEHICLE_COLUMNS)
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (vehiclesError) throw vehiclesError;

    // postgrest-js's typed `.select()` overloads parse a literal query-string type to infer the
    // row shape; VEHICLE_COLUMNS is a plain `string` (built once, shared, not a literal at this
    // call site), so it falls back to a generic "unparseable string" type. `unknown` first is
    // the standard escape hatch for that — same shape as `select("*")` would have needed without
    // a generated `Database` type.
    const rows = (vehicles ?? []) as unknown as VehicleRow[];
    if (rows.length === 0) return { vehicles: [], images: [] };

    // sort_order first, created_at as a deterministic tiebreaker (matches rowToVehicle's own
    // in-memory sort, so a tie never depends on whatever order Postgres happened to return rows).
    const { data: images, error: imagesError } = await client
      .from("vehicle_images")
      .select(VEHICLE_IMAGE_COLUMNS)
      .in(
        "vehicle_id",
        rows.map((row) => row.id),
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (imagesError) throw imagesError;

    return { vehicles: rows, images: (images ?? []) as VehicleImageRow[] };
  };
}

/** Real verifyAdmin: throws for a missing/invalid/expired token; otherwise checks app_metadata.role. */
function createSupabaseVerifyAdmin(): VerifyAdmin {
  return async (token: string) => {
    const client = getServerSupabaseClient();
    if (!client) throw new Error("Supabase is not configured.");

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new Error("Invalid or expired token.");

    return data.user.app_metadata?.role === "admin";
  };
}

const vehicleService = createVehicleService({ fetchPublished: createSupabaseFetchPublished() });
const handlers = createVehicleHandlers({ service: vehicleService, verifyAdmin: createSupabaseVerifyAdmin() });

export const handleListVehicles = handlers.handleListVehicles;
export const handleRevalidate = handlers.handleRevalidate;
