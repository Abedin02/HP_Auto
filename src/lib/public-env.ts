/**
 * Browser-visible configuration. Bun inlines `process.env.BUN_PUBLIC_*` into client
 * bundles (bunfig.toml for `bun dev`, `env` in build.ts for `bun run build`), so only
 * values that are safe to publish may live here. 
 *
 * Bun only inlines variables that are actually set; an unset one stays as a raw `process.env.X`
 * reference, which throws in the browser. `readEnv` keeps the literal expression (so inlining still
 * works) but turns that ReferenceError into `undefined` so the fallback applies.
 */
function readEnv(read: () => string | undefined): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

export const PUBLIC_SUPABASE_URL =
  readEnv(() => process.env.BUN_PUBLIC_SUPABASE_URL) ?? "https://fdohgagbqkgqfuwcaekz.supabase.co";
export const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  readEnv(() => process.env.BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
  "sb_publishable_4ETGyKTXeFiIHz5-OI3P2Q_csjKUSee";
