import type { FieldErrors } from "@/lib/vehicle-validation";
import { BODY_STYLES, DRIVETRAINS, POWERTRAINS } from "@/types/vehicle";
import type { VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { FieldGroup } from "./FieldGroup";
import { MakeField } from "./MakeField";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

type IdentityFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

/** What the car is: stock number, VIN tail, year/make/model/trim, price, mileage, body & drivetrain, location. */
export function IdentityFields({ form, errors, onUpdate }: IdentityFieldsProps) {
  return (
    <FieldGroup title="Identity">
      <TextField label="Stock number" value={form.stockNumber} onChange={v => onUpdate("stockNumber", v)} error={errors.stockNumber} />
      <TextField label="VIN tail" value={form.vinTail} onChange={v => onUpdate("vinTail", v)} error={errors.vinTail} />
      <TextField label="Year" type="number" value={form.year} onChange={v => onUpdate("year", v)} error={errors.year} />
      <MakeField value={form.make} onChange={v => onUpdate("make", v)} error={errors.make} />
      <TextField label="Model" value={form.model} onChange={v => onUpdate("model", v)} error={errors.model} />
      <TextField label="Trim" value={form.trim} onChange={v => onUpdate("trim", v)} error={errors.trim} />
      <TextField label="Price (USD)" type="number" value={form.price} onChange={v => onUpdate("price", v)} error={errors.price} />
      <TextField label="Mileage" type="number" value={form.mileage} onChange={v => onUpdate("mileage", v)} error={errors.mileage} />
      <SelectField
        label="Body style"
        value={form.bodyStyle}
        onChange={v => onUpdate("bodyStyle", v)}
        options={BODY_STYLES}
        error={errors.bodyStyle}
      />
      <SelectField
        label="Drivetrain"
        value={form.drivetrain}
        onChange={v => onUpdate("drivetrain", v)}
        options={DRIVETRAINS}
        error={errors.drivetrain}
      />
      <SelectField
        label="Powertrain"
        value={form.powertrain}
        onChange={v => onUpdate("powertrain", v)}
        options={POWERTRAINS}
        error={errors.powertrain}
      />
      <TextField label="Location" value={form.location} onChange={v => onUpdate("location", v)} error={errors.location} />
    </FieldGroup>
  );
}
