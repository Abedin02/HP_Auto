export type FinanceInput = {
  price: number;
  downPayment: number;
  aprPercent: number;
  termMonths: number;
};

export type FinanceSummary = {
  financed: number;
  monthly: number;
  totalInterest: number;
  totalCost: number;
};

export const TERM_OPTIONS = [36, 48, 60, 72, 84] as const;
export const DEFAULT_APR = 6.49;

export const PRICE_RANGE = { min: 10_000, max: 500_000, step: 5_000 } as const;

/** Standard amortized monthly payment. Returns 0 when nothing is financed. */
export function monthlyPayment({ price, downPayment, aprPercent, termMonths }: FinanceInput): number {
  const principal = price - downPayment;
  if (principal <= 0 || termMonths <= 0) return 0;

  const monthlyRate = aprPercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;

  const growth = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * growth) / (growth - 1);
}

export function financeSummary(input: FinanceInput): FinanceSummary {
  const financed = Math.max(0, input.price - input.downPayment);
  const monthly = monthlyPayment(input);
  const totalPaid = monthly * input.termMonths;
  return {
    financed,
    monthly,
    totalInterest: Math.max(0, totalPaid - financed),
    totalCost: totalPaid + Math.min(input.downPayment, input.price),
  };
}
