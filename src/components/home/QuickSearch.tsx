import { ArrowRight } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { EMPTY_FILTERS, filterVehicles, makeFacets, serializeFilters } from "@/lib/inventory";
import { navigate } from "@/lib/router";
import { BODY_STYLES, type BodyStyle, type Make } from "@/types/vehicle";

const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "75000", label: "Under $75K" },
  { value: "150000", label: "Under $150K" },
  { value: "300000", label: "Under $300K" },
  { value: "600000", label: "Under $600K" },
];

const SELECT =
  "w-full cursor-pointer appearance-none border-0 bg-transparent py-1 pr-6 font-display text-xl text-ivory focus:outline-none [&>option]:bg-surface [&>option]:font-sans [&>option]:text-base";

/** Carvana-style instant search with a live result count. */
export function QuickSearch() {
  const { state } = useInventory();
  const [make, setMake] = useState<Make | "">("");
  const [body, setBody] = useState<BodyStyle | "">("");
  const [budget, setBudget] = useState("");

  const makeOptions = useMemo(
    () => (state.status === "ready" ? makeFacets(state.data) : []),
    [state],
  );

  const filters = useMemo(
    () => ({
      ...EMPTY_FILTERS,
      makes: make ? [make] : [],
      bodyStyles: body ? [body] : [],
      priceMax: budget ? Number(budget) : null,
    }),
    [make, body, budget],
  );
  const count = state.status === "ready" ? filterVehicles(state.data, filters).length : 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = serializeFilters(filters).toString();
    navigate(`/inventory${query ? `?${query}` : ""}`);
  };

  return (
    <section aria-label="Quick search" className="relative z-10 mx-auto -mt-px max-w-[1600px] px-5 md:px-10">
      <form
        onSubmit={handleSubmit}
        className="grid border border-line bg-surface/80 backdrop-blur-xl md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <SearchCell label="Marque" id="qs-make">
          <select id="qs-make" value={make} onChange={e => setMake(e.target.value as Make | "")} className={SELECT}>
            <option value="">All marques</option>
            {makeOptions.map(({ make: m }) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </SearchCell>
        <SearchCell label="Body" id="qs-body">
          <select id="qs-body" value={body} onChange={e => setBody(e.target.value as BodyStyle | "")} className={SELECT}>
            <option value="">Every shape</option>
            {BODY_STYLES.map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </SearchCell>
        <SearchCell label="Budget" id="qs-budget">
          <select id="qs-budget" value={budget} onChange={e => setBudget(e.target.value)} className={SELECT}>
            {BUDGETS.map(b => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </SearchCell>
        <button
          type="submit"
          className="group flex items-center justify-between gap-6 bg-champagne px-8 py-6 text-ink transition-colors duration-500 hover:bg-ivory md:justify-center"
        >
          <span className="text-left">
            <span className="eyebrow block text-[0.6rem] opacity-70">Search</span>
            <span className="font-display text-xl" aria-live="polite">
              Show {count} {count === 1 ? "car" : "cars"}
            </span>
          </span>
          <ArrowRight className="size-5 transition-transform duration-500 group-hover:translate-x-1" />
        </button>
      </form>
    </section>
  );
}

function SearchCell({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="relative border-b border-line px-6 py-4 transition-colors focus-within:bg-ivory/[0.03] md:border-r md:border-b-0">
      <label htmlFor={id} className="eyebrow block text-[0.6rem] text-mist">
        {label}
      </label>
      {children}
      <span aria-hidden className="pointer-events-none absolute right-6 bottom-5 text-champagne">
        ⌄
      </span>
    </div>
  );
}
