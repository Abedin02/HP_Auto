/**
 * Rate-limit key for a request. Render routes traffic through Cloudflare, so the socket address
 * is the proxy's and the visitor's address arrives in headers. A client can forge those headers
 * when no proxy is in front, so I only read them when `trustProxy` is set.
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
