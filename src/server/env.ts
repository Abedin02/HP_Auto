/**
 * Server-side Supabase configuration, separate from the browser's BUN_PUBLIC_* vars in
 * src/lib/public-env.ts. I only read these on the server, so they never end up in a bundle.
 */
export type ServerSupabaseConfig = {
  url: string;
  publishableKey: string;
};

let warnedMissingConfig = false;

/** Returns null (and logs once) when SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are not configured. */
export function getServerSupabaseConfig(): ServerSupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (!warnedMissingConfig) {
      console.error(
        "[supabase] SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are not configured; the public API will serve an empty inventory.",
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  return { url, publishableKey };
}
