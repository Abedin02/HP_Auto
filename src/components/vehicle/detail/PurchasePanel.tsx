import { ArrowRight, CalendarClock, ShieldCheck, ShieldPlus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOWROOM_PHONE, telHref, vehicleEmailHref } from "@/lib/contact";
import { deliveryWindow } from "@/lib/delivery";
import { estimatedMonthly } from "@/lib/estimate";
import { formatPrice, vehicleTitle } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";
import { SaveButton } from "../SaveButton";

type PurchasePanelProps = {
  vehicle: Vehicle;
};

export function PurchasePanel({ vehicle }: PurchasePanelProps) {
  const promises = [
    { icon: Truck, title: "Enclosed delivery", body: `Arrives ${deliveryWindow()}` },
    { icon: ShieldPlus, title: "30-day limited warranty", body: "Engine & transmission, up to 1,000 miles" },
    { icon: ShieldCheck, title: "172-point inspection", body: "Passed · report below" },
    {
      icon: CalendarClock,
      title: vehicle.accidentFree ? "Clean history" : "History disclosed",
      body: `${vehicle.owners} ${vehicle.owners === 1 ? "owner" : "owners"} · ${vehicle.accidentFree ? "no reported accidents" : "see report"}`,
    },
  ];

  return (
    <div className="border border-line bg-surface/70 backdrop-blur-xl">
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-[0.6rem] text-mist">Collection price</p>
            <p className="mt-2 font-display text-5xl leading-none">{formatPrice(vehicle.price)}</p>
            <a href="#finance" className="mt-3 inline-flex items-center gap-1.5 text-sm text-champagne hover:text-champagne-bright">
              or est. {formatPrice(estimatedMonthly(vehicle.price))}/mo <ArrowRight className="size-3.5" />
            </a>
          </div>
          <SaveButton vehicleId={vehicle.id} label={vehicleTitle(vehicle)} className="size-12" />
        </div>

        <div className="mt-7 space-y-3">
          <div>
            <Button asChild variant="luxe" size="xl" className="w-full">
              <a href={telHref(SHOWROOM_PHONE)}>Call the showroom</a>
            </Button>
            <a
              href={telHref(SHOWROOM_PHONE)}
              className="mt-2 block text-center text-xs text-mist hover:text-champagne"
            >
              {SHOWROOM_PHONE}
            </a>
          </div>
          <Button asChild variant="luxe-outline" size="xl" className="w-full text-ivory">
            <a href={vehicleEmailHref(vehicle, window.location.href)}>Email about this car</a>
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-2 border-t border-line">
        {promises.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className={i % 2 === 0 ? "border-r border-line p-5" : "p-5"}>
            <Icon className="size-4 text-champagne" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-mist">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
