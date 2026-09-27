import { SectionHeading } from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { useCountUp } from "@/hooks/use-count-up";

const PILLARS = [
  {
    numeral: "172",
    unit: "points",
    title: "Inspected by brand specialists",
    body: "Factory-trained technicians check paint depth, borescope the cylinders and road-test every car. The full report is published on each car's page.",
  },
  {
    numeral: "7",
    unit: "days",
    title: "To change your mind",
    body: "Live with it for a week. If it isn't right, we collect it and refund you in full. No questions, no restocking fee.",
  },
  {
    numeral: "48",
    unit: "states",
    title: "Enclosed, white-glove delivery",
    body: "Your car arrives in a climate-controlled, soft-strap enclosed transporter, and a handover specialist walks you through it at your door.",
  },
  {
    numeral: "30",
    unit: "days",
    title: "Limited warranty included",
    body: "Every car leaves with 30 days or 1,000 miles of engine and transmission cover. Add an extended plan at checkout, up to full bumper-to-bumper.",
  },
];

const STATS = [
  { value: 15, prefix: "", suffix: "+", label: "Years serving Long Island drivers" },
  { value: 2400, prefix: "", suffix: "+", label: "Clients across the country" },
  { value: 49, prefix: "", suffix: "/5", label: "Average rating, 1,100 reviews", divisor: 10 },
  { value: 36, prefix: "", suffix: "h", label: "Median time from purchase to dispatch" },
];

export function TheStandard() {
  return (
    <section aria-labelledby="standard-title" className="relative border-y border-line bg-surface/40 py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <SectionHeading
          eyebrow="The HP Standard"
          title={
            <span id="standard-title">
              Bought online, looked after <em className="text-gilded">in person.</em>
            </span>
          }
        />

        <ol className="mt-16 grid gap-px bg-line md:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <Reveal as="li" key={pillar.title} delay={i * 100} className="group bg-ink p-8 md:p-10">
              <p className="flex items-baseline gap-3">
                <span className="font-display text-7xl leading-none text-champagne transition-transform duration-700 ease-(--ease-luxe) group-hover:-translate-y-1 md:text-8xl">
                  {pillar.numeral}
                </span>
                <span className="eyebrow text-mist">{pillar.unit}</span>
              </p>
              <h3 className="mt-8 font-display text-2xl">{pillar.title}</h3>
              <p className="mt-3 leading-relaxed text-ivory/65">{pillar.body}</p>
            </Reveal>
          ))}
        </ol>

        <dl className="mt-20 grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          {STATS.map(stat => (
            <Stat key={stat.label} {...stat} />
          ))}
        </dl>
      </div>
    </section>
  );
}

type StatProps = { value: number; prefix: string; suffix: string; label: string; divisor?: number };

function Stat({ value, prefix, suffix, label, divisor = 1 }: StatProps) {
  const { ref, value: current } = useCountUp<HTMLDivElement>(value);
  const display = divisor === 1 ? current.toLocaleString("en-US") : (current / divisor).toFixed(1);
  return (
    <div ref={ref} className="flex flex-col-reverse border-l border-line pl-6">
      <dt className="mt-2 text-sm text-mist">{label}</dt>
      <dd className="font-display text-5xl md:text-6xl">
        {prefix}
        {display}
        <span className="text-champagne">{suffix}</span>
      </dd>
    </div>
  );
}
