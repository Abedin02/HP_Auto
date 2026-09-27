import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  sharedObserver ??= new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "shown";
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  return sharedObserver;
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
};

/** Fades and lifts its content into view once, the first time it scrolls on screen. */
export function Reveal({ children, as: Tag = "div", delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = getObserver();
    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  return (
    <Tag ref={ref} data-reveal="hidden" style={style} className={className}>
      {children}
    </Tag>
  );
}
