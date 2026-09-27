import type { FieldErrors } from "@/lib/vehicle-validation";
import { VEHICLE_STATUSES } from "@/types/vehicle";
import type { VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { Switch } from "@/admin/components/Switch";
import { FieldGroup } from "./FieldGroup";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

type ListingFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

function statusLabel(status: string): string {
  return status[0]!.toUpperCase() + status.slice(1);
}

/** Status, featured flag, new-arrival flag and the manual homepage/inventory sort order. */
export function ListingFields({ form, errors, onUpdate }: ListingFieldsProps) {
  return (
    <FieldGroup title="Listing">
      <SelectField
        label="Status"
        value={form.status}
        onChange={value => onUpdate("status", value)}
        options={VEHICLE_STATUSES}
        optionLabel={statusLabel}
        error={errors.status}
      />
      <TextField
        label="Display order"
        type="number"
        value={form.displayOrder}
        onChange={value => onUpdate("displayOrder", value)}
        error={errors.displayOrder}
      />
      <div className="flex items-center gap-3">
        <Switch checked={form.isFeatured} onCheckedChange={value => onUpdate("isFeatured", value)} label="Featured" />
        <span className="text-sm text-muted-foreground">Featured across the site</span>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={form.isNewArrival}
          onCheckedChange={value => onUpdate("isNewArrival", value)}
          label="New arrival"
        />
        <span className="text-sm text-muted-foreground">Shows a "New arrival" badge</span>
      </div>
    </FieldGroup>
  );
}
