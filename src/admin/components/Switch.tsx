import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Accessible on/off control (role="switch") — Radix doesn't ship a Switch primitive here. */
export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        "disabled:pointer-events-none disabled:opacity-50",
        checked ? "bg-champagne" : "bg-surface-raised",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-4 translate-x-1 rounded-full bg-ivory transition-transform duration-200",
          checked && "translate-x-6 bg-ink",
        )}
      />
    </button>
  );
}
