import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { GalleryFrame } from "@/lib/images";
import { cn } from "@/lib/utils";
import { CarImage } from "../CarImage";

const MAIN_ASPECT = 16 / 10;

export function Gallery({ frames }: { frames: readonly GalleryFrame[] }) {
  const [active, setActive] = useState(0);
  const count = frames.length;
  const go = (delta: number) => setActive(i => (i + delta + count) % count);

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  };

  return (
    <div>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Vehicle photos"
        tabIndex={0}
        onKeyDown={handleKey}
        className="group relative aspect-[16/10] overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        {frames.map((frame, i) => (
          <div
            key={frame.key}
            aria-hidden={i !== active}
            className={cn(
              "absolute inset-0 transition-[opacity,transform] duration-1000 ease-(--ease-luxe)",
              i === active ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
            )}
          >
            <CarImage
              source={frame.source}
              alt={frame.alt}
              aspect={MAIN_ASPECT}
              focus={frame.focus}
              priority={i === 0}
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="size-full"
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />

        {count > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
          </>
        )}
        <p className="absolute bottom-5 left-6 font-display text-lg text-ivory" aria-live="polite">
          <span className="text-2xl">{String(active + 1).padStart(2, "0")}</span>
          <span className="text-ivory/50"> / {String(count).padStart(2, "0")}</span>
        </p>
      </div>

      {/* Padding keeps the active thumbnail's offset ring from being clipped by the scroller. */}
      {count > 1 && (
        <ul className="no-scrollbar mt-1 flex gap-3 overflow-x-auto p-1.5" aria-label="Choose photo">
          {frames.map((frame, i) => (
            <li key={frame.key} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-[16/10] w-28 overflow-hidden transition-opacity duration-500 md:w-36",
                  i === active ? "opacity-100 ring-1 ring-champagne ring-offset-2 ring-offset-ink" : "opacity-45 hover:opacity-80",
                )}
              >
                <CarImage source={frame.source} alt="" aspect={MAIN_ASPECT} focus={frame.focus} sizes="9rem" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ArrowLeft : ArrowRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/25 bg-ink/40 text-ivory opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-champagne hover:text-ink max-md:opacity-100",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
