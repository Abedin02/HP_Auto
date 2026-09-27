import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PAGE_REGIONS, useModalLayer } from "@/hooks/use-modal-layer";
import { cn } from "@/lib/utils";

type FilterDrawerProps = {
  isOpen: boolean;
  resultCount: number;
  onClose: () => void;
  children: ReactNode;
};

const INERT_BEHIND = [PAGE_REGIONS.header, PAGE_REGIONS.main, PAGE_REGIONS.footer];

/**
 * Mobile/tablet filter sheet. Portaled to <body> so the page (including <main>,
 * where it is declared) can be made inert behind it.
 */
export function FilterDrawer({ isOpen, resultCount, onClose, children }: FilterDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalLayer(isOpen, { inertSelectors: INERT_BEHIND, initialFocus: closeRef, onEscape: onClose });

  return createPortal(
    <div
      className={cn("fixed inset-0 z-[55] overflow-hidden lg:hidden", !isOpen && "pointer-events-none")}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div
        onClick={onClose}
        className={cn("absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-500", isOpen ? "opacity-100" : "opacity-0")}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-ink transition-transform duration-700 ease-(--ease-luxe)",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="font-display text-2xl">Refine</p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid size-10 place-items-center rounded-full hover:bg-ivory/5"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-8">{children}</div>
        <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} className="eyebrow w-full bg-champagne py-4 text-ink">
            Show {resultCount} {resultCount === 1 ? "car" : "cars"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
