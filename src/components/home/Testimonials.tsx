import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "The GT3 arrived in an enclosed transporter with a handwritten card and the inspection report in a leather folio. It was better than collecting a new car from the factory.",
    name: "Daniel R.",
    detail: "911 GT3 · Aspen, CO",
  },
  {
    quote:
      "I called about a car at 9pm on a Sunday and reached an actual person who knew the chassis number by heart. No forms, no call centre.",
    name: "Priya S.",
    detail: "BMW M5 Competition · Austin, TX",
  },
  {
    quote:
      "They talked me out of the first car I asked for and found me the right one three weeks later. That kind of honesty is rare in this business.",
    name: "Marcus L.",
    detail: "Mercedes-AMG GT R · Miami, FL",
  },
  {
    quote:
      "Financing was approved before I'd finished my coffee. The concierge knew the car's history better than the previous owner did.",
    name: "Elena V.",
    detail: "Audi RS e-tron GT · Seattle, WA",
  },
];

const ROTATE_MS = 8000;

export function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(i => (i + 1) % TESTIMONIALS.length), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  const current = TESTIMONIALS[active]!;

  return (
    <section aria-label="Client stories" className="mx-auto max-w-[1300px] px-5 py-24 text-center md:px-10 md:py-36">
      <p className="eyebrow flex items-center justify-center gap-4 text-champagne">
        <span className="h-px w-10 bg-champagne/50" />
        In their words
        <span className="h-px w-10 bg-champagne/50" />
      </p>
      <span aria-hidden className="mt-6 block font-display text-[9rem] leading-[0.5] text-champagne/40">
        “
      </span>
      <figure key={active} className="animate-fade-up" aria-live="polite">
        <blockquote className="mx-auto max-w-5xl font-display text-[clamp(1.7rem,3.4vw,3.2rem)] leading-[1.2] italic">
          {current.quote}
        </blockquote>
        <figcaption className="mt-10">
          <span className="block font-semibold tracking-wide">{current.name}</span>
          <span className="mt-1 block text-sm text-mist">{current.detail}</span>
        </figcaption>
      </figure>
      <div className="mt-12 flex justify-center gap-3">
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-label={`Show story from ${t.name}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className="grid h-8 w-10 place-items-center"
          >
            <span
              className={cn(
                "h-px transition-all duration-700 ease-(--ease-luxe)",
                i === active ? "w-10 bg-champagne" : "w-4 bg-ivory/30",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
