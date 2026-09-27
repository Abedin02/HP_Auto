import { useRef } from "react";
import { PAGE_REGIONS, useModalLayer } from "@/hooks/use-modal-layer";
import { SHOWROOM_PHONE } from "@/lib/contact";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

/** The header stays interactive (it holds the close toggle); only the page behind goes inert. */
const INERT_BEHIND = [PAGE_REGIONS.main, PAGE_REGIONS.footer];

export function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  useModalLayer(isOpen, { inertSelectors: INERT_BEHIND, initialFocus: firstLinkRef, onEscape: onClose });

  return (
    <div
      id="mobile-menu"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pt-32 pb-10 transition-[clip-path] duration-900 ease-(--ease-luxe) lg:hidden",
        isOpen ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)]",
      )}
    >
      <nav aria-label="Mobile navigation">
        <ul className="space-y-2">
          {NAV_LINKS.map((link, i) => (
            <li key={link.to} className="overflow-hidden">
              <Link
                ref={i === 0 ? firstLinkRef : undefined}
                to={link.to}
                style={{ transitionDelay: isOpen ? `${150 + i * 70}ms` : "0ms" }}
                className={cn(
                  "flex items-baseline gap-4 py-2 transition-[transform,opacity] duration-700 ease-(--ease-luxe)",
                  isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                )}
              >
                <span className="eyebrow text-champagne">{link.index}</span>
                <span className="font-display text-5xl italic text-ivory">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-2 border-t border-line pt-6 text-sm text-mist">
        <p className="eyebrow text-champagne">Concierge line</p>
        <p className="font-display text-2xl text-ivory">{SHOWROOM_PHONE}</p>
        <p>Medford, New York · Nationwide enclosed delivery</p>
      </div>
    </div>
  );
}
