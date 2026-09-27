import { ChevronRight, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { FinanceCalculator } from "@/components/finance/FinanceCalculator";
import { AsyncView } from "@/components/layout/AsyncView";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/vehicle/detail/Gallery";
import { InspectionReport } from "@/components/vehicle/detail/InspectionReport";
import { PurchasePanel } from "@/components/vehicle/detail/PurchasePanel";
import { KeyFigures, SpecSheet } from "@/components/vehicle/detail/SpecSheet";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useSimilarVehicles, useVehicle } from "@/hooks/use-inventory";
import { SHOWROOM_PHONE, telHref, vehicleEmailHref } from "@/lib/contact";
import { formatPrice, vehicleTitle } from "@/lib/format";
import { vehicleGallery } from "@/lib/images";
import { Link } from "@/lib/router";
import type { Vehicle } from "@/types/vehicle";
import { NotFoundPage } from "./NotFoundPage";

const NOT_FOUND_MESSAGE = "That car has found a new home, or the link is mistyped.";

export function VehiclePage({ id }: { id: string }) {
  const { state, retry } = useVehicle(id);

  return (
    <AsyncView state={state} onRetry={retry} loading={<VehiclePageSkeleton />} loadingLabel="Loading vehicle…">
      {vehicle => (vehicle ? <VehicleDetail key={vehicle.id} vehicle={vehicle} /> : <NotFoundPage message={NOT_FOUND_MESSAGE} />)}
    </AsyncView>
  );
}

/** Mirrors VehicleDetail's column layout so nothing shifts once the real content arrives. */
function VehiclePageSkeleton() {
  return (
    <div className="pt-20 pb-20 lg:pb-0">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="h-4 w-64 animate-pulse rounded bg-surface" />
        <div className="mt-10 grid gap-6 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="space-y-5 lg:col-span-8">
            <div className="h-3 w-48 animate-pulse rounded bg-surface" />
            <div className="h-16 w-full max-w-xl animate-pulse rounded bg-surface" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 space-y-10 lg:col-span-8">
            <div className="aspect-[16/10] w-full animate-pulse rounded bg-surface" />
            <div className="h-40 w-full animate-pulse rounded bg-surface" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-96 w-full animate-pulse rounded bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const title = vehicleTitle(vehicle);
  useDocumentTitle(`${title} — HP Auto`);
  const { state: similarState } = useSimilarVehicles(vehicle, 3);
  const similar = similarState.status === "ready" ? similarState.data : [];

  return (
    <article className="pt-20 pb-20 lg:pb-0">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-6 text-xs text-mist">
          <Link to="/inventory" className="hover:text-ivory">
            The Collection
          </Link>
          <ChevronRight className="size-3" />
          <Link to={`/inventory?make=${encodeURIComponent(vehicle.make)}`} className="hover:text-ivory">
            {vehicle.make}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-ivory/80" aria-current="page">
            {vehicle.model}
          </span>
        </nav>

        <header className="grid gap-6 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow animate-fade-up flex flex-wrap items-center gap-3 text-[0.62rem] text-champagne">
              <span>No. {vehicle.stockNumber}</span>
              <span className="h-px w-8 bg-champagne/50" />
              <span className="text-mist">{vehicle.location}</span>
              {vehicle.isFeatured && <span className="border border-champagne/60 px-2 py-1 text-champagne">Featured</span>}
              {vehicle.isNewArrival && <span className="bg-champagne px-2 py-1 text-ink">New arrival</span>}
            </p>
            <h1 className="animate-fade-up mt-5 font-display leading-[0.95] [animation-delay:100ms]">
              <span className="block text-2xl text-ivory/60 italic md:text-3xl">
                {vehicle.year} {vehicle.make}
              </span>
              <span className="block text-[clamp(3rem,7.5vw,7rem)]">{vehicle.model}</span>
            </h1>
            <p className="animate-fade-up mt-3 text-lg text-mist [animation-delay:200ms]">{vehicle.trim}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 space-y-24 lg:col-span-8">
            <Gallery frames={vehicleGallery(vehicle)} />
            <KeyFigures vehicle={vehicle} />

            <DetailSection index="I" title="The story">
              <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
                <p className="text-xl leading-relaxed text-ivory/80 first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-champagne">
                  {vehicle.story}
                </p>
                <ul className="space-y-4">
                  {vehicle.highlights.map((highlight, i) => (
                    <li key={highlight} className="flex gap-4 border-b border-line pb-4">
                      <span className="font-display text-champagne italic">0{i + 1}</span>
                      <span className="text-ivory/85">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </DetailSection>

            <DetailSection index="II" title="Specification">
              <SpecSheet vehicle={vehicle} />
            </DetailSection>

            <DetailSection index="III" title="Inspection report">
              <InspectionReport />
            </DetailSection>

            <DetailSection index="IV" title="Make it yours" id="finance">
              <FinanceCalculator price={vehicle.price} />
            </DetailSection>
          </div>

          <aside className="lg:col-span-4" aria-label="Purchase options">
            <div className="lg:sticky lg:top-28">
              <PurchasePanel vehicle={vehicle} />
            </div>
          </aside>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar-title" className="mx-auto mt-32 max-w-[1600px] border-t border-line px-5 py-24 md:px-10">
          <h2 id="similar-title" className="font-display text-4xl md:text-5xl">
            You may also <em className="text-gilded">desire</em>
          </h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {similar.map(item => (
              <li key={item.id}>
                <VehicleCard vehicle={item} className="h-full" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <MobileBuyBar vehicle={vehicle} />
    </article>
  );
}

function DetailSection({ index, title, id, children }: { index: string; title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} aria-label={title} className="scroll-mt-28">
      <Reveal>
        <h2 className="mb-10 flex items-baseline gap-5 font-display text-4xl md:text-5xl">
          <span className="text-lg text-champagne italic">{index}.</span>
          {title}
        </h2>
      </Reveal>
      {children}
    </section>
  );
}

function MobileBuyBar({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-ink/90 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      <div>
        <p className="font-display text-2xl leading-none">{formatPrice(vehicle.price)}</p>
        <p className="mt-1 text-xs text-mist">7-day return · delivered</p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="luxe-outline" size="icon-lg" className="text-ivory">
          <a href={vehicleEmailHref(vehicle, window.location.href)} aria-label="Email about this car">
            <Mail className="size-4" strokeWidth={1.5} />
          </a>
        </Button>
        <Button asChild variant="luxe" className="h-12 px-6">
          <a href={telHref(SHOWROOM_PHONE)}>Call</a>
        </Button>
      </div>
    </div>
  );
}
