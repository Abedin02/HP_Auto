import type { PointerEvent } from "react";

/** Pointer handler for `.spotlight` elements: moves the radial highlight under the cursor. */
export function trackSpotlight(event: PointerEvent<HTMLElement>): void {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
}
