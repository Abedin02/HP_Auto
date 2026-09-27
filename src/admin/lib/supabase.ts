/**
 * Browser Supabase client for the admin app. I keep `@supabase/supabase-js` out of the public
 * site, so only `src/admin/**` imports this module.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "@/lib/public-env";

export const isSupabaseConfigured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true },
    })
  : null;

/** Throws when the Supabase env vars are missing, so I check `isSupabaseConfigured` before calling it. */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured — set BUN_PUBLIC_SUPABASE_URL and BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local",
    );
  }
  return supabase;
}
