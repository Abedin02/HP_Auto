const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatPrice(amount: number): string {
  return priceFormatter.format(Math.round(amount));
}

export function formatCompactPrice(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(amount / 1_000)}K`;
}

export function formatMileage(miles: number): string {
  if (miles === 0) return "Delivery miles";
  return `${numberFormatter.format(miles)} mi`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function vehicleTitle(vehicle: { year: number; make: string; model: string }): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}
