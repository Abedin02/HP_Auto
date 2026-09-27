/** Stepped slider stops: the price range spans $50K to $4M+, so linear steps would be useless. */
export const PRICE_STOPS = [50_000, 75_000, 100_000, 150_000, 200_000, 300_000, 500_000, 1_000_000] as const;
export const MILEAGE_STOPS = [1_000, 5_000, 10_000, 20_000, 40_000] as const;
export const YEAR_OPTIONS = [2024, 2023, 2022, 2021, 2020, 2018, 2015, 2010] as const;

/** Slider index for a value; the extra final index means "no limit". */
export function stopIndex(stops: readonly number[], value: number | null): number {
  if (value === null) return stops.length;
  const index = stops.findIndex(stop => stop >= value);
  return index === -1 ? stops.length : index;
}

export function stopValue(stops: readonly number[], index: number): number | null {
  return stops[index] ?? null;
}
