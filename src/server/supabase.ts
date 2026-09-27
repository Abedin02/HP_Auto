/**
 * Lazy server-side Supabase client using the publishable key, so RLS applies. The secret key only
 * lives in scripts/create-admin.ts. Session persistence and token refresh are off on the server.
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
