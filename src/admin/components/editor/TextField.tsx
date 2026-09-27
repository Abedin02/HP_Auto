import type { InputHTMLAttributes } from "react";
import { Field, FormError } from "@/components/forms/Field";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
};

/** A floating-label input bound to editor state, with its validation error underneath. */
export function TextField({ label, value, onChange, error, type = "text" }: TextFieldProps) {
  return (
    <div>
      <Field
        label={label}
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <FormError message={error} />}
    </div>
  );
}
