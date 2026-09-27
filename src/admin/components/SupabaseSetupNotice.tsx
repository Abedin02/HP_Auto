/** Rendered instead of the app when the BUN_PUBLIC_SUPABASE_* env vars are missing. */
export function SupabaseSetupNotice() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow text-champagne">Setup required</p>
      <h1 className="font-display text-3xl">Supabase is not configured</h1>
      <p className="text-muted-foreground">
        Set <code className="text-ivory">BUN_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-ivory">BUN_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
        <code className="text-ivory">.env.local</code>, then restart the dev server.
      </p>
    </div>
  );
}
