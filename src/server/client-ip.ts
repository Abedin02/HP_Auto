/**
 * Rate-limit key for a request. Behind a hosting proxy (Render routes every request through
 * Cloudflare) the socket address is the proxy's, so every visitor would share one bucket; the
 * real address arrives in headers instead. Those headers are client-controlled when nothing
 * sits in front of the server, so they are only read when `trustProxy` is set.
 */
export function resolveClientKey(headers: Headers, socketIp: string | undefined, trustProxy: boolean): string {
  if (trustProxy) {
    const trueClientIp = headers.get("true-client-ip")?.trim();
    if (trueClientIp) return trueClientIp;

    const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwardedFor) return forwardedFor;
  }
  return socketIp ?? "unknown";
}

/** Render sets RENDER=true on its services; TRUST_PROXY=true opts in on any other proxied host. */
export function isBehindTrustedProxy(env: Record<string, string | undefined> = process.env): boolean {
  return env.RENDER === "true" || env.TRUST_PROXY === "true";
}
