import { Reveal } from "@/components/motion/Reveal";
import { formatMileage, formatNumber } from "@/lib/format";
import type { Drivetrain, Vehicle } from "@/types/vehicle";

/** "—" for a spec the manufacturer never published, never "null" or "NaN". */
const NOT_PUBLISHED = "—";

const DRIVETRAIN_LABELS: Record<Drivetrain, string> = {
  FWD: "Front-wheel drive",
  RWD: "Rear-wheel drive",
  AWD: "All-wheel drive",
  "4WD": "Four-wheel drive",
};

export function KeyFigures({ vehicle }: { vehicle: Vehicle }) {
  const figures = [
    {
      value: vehicle.horsepower !== null ? formatNumber(vehicle.horsepower) : NOT_PUBLISHED,
      unit: vehicle.horsepower !== null ? "hp" : "",
      label: "Power",
    },
    {
      value: vehicle.torqueLbFt !== null ? formatNumber(vehicle.torqueLbFt) : NOT_PUBLISHED,
      unit: vehicle.torqueLbFt !== null ? "lb-ft" : "",
      label: "Torque",
    },
    {
      value: vehicle.zeroToSixty !== null ? vehicle.zeroToSixty.toFixed(1) : NOT_PUBLISHED,
      unit: vehicle.zeroToSixty !== null ? "s" : "",
      label: "0–60 mph",
    },
    {
      value: vehicle.topSpeedMph !== null ? String(vehicle.topSpeedMph) : NOT_PUBLISHED,
      unit: vehicle.topSpeedMph !== null ? "mph" : "",
      label: "Top speed",
    },
  ];

  return (
    <dl className="grid grid-cols-2 border-y border-line md:grid-cols-4">
      {figures.map((figure, i) => (
        <Reveal
          key={figure.label}
          delay={i * 80}
          className="flex flex-col-reverse border-line py-7 pl-1 even:border-l md:border-l md:pl-6 md:first:border-l-0"
        >
          <dt className="eyebrow mt-2 text-[0.6rem] text-mist">{figure.label}</dt>
          <dd className="font-display text-5xl leading-none md:text-6xl">
            {figure.value}
            {figure.unit && <span className="ml-1 text-lg text-champagne">{figure.unit}</span>}
          </dd>
        </Reveal>
      ))}
    </dl>
  );
}

export function SpecSheet({ vehicle }: { vehicle: Vehicle }) {
  const rows: [string, string][] = [
    ["Engine", vehicle.engine],
    ["Transmission", vehicle.transmission ?? NOT_PUBLISHED],
    ["Drivetrain", DRIVETRAIN_LABELS[vehicle.drivetrain]],
    ["Powertrain", vehicle.powertrain],
    ["Body", vehicle.bodyStyle],
    ["Mileage", formatMileage(vehicle.mileage)],
    ["Exterior", vehicle.exteriorColor],
    ["Interior", vehicle.interiorColor],
    ["Owners", String(vehicle.owners)],
    ["Stock no.", vehicle.stockNumber],
    ["VIN", `•••••••••••${vehicle.vinTail}`],
    ["Location", vehicle.location],
  ];

  return (
    <dl className="grid sm:grid-cols-2 sm:gap-x-12">
      {rows.map(([term, value]) => (
        <div key={term} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
          <dt className="eyebrow shrink-0 text-[0.6rem] text-mist">{term}</dt>
          <dd className="text-right text-ivory/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
