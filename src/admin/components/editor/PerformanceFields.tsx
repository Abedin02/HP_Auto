import type { FieldErrors } from "@/lib/vehicle-validation";
import type { VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { FieldGroup } from "./FieldGroup";
import { TextField } from "./TextField";

type PerformanceFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

/** Drivetrain hardware and the numbers that sell it: power, torque, 0-60, top speed. */
export function PerformanceFields({ form, errors, onUpdate }: PerformanceFieldsProps) {
  return (
    <FieldGroup title="Performance">
      <TextField
        label="Transmission (optional)"
        value={form.transmission}
        onChange={v => onUpdate("transmission", v)}
        error={errors.transmission}
      />
      <TextField
        label="Engine"
        value={form.engine}
        onChange={v => onUpdate("engine", v)}
        error={errors.engine}
      />
      <TextField
        label="Horsepower (optional)"
        type="number"
        value={form.horsepower}
        onChange={v => onUpdate("horsepower", v)}
        error={errors.horsepower}
      />
      <TextField
        label="Torque, lb-ft (optional)"
        type="number"
        value={form.torqueLbFt}
        onChange={v => onUpdate("torqueLbFt", v)}
        error={errors.torqueLbFt}
      />
      <TextField
        label="0-60 mph, seconds (optional)"
        type="number"
        value={form.zeroToSixty}
        onChange={v => onUpdate("zeroToSixty", v)}
        error={errors.zeroToSixty}
      />
      <TextField
        label="Top speed, mph (optional)"
        type="number"
        value={form.topSpeedMph}
        onChange={v => onUpdate("topSpeedMph", v)}
        error={errors.topSpeedMph}
      />
    </FieldGroup>
  );
}
