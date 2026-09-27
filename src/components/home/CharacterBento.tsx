import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { CarImage } from "@/components/vehicle/CarImage";
import { CHARACTER_META } from "@/data/inventory";
import { useInventory } from "@/hooks/use-inventory";
import { unsplash } from "@/lib/images";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { CHARACTERS, type Character } from "@/types/vehicle";
import { bentoTileLayouts } from "./character-bento-layout";

/** Tile count shown by the loading skeleton — arbitrary, just needs to be a stable shape. */
const SKELETON_TILE_COUNT = 6;

const GRID_CLASSES = "mt-14 grid gap-4 md:grid-cols-12 md:auto-rows-[minmax(0,auto)]";

export function CharacterBento() {
  const { state } = useInventory();

  if (state.status !== "ready") return <CharacterBentoSkeleton />;

  const vehicles = state.data;
  const countFor = (character: Character) => vehicles.filter(v => v.characters.includes(character)).length;
  // Only characters with at least one published vehicle: anything else links to empty results.
  const characters = CHARACTERS.filter(character => countFor(character) > 0);

  // Nothing to showcase: the section adds no value empty, so it doesn't render (mirrors
  // ShowroomRail's empty-state behaviour).
  if (characters.length === 0) return null;

  const layouts = bentoTileLayouts(characters.length);

  return (
    <section aria-labelledby="character-title" className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
      <SectionHeading
        eyebrow="Shop by character"
        title={
          <span id="character-title">
            Choose a car by <em className="text-gilded">how it makes you feel.</em>
          </span>
        }
        aside={
          <p className="max-w-sm text-ivory/65">
            Browse by how a car drives rather than by its spec sheet: the lap, the long road, the rare find.
          </p>
        }
      />

      <div className={GRID_CLASSES}>
        {characters.map((character, i) => {
          const layout = layouts[i];
          if (!layout) return null;
          const meta = CHARACTER_META[character];
          const count = countFor(character);
          return (
            <Reveal key={character} delay={i * 80} className={cn("min-h-[22rem]", layout.span)}>
              <Link
                to={`/inventory?character=${character}`}
                className="group relative flex h-full min-h-[22rem] flex-col justify-end overflow-hidden bg-surface p-7"
              >
                <CarImage
                  source={unsplash(meta.photoId)}
                  alt=""
                  aspect={layout.aspect}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="absolute inset-0 size-full grayscale-[35%] transition-[transform,filter] duration-[1600ms] ease-(--ease-luxe) group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/35 to-transparent" />
                <div className="relative flex items-end justify-between gap-6">
                  <div>
                    <p className="eyebrow text-[0.6rem] text-champagne">
                      {count} {count === 1 ? "car" : "cars"}
                    </p>
                    <h3 className="mt-2 font-display text-4xl italic md:text-5xl">{meta.label}</h3>
                    <p className="mt-3 max-h-0 max-w-xs overflow-hidden text-ivory/75 opacity-0 transition-all duration-700 ease-(--ease-luxe) group-hover:max-h-20 group-hover:opacity-100 group-focus-visible:max-h-20 group-focus-visible:opacity-100">
                      {meta.tagline}
                    </p>
                  </div>
                  <span className="grid size-12 shrink-0 place-items-center rounded-full border border-ivory/30 transition-all duration-500 group-hover:rotate-45 group-hover:border-champagne group-hover:bg-champagne group-hover:text-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Reserves the section's shape while inventory loads, so mounting the real tiles (a different
 * character/tile count, once we know which characters have published vehicles) never reflows
 * the page. Not just visually empty: `aria-hidden` and unlinked, since none of it is real yet.
 */
function CharacterBentoSkeleton() {
  const layouts = bentoTileLayouts(SKELETON_TILE_COUNT);
  return (
    <section aria-hidden="true" className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
      <div className="h-3 w-24 animate-pulse bg-surface" />
      <div className="mt-6 h-14 w-3/4 max-w-2xl animate-pulse bg-surface" />
      <div className={GRID_CLASSES}>
        {layouts.map((layout, i) => (
          <div key={i} className={cn("min-h-[22rem] animate-pulse bg-surface", layout.span)} />
        ))}
      </div>
    </section>
  );
}
