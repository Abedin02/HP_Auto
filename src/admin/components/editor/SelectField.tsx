import { useId } from "react";
import { FormError } from "@/components/forms/Field";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  optionLabel?: (value: T) => string;
  error?: string;
};

/** Enum-backed field (status, make, body style, …) rendered with the shared Select primitive. */
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  optionLabel,
  error,
}: SelectFieldProps<T>) {
  const selectId = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <Select value={value} onValueChange={next => onChange(next as T)}>
        <SelectTrigger id={selectId} className="w-full" aria-invalid={Boolean(error)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {optionLabel ? optionLabel(option) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <FormError message={error} />}
    </div>
  );
}
