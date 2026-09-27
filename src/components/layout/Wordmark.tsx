import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="HP Auto — home" className={cn("group inline-flex items-baseline gap-2.5", className)}>
      <span className="font-display text-[1.9rem] leading-none italic text-champagne-bright transition-colors duration-500 group-hover:text-ivory">
        HP
      </span>
      <span className="eyebrow text-[0.62rem] tracking-[0.55em] text-ivory/80">Auto</span>
    </Link>
  );
}
