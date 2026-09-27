import type { FieldErrors } from "@/lib/vehicle-validation";
import type { VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { Switch } from "@/admin/components/Switch";
import { FieldGroup } from "./FieldGroup";
import { TextField } from "./TextField";

type DetailsFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

/** Colours, ownership history and accident status. */
export function DetailsFields({ form, errors, onUpdate }: DetailsFieldsProps) {
  return (
    <FieldGroup title="Details">
      <TextField label="Exterior color" value={form.exteriorColor} onChange={v => onUpdate("exteriorColor", v)} error={errors.exteriorColor} />
      <TextField label="Interior color" value={form.interiorColor} onChange={v => onUpdate("interiorColor", v)} error={errors.interiorColor} />
      <TextField label="Owners" type="number" value={form.owners} onChange={v => onUpdate("owners", v)} error={errors.owners} />
      <div className="flex items-center gap-3">
        <Switch checked={form.accidentFree} onCheckedChange={value => onUpdate("accidentFree", value)} label="Accident-free" />
        <span className="text-sm text-muted-foreground">Accident-free history</span>
      </div>
    </FieldGroup>
  );
}
