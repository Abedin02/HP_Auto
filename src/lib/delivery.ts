const EARLIEST_DAYS = 4;
const LATEST_DAYS = 7;

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * 86_400_000);

/** Enclosed-transport window shown on vehicle pages, e.g. "Sep 28 – Oct 1". */
export function deliveryWindow(from: Date = new Date()): string {
  return `${shortDate.format(addDays(from, EARLIEST_DAYS))} – ${shortDate.format(addDays(from, LATEST_DAYS))}`;
}
