import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable function reporting whether the component is still mounted. Use it to
 * guard `setState` calls made from a promise/callback that might resolve after unmount
 * (e.g. an in-flight Supabase request finishing after the user navigates away).
 */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
