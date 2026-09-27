import { useEffect, useRef, type RefObject } from "react";

/** Page regions that sit behind overlays. */
export const PAGE_REGIONS = {
  header: "[data-site-header]",
  main: "#main",
  footer: "[data-site-footer]",
} as const;

type ModalLayerOptions = {
  /** Selectors for regions to make inert while open (removed from tab order and the accessibility tree). */
  inertSelectors: readonly string[];
  /** Element that receives focus when the layer opens. */
  initialFocus: RefObject<HTMLElement | null>;
  onEscape?: () => void;
};

/**
 * Gives a hand-rolled overlay real modal behaviour: background inert, scroll locked,
 * focus moved in on open and restored to the trigger on close.
 */
export function useModalLayer(isOpen: boolean, { inertSelectors, initialFocus, onEscape }: ModalLayerOptions): void {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  const selectorKey = inertSelectors.join(",");

  useEffect(() => {
    if (!isOpen) return;

    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const regions = [...document.querySelectorAll<HTMLElement>(selectorKey)];
    regions.forEach(region => (region.inert = true));
    document.body.style.overflow = "hidden";
    initialFocus.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscapeRef.current?.();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      regions.forEach(region => (region.inert = false));
      document.body.style.overflow = "";
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isOpen, selectorKey, initialFocus]);
}
