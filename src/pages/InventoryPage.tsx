import { Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ActiveFilterChips } from "@/components/inventory/ActiveFilterChips";
import { EmptyResults } from "@/components/inventory/EmptyResults";
import { FilterDrawer } from "@/components/inventory/FilterDrawer";
import { FilterPanel } from "@/components/inventory/FilterPanel";
import { AsyncView } from "@/components/layout/AsyncView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { CHARACTER_META } from "@/data/inventory";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useInventory } from "@/hooks/use-inventory";
import {
  EMPTY_FILTERS,
  SORT_OPTIONS,
  countActiveFilters,
  filterVehicles,
  isSortKey,
  makeFacets,
  parseFilters,
  serializeFilters,
  sortVehicles,
  type InventoryFilters,
  type SortKey,
} from "@/lib/inventory";
import { useSearchParams } from "@/lib/router";
import { cn } from "@/lib/utils";
import { CHARACTERS, type Vehicle } from "@/types/vehicle";

export function InventoryPage() {
  useDocumentTitle("The Collection — HP Auto");
  const { state, retry } = useInventory();

  return (
    <div className="pt-20">
      <AsyncView state={state} onRetry={retry} loading={<InventoryLoading />} loadingLabel="Loading the collection…">
        {vehicles => (vehicles.length === 0 ? <CuratedEmptyState /> : <InventoryResults vehicles={vehicles} />)}
      </AsyncView>
    </div>
  );
}

function InventoryLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-16 pb-32 text-center md:px-10 md:pt-24">
      <p className="eyebrow text-champagne">The Collection</p>
      <p className="animate-pulse mt-6 text-lg text-ivory/60">Bringing the showroom online…</p>
    </div>
  );
}

function CuratedEmptyState() {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-[1600px] flex-col items-center justify-center px-5 py-24 text-center md:px-10">
      <p className="eyebrow text-champagne">The Collection</p>
      <h1 className="mt-6 max-w-2xl font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.02]">
        The collection is being curated <em className="text-gilded">— check back soon.</em>
      </h1>
    </div>
  );
}

function InventoryResults({ vehicles }: { vehicles: readonly Vehicle[] }) {
  const [params, setParams] = useSearchParams();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const paramString = params.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(paramString)), [paramString]);
  const rawSort = params.get("sort");
  const sort: SortKey = isSortKey(rawSort) ? rawSort : "featured";

  const results = useMemo(() => sortVehicles(filterVehicles(vehicles, filters), sort), [vehicles, filters, sort]);
  const activeCount = countActiveFilters(filters);
  const makeFacetList = useMemo(() => makeFacets(vehicles), [vehicles]);

  const update = useCallback(
    (nextFilters: InventoryFilters, nextSort: SortKey = sort) => {
      const next = serializeFilters(nextFilters);
      if (nextSort !== "featured") next.set("sort", nextSort);
      setParams(next);
    },
    [setParams, sort],
  );
  const clearAll = () => update(EMPTY_FILTERS);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const panel = <FilterPanel filters={filters} vehicles={vehicles} onChange={next => update(next)} />;

  return (
    <>
      <header className="relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-[1600px] px-5 pt-16 pb-10 md:px-10 md:pt-24">
          <p className="eyebrow animate-fade-up text-champagne">The Collection</p>
          <h1 className="animate-fade-up mt-5 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.95] [animation-delay:120ms]">
            {vehicles.length} cars. <em className="text-gilded">Every one</em> <span className="whitespace-nowrap">hand-picked.</span>
          </h1>
          <label className="animate-fade-up mt-12 flex max-w-3xl items-center gap-4 border-b border-ivory/25 pb-3 transition-colors focus-within:border-champagne [animation-delay:240ms]">
            <Search className="size-5 text-champagne" strokeWidth={1.5} />
            <span className="sr-only">Search the collection</span>
            <input
              type="search"
              value={filters.query}
              onChange={e => update({ ...filters, query: e.target.value })}
              placeholder="Search “GT3”, “V12”, “Rosso”…"
              className="w-full bg-transparent font-display text-2xl text-ivory placeholder:text-ivory/30 focus:outline-none md:text-3xl"
            />
          </label>
        </div>
        <nav aria-label="Character" className="no-scrollbar mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-5 md:px-10">
          <CharacterTab label="All" isActive={filters.character === null} onClick={() => update({ ...filters, character: null })} />
          {CHARACTERS.map(character => (
            <CharacterTab
              key={character}
              label={CHARACTER_META[character].label}
              isActive={filters.character === character}
              onClick={() => update({ ...filters, character })}
            />
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-10 md:px-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-10">{panel}</div>
        </aside>

        <section aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <p className="text-sm text-mist" aria-live="polite">
              Showing <span className="font-display text-xl text-ivory">{results.length}</span> of {vehicles.length}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="eyebrow flex h-10 items-center gap-2 border border-line px-4 text-[0.62rem] hover:border-ivory/50 lg:hidden"
              >
                <SlidersHorizontal className="size-3.5" /> Filters{activeCount > 0 && ` · ${activeCount}`}
              </button>
              <Select value={sort} onValueChange={value => isSortKey(value) && update(filters, value)}>
                <SelectTrigger aria-label="Sort vehicles" className="h-10 min-w-48 rounded-none border-line">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="rounded-none">
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="py-5">
            <ActiveFilterChips
              filters={filters}
              makeFacetList={makeFacetList}
              onChange={next => update(next)}
              onClear={clearAll}
            />
          </div>

          {results.length === 0 ? (
            <EmptyResults onClear={clearAll} />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {results.map((vehicle, i) => (
                <li key={vehicle.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                  <VehicleCard vehicle={vehicle} priority={i < 2} className="h-full" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <FilterDrawer isOpen={isDrawerOpen} resultCount={results.length} onClose={closeDrawer}>
        {panel}
      </FilterDrawer>
    </>
  );
}

function CharacterTab({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "relative shrink-0 px-5 py-5 font-display text-lg whitespace-nowrap italic transition-colors after:absolute after:inset-x-5 after:bottom-0 after:h-px after:bg-champagne after:transition-transform after:duration-500",
        isActive ? "text-ivory after:scale-x-100" : "text-ivory/50 after:scale-x-0 hover:text-ivory/85",
      )}
    >
      {label}
    </button>
  );
}
