/**
 * All admin reads/writes against Supabase for vehicles + their photos. Every exported
 * function that touches the network returns a resolved value or throws `Error(message)` —
 * callers (pages) are responsible for catching and surfacing errors.
 *
 * `deleteVehicle`/`reorderImages` split their logic into a `*WithClient` function that takes
 * a narrow, hand-typed client shape — that is the seam `vehicles-api.test.ts` uses to fake
 * Supabase without fighting structural-typing mismatches against the real `SupabaseClient`.
 */
import { getSupabaseClient } from "@/admin/lib/supabase";
import { RENDITION_WIDTHS, VEHICLE_PHOTO_BUCKET, renditionKey } from "@/lib/storage-paths";
import type { VehicleInput } from "@/lib/vehicle-validation";
import {
  isValidVehicleRow,
  VEHICLE_COLUMNS,
  VEHICLE_IMAGE_COLUMNS,
  inputToRow,
  rowToInput,
  type VehicleImageRow,
  type VehicleRow,
} from "@/lib/vehicle-rows";
import type { Make, VehicleStatus } from "@/types/vehicle";

type ImageStub = { path: string; sort_order: number };
type SupabaseError = { message: string } | null;

/** Lowest `sort_order` wins; used for the list page thumbnail. Pure, does not mutate input. */
export function pickFirstImagePath(images: readonly ImageStub[] | null): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.path ?? null;
}

/** Every rendition object key stored for one photo `path` (used to delete all sizes at once). */
export function renditionObjectKeys(path: string): string[] {
  return RENDITION_WIDTHS.map(width => renditionKey(path, width));
}

export function unwrap<T>(data: T | null, error: SupabaseError): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Supabase returned no data.");
  return data;
}

/**
 * `vehicle_rows.VehicleRow` has no ready-made image counterpart (`isValidVehicleRow` covers
 * only the vehicles table), so this mirrors its structural + numeric-finiteness checks for
 * `vehicle_images` — a corrupt/short-selected row is rejected here rather than cast through.
 */
function isValidVehicleImageRow(row: unknown): row is VehicleImageRow {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.vehicle_id !== "string" || typeof r.path !== "string") return false;
  if (typeof r.sort_order !== "number" || !Number.isFinite(r.sort_order)) return false;
  if (typeof r.alt !== "string") return false;
  if (r.focus_x !== null && typeof r.focus_x !== "number") return false;
  if (r.focus_y !== null && typeof r.focus_y !== "number") return false;
  if (r.focus_z !== null && typeof r.focus_z !== "number") return false;
  if (r.width !== null && typeof r.width !== "number") return false;
  if (r.height !== null && typeof r.height !== "number") return false;
  if (typeof r.created_at !== "string") return false;
  return true;
}

function unwrapVehicleRow(data: unknown, error: SupabaseError): VehicleRow {
  const row = unwrap(data, error);
  if (!isValidVehicleRow(row)) throw new Error("Received an invalid or corrupted vehicle row from Supabase.");
  return row;
}

function unwrapImageRow(data: unknown, error: SupabaseError): VehicleImageRow {
  const row = unwrap(data, error);
  if (!isValidVehicleImageRow(row)) throw new Error("Received an invalid or corrupted vehicle image row from Supabase.");
  return row;
}

export type AdminVehicleListItem = {
  id: string;
  slug: string;
  status: VehicleStatus;
  isFeatured: boolean;
  year: number;
  make: Make;
  model: string;
  trim: string;
  price: number;
  firstImagePath: string | null;
};

type VehicleListRow = {
  id: string;
  slug: string;
  status: VehicleStatus;
  is_featured: boolean;
  year: number;
  make: Make;
  model: string;
  trim: string;
  price: number;
  vehicle_images: ImageStub[] | null;
};

/** All vehicles including drafts, newest first within display order, each with its cover photo. */
export async function listVehicles(): Promise<AdminVehicleListItem[]> {
  const client = getSupabaseClient();
  // Deliberately narrower than VEHICLE_COLUMNS (a list-view thumbnail row, not the full model).
  const { data, error } = await client
    .from("vehicles")
    .select("id, slug, status, is_featured, year, make, model, trim, price, vehicle_images(path, sort_order)")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as VehicleListRow[];
  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    status: row.status,
    isFeatured: row.is_featured,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    price: row.price,
    firstImagePath: pickFirstImagePath(row.vehicle_images),
  }));
}

export type AdminVehicleDetail = { id: string; slug: string; input: VehicleInput; images: VehicleImageRow[] };

/** A single vehicle plus its ordered photos, or null when the id does not exist. */
export async function getVehicleWithImages(id: string): Promise<AdminVehicleDetail | null> {
  const client = getSupabaseClient();
  const { data: vehicleRow, error } = await client.from("vehicles").select(VEHICLE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!vehicleRow) return null;
  if (!isValidVehicleRow(vehicleRow)) throw new Error(`Vehicle ${id} has invalid or corrupted data.`);

  const { data: imageRows, error: imagesError } = await client
    .from("vehicle_images")
    .select(VEHICLE_IMAGE_COLUMNS)
    .eq("vehicle_id", id)
    .order("sort_order", { ascending: true });
  if (imagesError) throw new Error(imagesError.message);

  const images = (imageRows ?? []).map(row => {
    if (!isValidVehicleImageRow(row)) throw new Error(`Vehicle ${id} has an invalid or corrupted image row.`);
    return row;
  });

  return { id: vehicleRow.id, slug: vehicleRow.slug, input: rowToInput(vehicleRow), images };
}

/** Creates a vehicle. `slug` is generated once by the caller via `vehicleSlug` and never changes. */
export async function insertVehicle(input: VehicleInput, slug: string): Promise<VehicleRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("vehicles")
    .insert({ ...inputToRow(input), slug })
    .select(VEHICLE_COLUMNS)
    .single();
  return unwrapVehicleRow(data, error);
}

/** Updates every editable column; the slug column is never part of `inputToRow`'s output. */
export async function updateVehicle(id: string, input: VehicleInput): Promise<VehicleRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("vehicles")
    .update(inputToRow(input))
    .eq("id", id)
    .select(VEHICLE_COLUMNS)
    .single();
  return unwrapVehicleRow(data, error);
}

export async function setFeatured(id: string, isFeatured: boolean): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("vehicles").update({ is_featured: isFeatured }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setStatus(id: string, status: VehicleStatus): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("vehicles").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** The minimal Supabase surface `deleteVehicleWithClient` needs — easy to fake in tests. */
export type DeleteVehicleClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: { path: string }[] | null; error: SupabaseError }>;
    };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: SupabaseError }> };
  };
  storage: { from: (bucket: string) => { remove: (keys: string[]) => Promise<{ error: SupabaseError }> } };
};

/**
 * Removes every rendition object for every photo of the vehicle, then the row (images cascade).
 * Each of the three network calls fails with its own distinct message so callers/tests can
 * tell "couldn't read the photo list" apart from "couldn't delete storage objects" apart from
 * "couldn't delete the row".
 */
export async function deleteVehicleWithClient(client: DeleteVehicleClient, id: string): Promise<void> {
  const { data: imageRows, error: imagesError } = await client.from("vehicle_images").select("path").eq("vehicle_id", id);
  if (imagesError) throw new Error(`Could not read this vehicle's photos: ${imagesError.message}`);

  const paths = imageRows ?? [];
  const objectKeys = paths.flatMap(({ path }) => renditionObjectKeys(path));
  if (objectKeys.length > 0) {
    const { error: removeError } = await client.storage.from(VEHICLE_PHOTO_BUCKET).remove(objectKeys);
    if (removeError) throw new Error(`Could not delete stored photos: ${removeError.message}`);
  }

  const { error } = await client.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(`Could not delete the vehicle: ${error.message}`);
}

export async function deleteVehicle(id: string): Promise<void> {
  return deleteVehicleWithClient(getSupabaseClient() as unknown as DeleteVehicleClient, id);
}

export type NewVehicleImageInput = Omit<VehicleImageRow, "id" | "created_at">;

export async function insertImageRow(input: NewVehicleImageInput): Promise<VehicleImageRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from("vehicle_images").insert(input).select(VEHICLE_IMAGE_COLUMNS).single();
  return unwrapImageRow(data, error);
}

export type ImageRowPatch = Partial<Omit<VehicleImageRow, "id" | "vehicle_id" | "created_at">>;

export async function updateImageRow(id: string, patch: ImageRowPatch): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from("vehicle_images").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Deletes every rendition object for this photo, then its row. */
export async function deleteImageRow(image: Pick<VehicleImageRow, "id" | "path">): Promise<void> {
  const client = getSupabaseClient();
  const { error: removeError } = await client.storage
    .from(VEHICLE_PHOTO_BUCKET)
    .remove(renditionObjectKeys(image.path));
  if (removeError) throw new Error(removeError.message);

  const { error } = await client.from("vehicle_images").delete().eq("id", image.id);
  if (error) throw new Error(error.message);
}

/** The minimal Supabase surface `reorderImagesWithClient` needs — easy to fake in tests. */
export type ReorderRpcClient = {
  rpc: (
    fn: "reorder_vehicle_images",
    args: { p_vehicle_id: string; p_ids: string[] },
  ) => Promise<{ error: SupabaseError }>;
};

/**
 * Persists a full reorder atomically via the `reorder_vehicle_images` RPC (see
 * supabase/migrations): `orderedIds` must be exactly this vehicle's current image ids, in
 * their new order — the database sets `sort_order` to each id's position.
 */
export async function reorderImagesWithClient(
  client: ReorderRpcClient,
  vehicleId: string,
  orderedIds: readonly string[],
): Promise<void> {
  const { error } = await client.rpc("reorder_vehicle_images", { p_vehicle_id: vehicleId, p_ids: [...orderedIds] });
  if (error) throw new Error(error.message);
}

export async function reorderImages(vehicleId: string, orderedIds: readonly string[]): Promise<void> {
  return reorderImagesWithClient(getSupabaseClient() as unknown as ReorderRpcClient, vehicleId, orderedIds);
}
