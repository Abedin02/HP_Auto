import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

/** Category totals sum to the advertised 172 points. */
const CATEGORIES = [
  { name: "Exterior & paint", points: 42, note: "Paint-depth mapped on every panel" },
  { name: "Interior & electronics", points: 31, note: "Every switch, seat motor and screen" },
  { name: "Mechanical", points: 58, note: "Borescope, compression and fluid analysis" },
  { name: "Road test", points: 23, note: "40-mile specialist drive" },
  { name: "Provenance", points: 18, note: "Title, service records, recalls" },
] as const;

export function InspectionReport() {
  const total = CATEGORIES.reduce((sum, c) => sum + c.points, 0);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="font-display text-8xl leading-none text-champagne">
          {total}
          <span className="text-3xl text-mist">/{total}</span>
        </p>
        <p className="mt-4 max-w-sm text-ivory/65">
          Every point passed. Marque-trained technicians inspected this car, and a senior specialist signed it off.
        </p>
      </div>
      <ul className="space-y-5">
        {CATEGORIES.map((category, i) => (
          <Reveal as="li" key={category.name} delay={i * 80}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="flex items-center gap-3">
                <span className="grid size-5 place-items-center rounded-full bg-champagne/15 text-champagne">
                  <Check className="size-3" />
                </span>
                {category.name}
              </p>
              <p className="text-sm text-mist">
                {category.points}/{category.points}
              </p>
            </div>
            <div className="mt-3 h-px bg-line">
              <div className="h-px bg-champagne" style={{ width: "100%" }} />
            </div>
            <p className="mt-2 text-xs text-mist">{category.note}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
