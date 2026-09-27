/**
 * "My Garage": vehicles the visitor has saved. Persisted per-browser in
 * localStorage; storage failures (private mode, blocked storage) degrade to
 * an in-memory list rather than breaking the page.
 */
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "hp-auto:garage";
const listeners = new Set<() => void>();

function readStorage(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

let saved: readonly string[] = readStorage();

function commit(next: readonly string[]): void {
  saved = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: keep the in-memory copy for this session.
  }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useGarage() {
  const ids = useSyncExternalStore(subscribe, () => saved);

  const toggle = useCallback((id: string) => {
    commit(saved.includes(id) ? saved.filter(savedId => savedId !== id) : [...saved, id]);
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, isSaved };
}
