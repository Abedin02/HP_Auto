/**
 * Session store for the admin app: a single module-level cache fed by
 * `supabase.auth.getSession()` + `onAuthStateChange`, exposed to React via
 * `useSyncExternalStore` so every consumer re-renders in lockstep.
 */
import type { Session } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { getSupabaseClient } from "@/admin/lib/supabase";

export type SessionSnapshot = { session: Session | null; loading: boolean };

/**
 * Structural subset of a Supabase `Session` — enough to check the admin role without
 * pulling the full SDK type into test fixtures. A real `Session` satisfies this shape.
 */
export type SessionLike = {
  user?: {
    // Index signatures mirror supabase-js's `UserAppMetadata`/`UserMetadata` (both `[key: string]: any`)
    // so a real `Session` structurally satisfies this without a cast.
    app_metadata?: ({ role?: string } & Record<string, unknown>) | null;
    user_metadata?: ({ role?: string } & Record<string, unknown>) | null;
  } | null;
} | null;

/** Admin is decided by the JWT's `app_metadata.role`, never `user_metadata` (client-writable). */
export function isAdmin(session: SessionLike): boolean {
  return session?.user?.app_metadata?.role === "admin";
}

let snapshot: SessionSnapshot = { session: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function setSnapshot(next: SessionSnapshot): void {
  snapshot = next;
  listeners.forEach(listener => listener());
}

function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;

  const client = getSupabaseClient();
  client.auth.getSession().then(({ data }) => {
    setSnapshot({ session: data.session, loading: false });
  });
  client.auth.onAuthStateChange((_event, session) => {
    setSnapshot({ session, loading: false });
  });
}

function subscribe(onStoreChange: () => void): () => void {
  ensureInitialized();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): SessionSnapshot {
  return snapshot;
}

function getServerSnapshot(): SessionSnapshot {
  return { session: null, loading: true };
}

/** Current Supabase auth session, kept in sync across every mounted admin screen. */
export function useSession(): SessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
