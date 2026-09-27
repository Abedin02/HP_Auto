import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CarImage } from "@/components/vehicle/CarImage";
import { PHOTOS } from "@/data/photos";
import { useFeaturedVehicles } from "@/hooks/use-inventory";
import { formatPrice, vehicleTitle } from "@/lib/format";
import { unsplash } from "@/lib/images";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import type { ImageSource, Vehicle } from "@/types/vehicle";

const SLIDE_MS = 7000;
const MAX_FEATURED_SLIDES = 3;

type Slide = { key: string; source: ImageSource; alt: string; vehicle?: Vehicle };

/** Shown while the inventory is loading, empty, or has no featured cars yet. */
const MARKETING_SLIDES: readonly Slide[] = [
  { key: "amg-gtr", source: unsplash(PHOTOS.amgGtrMonaco), alt: "Matte black Mercedes-AMG GT R on the Monaco harbour" },
  { key: "gt3-rs", source: unsplash(PHOTOS.porscheGt3RsShowroom), alt: "Porsche 911 GT3 RS in a dark showroom" },
  { key: "aventador", source: unsplash(PHOTOS.aventadorDesert), alt: "Lamborghini Aventador with doors raised at desert sunset" },
];

const HEADLINE = [
  { text: "Rare machines,", className: "" },
  { text: "delivered with", className: "" },
  { text: "ceremony.", className: "italic text-gilded" },
];

function featuredSlides(vehicles: readonly Vehicle[]): Slide[] {
  return vehicles
    .filter(vehicle => vehicle.images.length > 0)
    .slice(0, MAX_FEATURED_SLIDES)
    .map(vehicle => {
      const hero = vehicle.images[0]!;
      return { key: vehicle.id, source: hero.source, alt: hero.alt, vehicle };
    });
}

export function Hero() {
  const { state } = useFeaturedVehicles();
  const slides = useMemo(() => (state.status === "ready" ? featuredSlides(state.data) : []), [state]);
  const activeSlides = slides.length > 0 ? slides : MARKETING_SLIDES;

  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, activeSlides.length - 1);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(current => (current + 1) % activeSlides.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [active, activeSlides.length]);

  const slide = activeSlides[activeIndex]!;

  return (
    <section aria-label="Featured" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {activeSlides.map((s, i) => (
        <div
          key={s.key}
          aria-hidden={i !== activeIndex}
          className={cn(
            "absolute inset-0 -z-20 transition-opacity duration-[1800ms] ease-(--ease-luxe)",
            i === activeIndex ? "opacity-100" : "opacity-0",
          )}
        >
          <CarImage
            key={i === activeIndex ? `on-${activeIndex}` : "off"}
            source={s.source}
            alt={s.alt}
            priority={i === 0}
            className={cn("size-full", i === activeIndex && "animate-kenburns")}
          />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,oklch(0.145_0.004_70/0.55)_60%,oklch(0.145_0.004_70/0.95)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-5 pt-40 pb-16 md:px-10 lg:grid-cols-12 lg:items-end lg:pb-20">
        <div className="lg:col-span-8">
          <p className="eyebrow animate-fade-up text-champagne">Medford, New York · Delivered nationwide</p>
          <h1 className="mt-6 font-display text-[clamp(3.2rem,8.4vw,9rem)] leading-[0.92]">
            {HEADLINE.map((line, i) => (
              <span key={line.text} className="-mb-[0.22em] block overflow-hidden pb-[0.28em]">
                <span
                  className={cn("animate-rise block", line.className)}
                  style={{ animationDelay: `${200 + i * 140}ms` }}
                >
                  {line.text}
                </span>
              </span>
            ))}
          </h1>
          <p className="animate-fade-up mt-8 max-w-xl text-lg leading-relaxed text-ivory/75 [animation-delay:700ms]">
            A curated collection of cars. Each one passes a 172-point inspection, arrives
            in an enclosed transporter, and opt-in warenty.
          </p>
          <div className="animate-fade-up mt-10 flex flex-wrap gap-4 [animation-delay:850ms]">
            <Button asChild variant="luxe" size="xl">
              <Link to="/inventory">
                Enter the collection <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="luxe-outline" size="xl" className="text-ivory">
              <Link to="/concierge">Visit the showroom</Link>
            </Button>
          </div>
        </div>

        <aside className="animate-fade-up lg:col-span-4 [animation-delay:1000ms]" aria-label="Currently showing">
          {slide.vehicle && (
            <Link
              to={`/vehicle/${slide.vehicle.id}`}
              className="group block border border-ivory/15 bg-ink/35 p-6 backdrop-blur-xl transition-colors hover:border-champagne/50"
            >
              <p className="eyebrow flex justify-between text-[0.6rem] text-mist">
                <span>Now showing</span>
                <span className="text-ivory">
                  0{activeIndex + 1} / 0{activeSlides.length}
                </span>
              </p>
              <p key={slide.vehicle.id} className="animate-fade-up mt-5 font-display text-3xl leading-tight">
                {vehicleTitle(slide.vehicle)}
              </p>
              <p className="mt-3 flex items-center justify-between text-sm text-ivory/70">
                <span>{formatPrice(slide.vehicle.price)}</span>
                <span className="inline-flex items-center gap-1.5 text-champagne transition-transform group-hover:translate-x-1">
                  View car <ArrowRight className="size-3.5" />
                </span>
              </p>
            </Link>
          )}
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Choose featured car">
            {activeSlides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setActive(i)}
                className="relative h-8 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-px bg-ivory/20" />
                {i === activeIndex && (
                  <span
                    key={`progress-${activeIndex}`}
                    className="absolute inset-x-0 top-1/2 h-px origin-left bg-champagne"
                    style={{ animation: `progress ${SLIDE_MS}ms linear both` }}
                  />
                )}
                {i < activeIndex && <span className="absolute inset-x-0 top-1/2 h-px bg-ivory/60" />}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div aria-hidden className="absolute bottom-0 left-1/2 hidden h-16 w-px -translate-x-1/2 overflow-hidden md:block">
        <span className="animate-scroll-cue block h-full w-px bg-champagne" />
      </div>
    </section>
  );
}
