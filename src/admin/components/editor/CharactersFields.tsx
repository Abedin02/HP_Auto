import { CHARACTER_META } from "@/data/inventory";
import { FormError } from "@/components/forms/Field";
import type { FieldErrors } from "@/lib/vehicle-validation";
import { cn } from "@/lib/utils";
import { CHARACTERS, type Character } from "@/types/vehicle";
import type { VehicleFormDefaults } from "@/admin/lib/vehicle-form";
import { FieldGroup } from "./FieldGroup";

type CharactersFieldsProps = {
  form: VehicleFormDefaults;
  errors: FieldErrors;
  onUpdate: <K extends keyof VehicleFormDefaults>(key: K, value: VehicleFormDefaults[K]) => void;
};

/** Multi-select checkbox group; at least one character tag is required by validateVehicleInput. */
export function CharactersFields({ form, errors, onUpdate }: CharactersFieldsProps) {
  const toggle = (character: Character, checked: boolean) => {
    const next = checked ? [...form.characters, character] : form.characters.filter(c => c !== character);
    onUpdate("characters", next);
  };

  return (
    <FieldGroup title="Characters">
      <div role="group" aria-label="Character tags" className="flex flex-wrap gap-3 sm:col-span-2">
        {CHARACTERS.map(character => {
          const checked = form.characters.includes(character);
          return (
            <label
              key={character}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                checked ? "border-champagne bg-champagne/10 text-champagne" : "border-line text-muted-foreground hover:text-ivory",
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={event => toggle(character, event.target.checked)}
              />
              {CHARACTER_META[character].label}
            </label>
          );
        })}
      </div>
      {errors.characters && <FormError message={errors.characters} />}
    </FieldGroup>
  );
}
