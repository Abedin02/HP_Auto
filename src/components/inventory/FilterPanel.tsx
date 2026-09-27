import type { ReactNode } from "react";
import { formatCompactPrice, formatNumber } from "@/lib/format";
import { makeFacets, makeKey, type InventoryFilters } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { BODY_STYLES, POWERTRAINS, type Vehicle } from "@/types/vehicle";
import { MILEAGE_STOPS, PRICE_STOPS, YEAR_OPTIONS, stopIndex, stopValue } from "./filter-options";

type FilterPanelProps = {
  filters: InventoryFilters;
  vehicles: readonly Vehicle[];
  onChange: (next: InventoryFilters) => void;
};

const toggle = <T,>(list: readonly T[], value: T): T[] =>
  list.includes(value) ? list.filter(item => item !== value) : [...list, value];

export function FilterPanel({ filters, vehicles, onChange }: FilterPanelProps) {
  const set = (patch: Partial<InventoryFilters>) => onChange({ ...filters, ...patch });
  const priceIndex = stopIndex(PRICE_STOPS, filters.priceMax);
  const mileageIndex = stopIndex(MILEAGE_STOPS, filters.mileageMax);
  const facets = makeFacets(vehicles);

  const toggleMake = (make: string) => {
    const isSelected = filters.makes.some(m => makeKey(m) === makeKey(make));
    const next = isSelected ? filters.makes.filter(m => makeKey(m) !== makeKey(make)) : [...filters.makes, make];
    set({ makes: next });
  };

  return (
    <div className="space-y-10">
      <FilterGroup title="Marque">
        <ul className="space-y-1">
          {facets.map(({ make, count }) => {
            const checked = filters.makes.some(m => makeKey(m) === makeKey(make));
            return (
              <li key={make}>
                <label className="group flex cursor-pointer items-center gap-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMake(make)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4 place-items-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-champagne",
                      checked ? "border-champagne bg-champagne" : "border-ivory/30 group-hover:border-ivory/60",
                    )}
                  >
                    {checked && <span className="size-1.5 bg-ink" />}
                  </span>
                  <span className={cn("flex-1 transition-colors", checked ? "text-ivory" : "text-ivory/70 group-hover:text-ivory")}>
                    {make}
                  </span>
                  <span className="text-xs text-mist">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Body">
        <PillGroup
          options={BODY_STYLES}
          selected={filters.bodyStyles}
          onToggle={value => set({ bodyStyles: toggle(filters.bodyStyles, value) })}
        />
      </FilterGroup>

      <FilterGroup title="Powertrain">
        <PillGroup
          options={POWERTRAINS}
          selected={filters.powertrains}
          onToggle={value => set({ powertrains: toggle(filters.powertrains, value) })}
        />
      </FilterGroup>

      <FilterGroup title="Maximum price" value={filters.priceMax ? formatCompactPrice(filters.priceMax) : "Any"}>
        <input
          type="range"
          min={0}
          max={PRICE_STOPS.length}
          value={priceIndex}
          aria-label="Maximum price"
          aria-valuetext={filters.priceMax ? formatCompactPrice(filters.priceMax) : "No limit"}
          onChange={e => set({ priceMax: stopValue(PRICE_STOPS, Number(e.target.value)) })}
          className="w-full"
        />
      </FilterGroup>

      <FilterGroup title="Maximum mileage" value={filters.mileageMax ? `${formatNumber(filters.mileageMax)} mi` : "Any"}>
        <input
          type="range"
          min={0}
          max={MILEAGE_STOPS.length}
          value={mileageIndex}
          aria-label="Maximum mileage"
          aria-valuetext={filters.mileageMax ? `${formatNumber(filters.mileageMax)} miles` : "No limit"}
          onChange={e => set({ mileageMax: stopValue(MILEAGE_STOPS, Number(e.target.value)) })}
          className="w-full"
        />
      </FilterGroup>

      <FilterGroup title="Model year">
        <label htmlFor="filter-year" className="sr-only">
          Minimum model year
        </label>
        <select
          id="filter-year"
          value={filters.yearMin ?? ""}
          onChange={e => set({ yearMin: e.target.value ? Number(e.target.value) : null })}
          className="w-full cursor-pointer border-0 border-b border-line bg-transparent py-2 text-ivory focus:border-champagne focus:outline-none [&>option]:bg-surface"
        >
          <option value="">Any year</option>
          {YEAR_OPTIONS.map(year => (
            <option key={year} value={year}>
              {year} or newer
            </option>
          ))}
        </select>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, value, children }: { title: string; value?: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4 flex w-full justify-between text-[0.62rem] text-mist">
        <span>{title}</span>
        {value && <span className="text-champagne">{value}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function PillGroup<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const isOn = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(option)}
            className={cn(
              "border px-3.5 py-2 text-sm transition-all duration-300",
              isOn ? "border-champagne bg-champagne text-ink" : "border-line text-ivory/75 hover:border-ivory/50 hover:text-ivory",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
