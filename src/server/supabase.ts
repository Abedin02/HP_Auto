/**
 * Lazy server-side Supabase client. Publishable key + RLS only — the server NEVER holds the
 * secret/service-role key (only scripts/create-admin.ts does). Session persistence is
 * irrelevant on the server, so it's disabled to avoid writing to disk / accidental refresh loops.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabaseConfig } from "./env";

let cachedClient: SupabaseClient | null | undefined;

export function getServerSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const config = getServerSupabaseConfig();
  if (!config) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
