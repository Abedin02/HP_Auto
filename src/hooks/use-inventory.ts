/**
 * Public-site inventory hooks. All read from the single shared inventoryStore
 * (src/data/inventory-store.ts) via useSyncExternalStore, and trigger the first
 * load on mount — mirrors the external-store pattern in src/hooks/use-garage.ts.
 */
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getSimilarVehicles } from "@/data/inventory";
import { inventoryStore, type AsyncState, type InventoryState } from "@/data/inventory-store";
import type { Vehicle } from "@/types/vehicle";

type UseAsync<T> = { state: AsyncState<T>; retry: () => void };

function useInventoryState(): InventoryState {
  const state = useSyncExternalStore(inventoryStore.subscribe, inventoryStore.getSnapshot, inventoryStore.getSnapshot);
  useEffect(() => {
    inventoryStore.load();
  }, []);
  return state;
}

export function useInventory(): UseAsync<readonly Vehicle[]> {
  const state = useInventoryState();
  return { state, retry: inventoryStore.retry };
}

export function useVehicle(slug: string): UseAsync<Vehicle | null> {
  const state = useInventoryState();
  const derived = useMemo<AsyncState<Vehicle | null>>(() => {
    if (state.status !== "ready") return state;
    return { status: "ready", data: state.data.find(vehicle => vehicle.id === slug) ?? null };
  }, [state, slug]);
  return { state: derived, retry: inventoryStore.retry };
}

export function useFeaturedVehicles(): UseAsync<Vehicle[]> {
  const state = useInventoryState();
  const derived = useMemo<AsyncState<Vehicle[]>>(() => {
    if (state.status !== "ready") return state;
    return { status: "ready", data: state.data.filter(vehicle => vehicle.isFeatured) };
  }, [state]);
  return { state: derived, retry: inventoryStore.retry };
}

export function useVehiclesByIds(ids: readonly string[]): UseAsync<Vehicle[]> {
  const state = useInventoryState();
  const derived = useMemo<AsyncState<Vehicle[]>>(() => {
    if (state.status !== "ready") return state;
    const byId = new Map(state.data.map(vehicle => [vehicle.id, vehicle]));
    return { status: "ready", data: ids.map(id => byId.get(id)).filter((v): v is Vehicle => v !== undefined) };
  }, [state, ids]);
  return { state: derived, retry: inventoryStore.retry };
}

export function useSimilarVehicles(vehicle: Vehicle | null | undefined, limit: number): UseAsync<Vehicle[]> {
  const state = useInventoryState();
  const derived = useMemo<AsyncState<Vehicle[]>>(() => {
    if (state.status !== "ready") return state;
    return { status: "ready", data: vehicle ? getSimilarVehicles(vehicle, limit, state.data) : [] };
  }, [state, vehicle, limit]);
  return { state: derived, retry: inventoryStore.retry };
}
