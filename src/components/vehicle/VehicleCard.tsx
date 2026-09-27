import { ArrowUpRight } from "lucide-react";
import { estimatedMonthly } from "@/lib/estimate";
import { formatMileage, formatNumber, formatPrice, vehicleTitle } from "@/lib/format";
import { Link } from "@/lib/router";
import { trackSpotlight } from "@/lib/spotlight";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/vehicle";
import { CarImage } from "./CarImage";
import { SaveButton } from "./SaveButton";

type VehicleCardProps = {
  vehicle: Vehicle;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function VehicleCard({ vehicle, className, sizes, priority }: VehicleCardProps) {
  const title = vehicleTitle(vehicle);
  const hero = vehicle.images[0];
  const horsepowerLabel = vehicle.horsepower !== null ? `${formatNumber(vehicle.horsepower)} hp` : "—";
  const zeroToSixtyLabel = vehicle.zeroToSixty !== null ? `${vehicle.zeroToSixty.toFixed(1)}s 0–60` : "—";

  return (
    <article
      onPointerMove={trackSpotlight}
      className={cn(
        "spotlight group relative flex flex-col overflow-hidden border border-line bg-surface transition-colors duration-700 ease-(--ease-luxe) hover:border-champagne/40",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {hero && (
          <CarImage
            source={hero.source}
            alt={hero.alt}
            aspect={4 / 3}
            focus={hero.focus}
            sizes={sizes ?? "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"}
            priority={priority}
            className="size-full transition-transform duration-[1600ms] ease-(--ease-luxe) group-hover:scale-[1.06]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
        <div className="absolute top-4 left-4 flex gap-2">
          {vehicle.isFeatured && (
            <span className="eyebrow border border-champagne/60 bg-ink/60 px-2.5 py-1.5 text-[0.58rem] text-champagne backdrop-blur">
              Featured
            </span>
          )}
          {vehicle.isNewArrival && (
            <span className="eyebrow bg-champagne px-2.5 py-1.5 text-[0.58rem] text-ink">New arrival</span>
          )}
          {vehicle.powertrain !== "Gasoline" && (
            <span className="eyebrow border border-ivory/30 bg-ink/50 px-2.5 py-1.5 text-[0.58rem] text-ivory backdrop-blur">
              {vehicle.powertrain}
            </span>
          )}
        </div>
        <SaveButton vehicleId={vehicle.id} label={title} className="absolute top-3.5 right-3.5 z-20" />
        <p className="absolute bottom-4 left-4 font-display text-sm text-ivory/80 italic">
          No. {vehicle.stockNumber.slice(-3)}
        </p>
      </div>

      <div className="relative flex flex-1 flex-col gap-5 p-6">
        <div>
          <p className="eyebrow text-[0.62rem] text-champagne">
            {vehicle.year} · {vehicle.make}
          </p>
          <h3 className="mt-2 font-display text-[1.7rem] leading-tight">
            <Link to={`/vehicle/${vehicle.id}`} className="after:absolute after:inset-0 after:z-10">
              {vehicle.model}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-mist">{vehicle.trim}</p>
        </div>

        <dl className="grid grid-cols-3 border-y border-line py-3 text-center text-xs">
          <div>
            <dt className="sr-only">Mileage</dt>
            <dd className="text-ivory/85">{formatMileage(vehicle.mileage)}</dd>
          </div>
          <div className="border-x border-line">
            <dt className="sr-only">Horsepower</dt>
            <dd className="text-ivory/85">{horsepowerLabel}</dd>
          </div>
          <div>
            <dt className="sr-only">0 to 60 mph</dt>
            <dd className="text-ivory/85">{zeroToSixtyLabel}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-2xl">{formatPrice(vehicle.price)}</p>
            <p className="text-xs text-mist">est. {formatPrice(estimatedMonthly(vehicle.price))}/mo</p>
          </div>
          <span className="grid size-10 place-items-center rounded-full border border-line text-ivory/70 transition-all duration-500 group-hover:rotate-45 group-hover:border-champagne group-hover:bg-champagne group-hover:text-ink">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
