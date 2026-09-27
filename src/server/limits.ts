type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  /** Upper bound on tracked clients, so memory stays bounded however many IPs appear. */
  maxClients: number;
};

type Window = { start: number; count: number };

/**
 * Fixed-window counter: constant memory per client, and rejected requests cost
 * nothing extra. When the table is full of *active* windows, new clients are
 * refused (fail closed) rather than evicting someone, because any eviction
 * would let a flood of fresh IPs reset an abuser's limit.
 */
export function createRateLimiter({ limit, windowMs, maxClients }: RateLimiterOptions) {
  const windows = new Map<string, Window>();

  const evictExpired = (now: number) => {
    for (const [key, window] of windows) {
      if (now - window.start >= windowMs) windows.delete(key);
    }
  };

  return {
    isLimited(clientKey: string, now: number): boolean {
      const current = windows.get(clientKey);
      if (current && now - current.start < windowMs) {
        if (current.count >= limit) return true;
        windows.set(clientKey, { start: current.start, count: current.count + 1 });
        return false;
      }

      if (!current && windows.size >= maxClients) {
        evictExpired(now);
        if (windows.size >= maxClients) return true;
      }
      windows.set(clientKey, { start: now, count: 1 });
      return false;
    },
    size: () => windows.size,
  };
}
