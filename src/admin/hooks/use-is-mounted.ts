import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable function reporting whether the component is still mounted. I check it before
 * `setState` in callbacks that can resolve after unmount, like a Supabase request that finishes
 * after the admin navigates away.
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
