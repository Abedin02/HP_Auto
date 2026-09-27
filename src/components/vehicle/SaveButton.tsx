import { Heart } from "lucide-react";
import { useGarage } from "@/hooks/use-garage";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  vehicleId: string;
  label: string;
  className?: string;
};

export function SaveButton({ vehicleId, label, className }: SaveButtonProps) {
  const { isSaved, toggle } = useGarage();
  const saved = isSaved(vehicleId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from garage` : `Save ${label} to garage`}
      onClick={() => toggle(vehicleId)}
      className={cn(
        "grid size-10 place-items-center rounded-full border backdrop-blur-md transition-all duration-500 ease-(--ease-luxe) active:scale-90",
        saved
          ? "border-champagne bg-champagne text-ink"
          : "border-ivory/25 bg-ink/40 text-ivory hover:border-ivory/60 hover:bg-ink/60",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} strokeWidth={1.6} />
    </button>
  );
}
