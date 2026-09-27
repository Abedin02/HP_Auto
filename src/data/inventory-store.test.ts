import { describe, expect, test } from "bun:test";
import type { Vehicle } from "@/types/vehicle";
import { createInventoryStore, parseVehiclesEnvelope } from "./inventory-store";

function makeVehicle(id: string): Vehicle {
  return {
    id,
    stockNumber: `HP-${id}`,
    vinTail: "000000",
    year: 2022,
    make: "Porsche",
    model: "911",
    trim: "Carrera",
    price: 100_000,
    mileage: 5_000,
    bodyStyle: "Coupe",
    drivetrain: "RWD",
    powertrain: "Gasoline",
    transmission: "PDK",
    engine: "3.0L flat-six",
    horsepower: 400,
    torqueLbFt: 350,
    zeroToSixty: 3.5,
    topSpeedMph: 180,
    exteriorColor: "White",
    interiorColor: "Black",
    owners: 1,
    accidentFree: true,
    location: "Beverly Hills",
    characters: ["grand-touring"],
    highlights: [],
    story: "",
    images: [],
  };
}

/** Flushes the promise chain inside the store (fetch -> then/catch -> finally). */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createInventoryStore", () => {
  test("starts in the loading state before load() is called", () => {
    const store = createInventoryStore(() => Promise.resolve([]));
    expect(store.getSnapshot()).toEqual({ status: "loading" });
  });

  test("moves to ready with the fetched vehicles on success", async () => {
    const vehicles = [makeVehicle("a")];
    const store = createInventoryStore(() => Promise.resolve(vehicles));
    store.load();
    await flush();
    expect(store.getSnapshot()).toEqual({ status: "ready", data: vehicles });
  });

  test("moves to error with a message when the fetcher rejects", async () => {
    const store = createInventoryStore(() => Promise.reject(new Error("network down")));
    store.load();
    await flush();
    expect(store.getSnapshot()).toEqual({ status: "error", message: "network down" });
  });

  test("falls back to a generic message when the rejection is not an Error", async () => {
    const store = createInventoryStore(() => Promise.reject("nope"));
    store.load();
    await flush();
    const snapshot = store.getSnapshot();
    expect(snapshot.status).toBe("error");
  });

  test("load() only calls the fetcher once, even across repeated calls", async () => {
    let calls = 0;
    const store = createInventoryStore(() => {
      calls += 1;
      return Promise.resolve([]);
    });
    store.load();
    store.load();
    store.load();
    await flush();
    expect(calls).toBe(1);
  });

  test("dedupes concurrent loads: a slow in-flight fetch is not restarted", async () => {
    let calls = 0;
    const first = deferred<Vehicle[]>();
    const store = createInventoryStore(() => {
      calls += 1;
      return first.promise;
    });
    store.load();
    store.load();
    expect(store.getSnapshot()).toEqual({ status: "loading" });
    first.resolve([]);
    await flush();
    expect(calls).toBe(1);
    expect(store.getSnapshot()).toEqual({ status: "ready", data: [] });
  });

  test("does not load() again once ready", async () => {
    let calls = 0;
    const store = createInventoryStore(() => {
      calls += 1;
      return Promise.resolve([]);
    });
    store.load();
    await flush();
    store.load();
    await Promise.resolve();
    expect(calls).toBe(1);
  });

  test("retry() re-invokes the fetcher after an error and can recover", async () => {
    let attempt = 0;
    const store = createInventoryStore(() => {
      attempt += 1;
      return attempt === 1 ? Promise.reject(new Error("first try fails")) : Promise.resolve([makeVehicle("a")]);
    });
    store.load();
    await flush();
    expect(store.getSnapshot().status).toBe("error");

    store.retry();
    await flush();
    expect(store.getSnapshot()).toEqual({ status: "ready", data: [makeVehicle("a")] });
    expect(attempt).toBe(2);
  });

  test("notifies subscribers on every state transition and stops after unsubscribe", async () => {
    const store = createInventoryStore(() => Promise.resolve([]));
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });
    store.load();
    await flush();
    expect(notifications).toBeGreaterThan(0);

    const countAfterReady = notifications;
    unsubscribe();
    store.retry();
    await flush();
    expect(notifications).toBe(countAfterReady);
  });
});

describe("parseVehiclesEnvelope", () => {
  function validVehicle(id: string): Vehicle {
    return { ...makeVehicle(id), id };
  }

  test("throws when the payload is not an object", () => {
    expect(() => parseVehiclesEnvelope(null)).toThrow();
    expect(() => parseVehiclesEnvelope("nope")).toThrow();
    expect(() => parseVehiclesEnvelope(42)).toThrow();
  });

  test("throws when success is not true", () => {
    expect(() => parseVehiclesEnvelope({ success: false, error: "boom" })).toThrow();
    expect(() => parseVehiclesEnvelope({ data: [] })).toThrow();
  });

  test("throws when data is not an array", () => {
    expect(() => parseVehiclesEnvelope({ success: true, data: "not-an-array" })).toThrow();
    expect(() => parseVehiclesEnvelope({ success: true, data: null })).toThrow();
  });

  test("accepts a well-formed vehicle unchanged", () => {
    const vehicle = validVehicle("2022-porsche-911");
    expect(parseVehiclesEnvelope({ success: true, data: [vehicle] })).toEqual([vehicle]);
  });

  test("drops elements with an invalid enum field, keeping the valid ones", () => {
    const good = validVehicle("2022-porsche-911");
    const badBodyStyle = { ...good, id: "2022-porsche-911-2", bodyStyle: "Blimp" };
    expect(parseVehiclesEnvelope({ success: true, data: [good, badBodyStyle] })).toEqual([good]);
  });

  test("accepts any non-empty make, and drops a vehicle with an empty make", () => {
    const anyMake = { ...validVehicle("2022-yugo-911"), make: "Yugo" };
    expect(parseVehiclesEnvelope({ success: true, data: [anyMake] })).toEqual([anyMake]);

    const emptyMake = { ...validVehicle("2022-porsche-911"), make: "" };
    expect(parseVehiclesEnvelope({ success: true, data: [emptyMake] })).toEqual([]);
  });

  test("accepts null for the optional spec fields (transmission, horsepower, torque, 0-60, top speed)", () => {
    const nullableSpecs = {
      ...validVehicle("2022-porsche-911"),
      transmission: null,
      horsepower: null,
      torqueLbFt: null,
      zeroToSixty: null,
      topSpeedMph: null,
    };
    expect(parseVehiclesEnvelope({ success: true, data: [nullableSpecs] })).toEqual([nullableSpecs]);
  });

  test("drops a vehicle whose id is not a year-prefixed slug", () => {
    const badId = { ...validVehicle("2022-porsche-911"), id: "not-a-slug" };
    expect(parseVehiclesEnvelope({ success: true, data: [badId] })).toEqual([]);
  });

  test("drops a vehicle with a non-finite numeric field", () => {
    const badPrice = { ...validVehicle("2022-porsche-911"), price: Number.NaN };
    expect(parseVehiclesEnvelope({ success: true, data: [badPrice] })).toEqual([]);
  });

  test("drops a vehicle with a malformed image (empty storage path)", () => {
    const badImage = {
      ...validVehicle("2022-porsche-911"),
      images: [{ source: { kind: "storage", path: "" }, alt: "x" }],
    };
    expect(parseVehiclesEnvelope({ success: true, data: [badImage] })).toEqual([]);
  });

  test("accepts both unsplash and storage image sources, with optional focus/width/height", () => {
    const withImages: Vehicle = {
      ...validVehicle("2022-porsche-911"),
      images: [
        { source: { kind: "unsplash", photoId: "abc123" }, alt: "Hero shot" },
        {
          source: { kind: "storage", path: "veh-1/img-1" },
          alt: "Detail shot",
          focus: { x: 0.5, y: 0.4, z: 1.6 },
          width: 1200,
          height: 800,
        },
      ],
    };
    expect(parseVehiclesEnvelope({ success: true, data: [withImages] })).toEqual([withImages]);
  });

  test("drops a vehicle with an unknown image source kind", () => {
    const badSource = {
      ...validVehicle("2022-porsche-911"),
      images: [{ source: { kind: "cdn", url: "https://example.com/a.jpg" }, alt: "x" }],
    };
    expect(parseVehiclesEnvelope({ success: true, data: [badSource] })).toEqual([]);
  });

  test("a mixed valid/invalid list keeps only the valid entries, in order", () => {
    const first = validVehicle("2021-audi-rs6");
    const invalid = { ...first, id: "2021-audi-rs6-2", characters: ["not-a-character"] };
    const second = validVehicle("2023-bmw-m4");
    expect(parseVehiclesEnvelope({ success: true, data: [first, invalid, second] })).toEqual([first, second]);
  });
});
