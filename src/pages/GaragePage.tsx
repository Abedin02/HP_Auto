import { AsyncView } from "@/components/layout/AsyncView";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useGarage } from "@/hooks/use-garage";
import { useVehiclesByIds } from "@/hooks/use-inventory";
import { formatPrice } from "@/lib/format";
import { Link } from "@/lib/router";
import type { Vehicle } from "@/types/vehicle";

export function GaragePage() {
  useDocumentTitle("My Garage — HP Auto");
  const { ids } = useGarage();
  const { state, retry } = useVehiclesByIds(ids);

  return (
    <div className="mx-auto min-h-[80svh] max-w-[1600px] px-5 pt-40 pb-24 md:px-10">
      <AsyncView
        state={state}
        onRetry={retry}
        loading={<p className="animate-pulse text-mist">Loading your garage…</p>}
        loadingLabel="Loading your garage…"
      >
        {vehicles => <GarageContent vehicles={vehicles} />}
      </AsyncView>
    </div>
  );
}

function GarageContent({ vehicles }: { vehicles: readonly Vehicle[] }) {
  const total = vehicles.reduce((sum, v) => sum + v.price, 0);

  return (
    <>
      <p className="eyebrow animate-fade-up text-champagne">My Garage</p>
      <h1 className="animate-fade-up mt-5 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.95] [animation-delay:120ms]">
        {vehicles.length === 0 ? (
          <>
            An empty garage is <em className="text-gilded">full of possibility.</em>
          </>
        ) : (
          <>
            {vehicles.length} {vehicles.length === 1 ? "car" : "cars"}, <em className="text-gilded">one day.</em>
          </>
        )}
      </h1>

      {vehicles.length === 0 ? (
        <div className="animate-fade-up mt-12 [animation-delay:240ms]">
          <p className="max-w-lg text-lg text-ivory/65">
            Tap the heart on any car to save it here. Saved cars stay in this browser.
          </p>
          <Button asChild variant="luxe" size="xl" className="mt-10">
            <Link to="/inventory">Explore the collection</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="animate-fade-up mt-6 text-mist [animation-delay:240ms]">
            Garage value <span className="font-display text-2xl text-ivory">{formatPrice(total)}</span>
          </p>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map(vehicle => (
              <li key={vehicle.id} className="animate-fade-up">
                <VehicleCard vehicle={vehicle} className="h-full" />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
