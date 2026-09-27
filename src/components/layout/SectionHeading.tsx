import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Optional section numeral, e.g. "01". Omitted on the home page. */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export function SectionHeading({ index, eyebrow, title, aside, className }: SectionHeadingProps) {
  return (
    <div className={cn("grid gap-8 md:grid-cols-12 md:items-end", className)}>
      <Reveal className="md:col-span-8">
        <p className="eyebrow flex items-center gap-4 text-champagne">
          {index && <span className="font-display text-sm tracking-normal normal-case italic">({index})</span>}
          <span className="h-px w-10 bg-champagne/50" />
          {eyebrow}
        </p>
        <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">{title}</h2>
      </Reveal>
      {aside && (
        <Reveal delay={150} className="md:col-span-4 md:justify-self-end">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
