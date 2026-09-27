import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";

export function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center border border-dashed border-line px-6 py-24 text-center">
      <p className="font-display text-7xl text-champagne/40 italic">∅</p>
      <h2 className="mt-6 font-display text-4xl">Not on the floor, yet.</h2>
      <p className="mt-4 max-w-md text-ivory/65">
        Nothing matches those filters right now. Most of our cars sell before they are ever listed, so tell the concierge
        what you're after and we'll source it.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button variant="luxe-outline" size="xl" className="text-ivory" onClick={onClear}>
          Clear filters
        </Button>
        <Button asChild variant="luxe" size="xl">
          <Link to="/concierge">Source it for me</Link>
        </Button>
      </div>
    </div>
  );
}
