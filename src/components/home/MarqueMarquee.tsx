import { Fragment } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { makeFacets } from "@/lib/inventory";
import { cn } from "@/lib/utils";

/** Endless ribbon of marque names drawn from live, published inventory; hidden when empty. */
export function MarqueMarquee() {
  const { state } = useInventory();
  const makes = state.status === "ready" ? makeFacets(state.data).map(facet => facet.make) : [];
  if (makes.length === 0) return null;

  const loop = [...makes, ...makes];
  return (
    <section aria-label="Marques we collect" className="overflow-hidden border-y border-line py-10 md:py-14">
      <p className="sr-only">{makes.join(", ")}</p>
      <div aria-hidden className="animate-marquee flex w-max items-center hover:[animation-play-state:paused]">
        {loop.map((make, i) => (
          <Fragment key={`${make}-${i}`}>
            <span
              className={cn(
                "mx-5 font-display text-6xl whitespace-nowrap italic md:text-8xl",
                i % 2 === 0 ? "text-ivory" : "text-outline",
              )}
            >
              {make}
            </span>
            <span className="mx-5 text-2xl text-champagne">✦</span>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
