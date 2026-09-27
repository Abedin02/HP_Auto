/**
 * Everything the site needs to let a visitor reach a human: phone, email, showroom
 * locations, and the pure helpers that turn those into `tel:` / `mailto:` / maps links.
 * The site collects no visitor data, so every "contact" action hands off to the
 * visitor's own phone or email client instead of submitting a form.
 */
import { vehicleTitle } from "./format";

/** Single concierge line, shown in the header, footer, mobile menu and concierge page. */
export const SHOWROOM_PHONE = "+1 (310) 555-0142";

// TODO: I'm swapping in the real inbox before launch.
export const SHOWROOM_EMAIL = "help@hpauto.example";

export type Showroom = {
  city: string;
  name: string;
  address: string;
  hours: string;
  /** Google Maps search URL for the address, opened in a new tab. */
  mapsUrl: string;
};

/** Builds a Google Maps search URL from a free-form address string. */
export function directionsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export const SHOWROOMS: readonly Showroom[] = [
  {
    city: "Medford",
    name: "HP Auto",
    address: "2636 NY-112, Medford, NY 11763",
    hours: "Monday – Friday · 10am – 6pm",
    mapsUrl: directionsUrl("2636 NY-112, Medford, NY 11763"),
  }
];

/** Strips everything except digits and a leading "+" from a phone number, then builds a `tel:` URI. */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${hasLeadingPlus ? "+" : ""}${digits}`;
}

/** A `mailto:` link prefilled with the vehicle's title and stock number, plus the page URL in the body. */
export function vehicleEmailHref(
  vehicle: { year: number; make: string; model: string; stockNumber: string },
  pageUrl: string,
): string {
  const subject = `Enquiry: ${vehicleTitle(vehicle)} — No. ${vehicle.stockNumber}`;
  const body = `I'm interested in this car:\n${pageUrl}`;
  return `mailto:${SHOWROOM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
