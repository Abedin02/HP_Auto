/**
 * Minimal History-API router. Bun serves index.html for every unmatched path
 * (see src/index.ts), so deep links such as /vehicle/:id work on refresh.
 */
import { useCallback, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent, type Ref } from "react";

const NAVIGATE_EVENT = "hp:navigate";

export type RouteParams = Record<string, string>;

/** A lone "%" in a hand-typed or truncated link makes decodeURIComponent throw. */
function safeDecode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function matchRoute(pattern: string, pathname: string): RouteParams | null {
  const split = (path: string) => path.split("/").filter(Boolean);
  const patternParts = split(pattern);
  const pathParts = split(pathname);
  if (patternParts.length !== pathParts.length) return null;

  const params: RouteParams = {};
  for (let i = 0; i < patternParts.length; i++) {
    const expected = patternParts[i]!;
    const actual = pathParts[i]!;
    if (expected.startsWith(":")) {
      const decoded = safeDecode(actual);
      if (decoded === null) return null;
      params[expected.slice(1)] = decoded;
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

type NavigateOptions = { replace?: boolean; preserveScroll?: boolean };

export function navigate(to: string, { replace = false, preserveScroll = false }: NavigateOptions = {}): void {
  if (replace) history.replaceState(null, "", to);
  else history.pushState(null, "", to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));

  const hash = new URL(to, location.href).hash;
  if (hash) {
    // The store update renders synchronously, so the target exists by the next frame.
    requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }));
  } else if (!preserveScroll) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

/** Scrolls to the URL hash on first load (e.g. a shared #showroom-title link). */
export function scrollToInitialHash(): void {
  if (!location.hash) return;
  requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(NAVIGATE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(NAVIGATE_EVENT, onChange);
  };
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => location.pathname);
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const search = useSyncExternalStore(subscribe, () => location.search);
  const setSearch = useCallback((next: URLSearchParams) => {
    const query = next.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`, { replace: true, preserveScroll: true });
  }, []);
  return [new URLSearchParams(search), setSearch];
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; ref?: Ref<HTMLAnchorElement> };

export function Link({ to, onClick, target, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || isModified || event.button !== 0 || target === "_blank") return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} target={target} onClick={handleClick} {...rest} />;
}
