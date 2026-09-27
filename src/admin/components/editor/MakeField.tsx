import { useId } from "react";
import { Field, FormError } from "@/components/forms/Field";
import { canonicalMake, POPULAR_MAKES } from "@/types/vehicle";

type MakeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/**
 * Free-text make (any dealer-stocked make is allowed, not just POPULAR_MAKES) with a
 * `<datalist>` of the 25 mass-market brands for quick autocomplete. On blur the typed value is
 * run through canonicalMake(), so common aliases/casing ("chevy", "mercedes benz") settle into
 * the stored spelling before the form is submitted.
 */
export function MakeField({ value, onChange, error }: MakeFieldProps) {
  const listId = useId();
  return (
    <div>
      <Field
        label="Make"
        list={listId}
        value={value}
        onChange={event => onChange(event.target.value)}
        onBlur={event => {
          const canonical = canonicalMake(event.target.value);
          if (canonical !== null) onChange(canonical);
        }}
        aria-invalid={Boolean(error)}
      />
      <datalist id={listId}>
        {POPULAR_MAKES.map(make => (
          <option key={make} value={make} />
        ))}
      </datalist>
      {error && <FormError message={error} />}
    </div>
  );
}
