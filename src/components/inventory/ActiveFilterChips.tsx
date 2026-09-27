import { X } from "lucide-react";
import { CHARACTER_META } from "@/data/inventory";
import { formatCompactPrice, formatNumber } from "@/lib/format";
import { canonicalMakeLabel, type InventoryFilters } from "@/lib/inventory";
import type { MakeFacet } from "@/types/vehicle";

type Chip = { key: string; label: string; remove: (f: InventoryFilters) => InventoryFilters };

function buildChips(filters: InventoryFilters, makeFacetList: readonly MakeFacet[]): Chip[] {
  const chips: Chip[] = [];
  if (filters.query.trim()) chips.push({ key: "q", label: `“${filters.query.trim()}”`, remove: f => ({ ...f, query: "" }) });
  if (filters.character) {
    chips.push({ key: "character", label: CHARACTER_META[filters.character].label, remove: f => ({ ...f, character: null }) });
  }
  for (const make of filters.makes) {
    chips.push({
      key: `make-${make}`,
      // The URL keeps whatever casing was typed or shared, so I label the chip with the canonical
      // spelling from live inventory when it matches, and the raw value otherwise.
      label: canonicalMakeLabel(make, makeFacetList),
      remove: f => ({ ...f, makes: f.makes.filter(m => m !== make) }),
    });
  }
  for (const body of filters.bodyStyles) {
    chips.push({ key: `body-${body}`, label: body, remove: f => ({ ...f, bodyStyles: f.bodyStyles.filter(b => b !== body) }) });
  }
  for (const power of filters.powertrains) {
    chips.push({ key: `power-${power}`, label: power, remove: f => ({ ...f, powertrains: f.powertrains.filter(p => p !== power) }) });
  }
  if (filters.priceMax !== null) {
    chips.push({ key: "price", label: `Under ${formatCompactPrice(filters.priceMax)}`, remove: f => ({ ...f, priceMax: null }) });
  }
  if (filters.mileageMax !== null) {
    chips.push({ key: "miles", label: `≤ ${formatNumber(filters.mileageMax)} mi`, remove: f => ({ ...f, mileageMax: null }) });
  }
  if (filters.yearMin !== null) {
    chips.push({ key: "year", label: `${filters.yearMin}+`, remove: f => ({ ...f, yearMin: null }) });
  }
  return chips;
}

type ActiveFilterChipsProps = {
  filters: InventoryFilters;
  /** Live inventory's make facets, used to label make chips with their canonical spelling. */
  makeFacetList: readonly MakeFacet[];
  onChange: (next: InventoryFilters) => void;
  onClear: () => void;
};

export function ActiveFilterChips({ filters, makeFacetList, onChange, onClear }: ActiveFilterChipsProps) {
  const chips = buildChips(filters, makeFacetList);
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map(chip => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onChange(chip.remove(filters))}
            aria-label={`Remove filter ${chip.label}`}
            className="group flex items-center gap-2 border border-champagne/40 bg-champagne/10 py-1.5 pr-2 pl-3 text-sm text-champagne-bright transition-colors hover:border-champagne"
          >
            {chip.label}
            <X className="size-3.5 opacity-60 group-hover:opacity-100" />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={onClear} className="eyebrow ml-2 text-[0.6rem] text-mist underline-offset-4 hover:text-ivory hover:underline">
          Clear all
        </button>
      </li>
    </ul>
  );
}
