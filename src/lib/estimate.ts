import { DEFAULT_APR, monthlyPayment } from "./finance";

export const ESTIMATE_DOWN_RATIO = 0.2;
export const ESTIMATE_TERM_MONTHS = 72;

/** The "from $X/mo" figure shown on cards: 20% down, 72 months, default APR. */
export function estimatedMonthly(price: number): number {
  return monthlyPayment({
    price,
    downPayment: price * ESTIMATE_DOWN_RATIO,
    aprPercent: DEFAULT_APR,
    termMonths: ESTIMATE_TERM_MONTHS,
  });
}
