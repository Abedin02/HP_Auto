import { useEffect, useState } from "react";

/** True once the page has scrolled past `threshold` pixels. */
export function useScrolled(threshold: number): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return isScrolled;
}
