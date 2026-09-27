import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { CarImage } from "@/components/vehicle/CarImage";
import { useFeaturedVehicles } from "@/hooks/use-inventory";
import { formatPrice } from "@/lib/format";
import { Link } from "@/lib/router";
import type { Vehicle } from "@/types/vehicle";

export function ShowroomRail() {
  const { state } = useFeaturedVehicles();
  // Nothing to showcase yet (still loading, errored, or no featured cars): the section adds no
  // value without cars, so it simply doesn't render rather than showing an empty rail.
  if (state.status !== "ready" || state.data.length === 0) return null;
  return <ShowroomRailContent vehicles={state.data} />;
}

function ShowroomRailContent({ vehicles }: { vehicles: Vehicle[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      setProgress(max > 0 ? rail.scrollLeft / max : 0);
    };
    update();
    rail.addEventListener("scroll", update, { passive: true });
    return () => rail.removeEventListener("scroll", update);
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.querySelector("li");
    if (!rail || !card) return;
    rail.scrollBy({ left: direction * (card.clientWidth + 24), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="showroom-title" className="py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeading
          eyebrow="On the floor this month"
          title={
            <span id="showroom-title">
              The showroom, <em className="text-gilded">curated.</em>
            </span>
          }
          aside={
            <div className="flex gap-3">
              <RailButton label="Previous cars" onClick={() => scrollByCard(-1)}>
                <ArrowLeft className="size-4" />
              </RailButton>
              <RailButton label="Next cars" onClick={() => scrollByCard(1)}>
                <ArrowRight className="size-4" />
              </RailButton>
            </div>
          }
        />
      </div>

      <ul
        ref={railRef}
        className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-5 md:px-10 xl:px-[max(2.5rem,calc((100vw-1600px)/2+2.5rem))]"
      >
        {vehicles.map((vehicle, i) => (
          <li key={vehicle.id} className="w-[82vw] shrink-0 snap-start sm:w-[46vw] lg:w-[31vw] xl:w-[27rem]">
            <ShowroomCard vehicle={vehicle} index={i} />
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-[1600px] px-5 md:px-10">
        <div className="h-px bg-line">
          <div
            className="h-px origin-left bg-champagne transition-transform duration-300"
            style={{ transform: `scaleX(${Math.max(0.08, progress)})` }}
          />
        </div>
        <Link to="/inventory" className="eyebrow mt-6 inline-flex items-center gap-3 text-ivory/70 hover:text-champagne">
          View all vehicles <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

function ShowroomCard({ vehicle, index }: { vehicle: Vehicle; index: number }) {
  const hero = vehicle.images[0];
  return (
    <Link to={`/vehicle/${vehicle.id}`} className="group relative block aspect-[3/4] overflow-hidden bg-surface">
      {hero && (
        <CarImage
          source={hero.source}
          alt={hero.alt}
          aspect={3 / 4}
          focus={hero.focus}
          sizes="(min-width: 1280px) 27rem, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 82vw"
          className="size-full transition-transform duration-[1800ms] ease-(--ease-luxe) group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30 transition-opacity duration-700 group-hover:opacity-80" />
      <span className="absolute top-5 left-6 font-display text-7xl text-ivory/15 italic transition-colors duration-700 group-hover:text-champagne/40">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="eyebrow text-[0.6rem] text-champagne">
          {vehicle.year} · {vehicle.make}
        </p>
        <h3 className="mt-2 font-display text-3xl leading-tight">{vehicle.model}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-ivory/20 pt-4 text-sm">
          <span className="text-ivory/85">{formatPrice(vehicle.price)}</span>
          <span className="flex translate-x-2 items-center gap-2 text-champagne opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
            Discover <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-14 place-items-center rounded-full border border-line text-ivory transition-all duration-500 hover:border-champagne hover:bg-champagne hover:text-ink"
    >
      {children}
    </button>
  );
}
