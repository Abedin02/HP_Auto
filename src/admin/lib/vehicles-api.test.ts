import { describe, expect, test } from "bun:test";
import {
  deleteVehicleWithClient,
  pickFirstImagePath,
  renditionObjectKeys,
  reorderImagesWithClient,
  unwrap,
  type DeleteVehicleClient,
  type ReorderRpcClient,
} from "./vehicles-api";

describe("pickFirstImagePath", () => {
  test("returns null when there are no images", () => {
    expect(pickFirstImagePath(null)).toBeNull();
    expect(pickFirstImagePath([])).toBeNull();
  });

  test("picks the image with the lowest sort_order", () => {
    const images = [
      { path: "veh1/img2", sort_order: 2 },
      { path: "veh1/img0", sort_order: 0 },
      { path: "veh1/img1", sort_order: 1 },
    ];
    expect(pickFirstImagePath(images)).toBe("veh1/img0");
  });

  test("does not mutate the input array while sorting", () => {
    const images = [
      { path: "b", sort_order: 2 },
      { path: "a", sort_order: 1 },
    ];
    const copy = [...images];
    pickFirstImagePath(images);
    expect(images).toEqual(copy);
  });
});

describe("renditionObjectKeys", () => {
  test("returns one storage object key per rendition width", () => {
    const keys = renditionObjectKeys("veh1/img1");
    expect(keys).toEqual(["veh1/img1/w480.webp", "veh1/img1/w800.webp", "veh1/img1/w1200.webp", "veh1/img1/w1800.webp"]);
  });
});

describe("unwrap", () => {
  test("returns the data when there is no error", () => {
    expect(unwrap({ id: "1" }, null)).toEqual({ id: "1" });
  });

  test("throws the Supabase error message when error is set", () => {
    expect(() => unwrap(null, { message: "network down" })).toThrow("network down");
    expect(() => unwrap({ id: "1" }, { message: "conflict" })).toThrow("conflict");
  });

  test("throws when data is null and there is no error", () => {
    expect(() => unwrap(null, null)).toThrow(/no data/i);
  });
});

/** A fake `DeleteVehicleClient` whose three calls can each be made to fail independently. */
function fakeDeleteClient(options: {
  images?: { data: { path: string }[] | null; error: { message: string } | null };
  remove?: { error: { message: string } | null };
  rowDelete?: { error: { message: string } | null };
}): { client: DeleteVehicleClient; removedKeys: string[][] } {
  const removedKeys: string[][] = [];
  const client: DeleteVehicleClient = {
    from: () => ({
      select: () => ({
        eq: async () => options.images ?? { data: [], error: null },
      }),
      delete: () => ({
        eq: async () => options.rowDelete ?? { error: null },
      }),
    }),
    storage: {
      from: () => ({
        remove: async (keys: string[]) => {
          removedKeys.push(keys);
          return options.remove ?? { error: null };
        },
      }),
    },
  };
  return { client, removedKeys };
}

describe("deleteVehicleWithClient", () => {
  test("removes every rendition object for every photo, then deletes the row", async () => {
    const { client, removedKeys } = fakeDeleteClient({
      images: { data: [{ path: "veh1/img1" }, { path: "veh1/img2" }], error: null },
    });

    await deleteVehicleWithClient(client, "veh1");

    expect(removedKeys).toHaveLength(1);
    expect(removedKeys[0]).toHaveLength(8); // 2 photos * 4 renditions each
  });

  test("propagates a distinct error when reading the photo list fails", async () => {
    const { client } = fakeDeleteClient({ images: { data: null, error: { message: "read failed" } } });
    await expect(deleteVehicleWithClient(client, "veh1")).rejects.toThrow(/could not read this vehicle's photos/i);
  });

  test("propagates a distinct error when removing storage objects fails", async () => {
    const { client } = fakeDeleteClient({
      images: { data: [{ path: "veh1/img1" }], error: null },
      remove: { error: { message: "storage down" } },
    });
    await expect(deleteVehicleWithClient(client, "veh1")).rejects.toThrow(/could not delete stored photos/i);
  });

  test("propagates a distinct error when deleting the row fails", async () => {
    const { client } = fakeDeleteClient({
      images: { data: [], error: null },
      rowDelete: { error: { message: "fk violation" } },
    });
    await expect(deleteVehicleWithClient(client, "veh1")).rejects.toThrow(/could not delete the vehicle/i);
  });

  test("skips the storage call entirely when the vehicle has no photos", async () => {
    const { client, removedKeys } = fakeDeleteClient({ images: { data: [], error: null } });
    await deleteVehicleWithClient(client, "veh1");
    expect(removedKeys).toHaveLength(0);
  });
});

describe("reorderImagesWithClient", () => {
  test("calls the reorder_vehicle_images RPC with the vehicle id and the ordered ids", async () => {
    const captured: { args?: { p_vehicle_id: string; p_ids: string[] } } = {};
    const client: ReorderRpcClient = {
      rpc: async (_fn, args) => {
        captured.args = args;
        return { error: null };
      },
    };

    await reorderImagesWithClient(client, "veh1", ["img-b", "img-a", "img-c"]);

    expect(captured.args).toEqual({ p_vehicle_id: "veh1", p_ids: ["img-b", "img-a", "img-c"] });
  });

  test("propagates an RPC error", async () => {
    const client: ReorderRpcClient = { rpc: async () => ({ error: { message: "rpc failed" } }) };
    await expect(reorderImagesWithClient(client, "veh1", ["img-a"])).rejects.toThrow("rpc failed");
  });
});
