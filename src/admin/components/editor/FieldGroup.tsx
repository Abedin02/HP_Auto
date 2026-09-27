import type { ReactNode } from "react";

type FieldGroupProps = { title: string; children: ReactNode };

/** One labelled section of the vehicle editor form (Listing, Identity, Performance, …). */
export function FieldGroup({ title, children }: FieldGroupProps) {
  return (
    <section className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="eyebrow text-champagne">{title}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}
