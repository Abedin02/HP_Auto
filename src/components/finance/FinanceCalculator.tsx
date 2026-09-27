import { useState, type ReactNode } from "react";
import { DEFAULT_APR, PRICE_RANGE, TERM_OPTIONS, financeSummary } from "@/lib/finance";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOWN_STEP_RATIO = 0.05;
const MAX_DOWN_RATIO = 0.6;
const DEFAULT_DOWN_RATIO = 0.2;

type FinanceCalculatorProps = {
  price: number;
  /** Lets the Finance page adjust the price too; vehicle pages keep it fixed. */
  onPriceChange?: (price: number) => void;
  className?: string;
};

export function FinanceCalculator({ price, onPriceChange, className }: FinanceCalculatorProps) {
  const [downRatio, setDownRatio] = useState(DEFAULT_DOWN_RATIO);
  const [termMonths, setTermMonths] = useState<number>(72);
  const [aprPercent, setAprPercent] = useState(DEFAULT_APR);

  const downPayment = Math.round(price * downRatio);
  const summary = financeSummary({ price, downPayment, aprPercent, termMonths });

  return (
    <div className={cn("grid gap-10 border border-line bg-surface/60 p-6 md:grid-cols-2 md:p-10", className)}>
      <div className="space-y-8">
        {onPriceChange && (
          <RangeRow label="Vehicle price" value={formatPrice(price)}>
            <input
              type="range"
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              step={PRICE_RANGE.step}
              value={price}
              onChange={e => onPriceChange(Number(e.target.value))}
              aria-label="Vehicle price"
              className="w-full"
            />
          </RangeRow>
        )}
        <RangeRow label="Down payment" value={`${formatPrice(downPayment)} · ${Math.round(downRatio * 100)}%`}>
          <input
            type="range"
            min={0}
            max={MAX_DOWN_RATIO}
            step={DOWN_STEP_RATIO}
            value={downRatio}
            onChange={e => setDownRatio(Number(e.target.value))}
            aria-label="Down payment percentage"
            aria-valuetext={`${Math.round(downRatio * 100)} percent, ${formatPrice(downPayment)}`}
            className="w-full"
          />
        </RangeRow>

        <fieldset>
          <legend className="eyebrow mb-3 text-[0.62rem] text-mist">Term</legend>
          <div className="grid grid-cols-5 border border-line">
            {TERM_OPTIONS.map(term => (
              <button
                key={term}
                type="button"
                aria-pressed={term === termMonths}
                onClick={() => setTermMonths(term)}
                className={cn(
                  "py-3 text-sm transition-colors",
                  term === termMonths ? "bg-champagne text-ink" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory",
                )}
              >
                {term}
                <span className="sr-only"> months</span>
              </button>
            ))}
          </div>
        </fieldset>

        <RangeRow label="Estimated APR" value={`${aprPercent.toFixed(2)}%`}>
          <input
            type="range"
            min={2.99}
            max={14.99}
            step={0.25}
            value={aprPercent}
            onChange={e => setAprPercent(Number(e.target.value))}
            aria-label="Estimated APR"
            className="w-full"
          />
        </RangeRow>
      </div>

      <div className="flex flex-col justify-between border-t border-line pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-10">
        <div>
          <p className="eyebrow text-[0.62rem] text-mist">Estimated monthly</p>
          <p className="mt-3 font-display text-6xl leading-none md:text-7xl" aria-live="polite">
            {formatPrice(summary.monthly)}
            <span className="text-2xl text-mist">/mo</span>
          </p>
        </div>
        <dl className="mt-10 space-y-3 text-sm">
          <Row term="Amount financed" value={formatPrice(summary.financed)} />
          <Row term="Total interest" value={formatPrice(summary.totalInterest)} />
          <Row term="Total cost" value={formatPrice(summary.totalCost)} />
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-ivory/45">
          Estimate only, before taxes and fees. Your actual rate depends on credit approval — call or email the finance
          desk for real terms.
        </p>
      </div>
    </div>
  );
}

function RangeRow({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3 flex justify-between text-[0.62rem] text-mist">
        <span>{label}</span>
        <span className="text-champagne">{value}</span>
      </p>
      {children}
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-3">
      <dt className="text-ivory/60">{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
