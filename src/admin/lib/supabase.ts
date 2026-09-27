/**
 * Browser Supabase client for the admin app only. Public-site code must never import
 * `@supabase/supabase-js` (see CLAUDE.md); this module is exclusively for `src/admin/**`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "@/lib/public-env";

export const isSupabaseConfigured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true },
    })
  : null;

/** Throws if called while Supabase env vars are missing; guard with `isSupabaseConfigured` first. */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured — set BUN_PUBLIC_SUPABASE_URL and BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return supabase;
}
