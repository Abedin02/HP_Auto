/** Shown while the initial `getSession()` call resolves. */
export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink text-ivory">
      <p className="eyebrow animate-pulse text-champagne">Loading…</p>
    </div>
  );
}
