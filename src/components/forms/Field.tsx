import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "peer block w-full border-0 border-b border-input bg-transparent px-0 pt-6 pb-2.5 text-base text-foreground placeholder-transparent transition-colors duration-300 focus:border-champagne focus:outline-none focus-visible:outline-none";

const LABEL =
  "pointer-events-none absolute top-6 left-0 origin-left text-base text-muted-foreground transition-all duration-300 ease-(--ease-luxe) peer-focus:top-0 peer-focus:text-[0.65rem] peer-focus:tracking-[0.25em] peer-focus:uppercase peer-focus:text-champagne peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[0.65rem] peer-[:not(:placeholder-shown)]:tracking-[0.25em] peer-[:not(:placeholder-shown)]:uppercase";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

/** Hairline input with a floating label that settles into an eyebrow on focus. */
export function Field({ label, className, id, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn("relative", className)}>
      <input id={inputId} placeholder=" " className={CONTROL} {...props} />
      <label htmlFor={inputId} className={LABEL}>
        {label}
      </label>
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export function TextAreaField({ label, className, id, ...props }: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className={cn("relative", className)}>
      <textarea id={inputId} placeholder=" " rows={3} className={cn(CONTROL, "resize-none")} {...props} />
      <label htmlFor={inputId} className={LABEL}>
        {label}
      </label>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
