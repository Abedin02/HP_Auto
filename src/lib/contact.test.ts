import { describe, expect, test } from "bun:test";
import { directionsUrl, SHOWROOM_EMAIL, telHref, vehicleEmailHref } from "./contact";

describe("telHref", () => {
  test("strips formatting characters and keeps a leading +", () => {
    expect(telHref("+1 (310) 555-0142")).toBe("tel:+13105550142");
  });

  test("keeps only digits when there is no leading +", () => {
    expect(telHref("(310) 555-0142")).toBe("tel:3105550142");
  });

  test("drops a + that is not in leading position", () => {
    expect(telHref("310-555-0142 ext+1")).toBe("tel:31055501421");
  });
});

describe("vehicleEmailHref", () => {
  const vehicle = { year: 2024, make: "Porsche", model: "911 GT3 RS", stockNumber: "HP-1042" };
  const pageUrl = "https://hpauto.example/vehicle/2024-porsche-911-gt3-rs-4f2a";

  test("builds a mailto link addressed to the showroom", () => {
    const href = vehicleEmailHref(vehicle, pageUrl);
    expect(href.startsWith(`mailto:${SHOWROOM_EMAIL}?`)).toBe(true);
  });

  test("encodes the subject with the vehicle title and stock number", () => {
    const href = vehicleEmailHref(vehicle, pageUrl);
    expect(href).toContain(`subject=${encodeURIComponent("Enquiry: 2024 Porsche 911 GT3 RS — No. HP-1042")}`);
  });

  test("encodes the page URL into the body", () => {
    const href = vehicleEmailHref(vehicle, pageUrl);
    expect(href).toContain(encodeURIComponent(pageUrl));
  });
});

describe("directionsUrl", () => {
  test("builds a Google Maps search URL with the address encoded", () => {
    expect(directionsUrl("Wilshire Boulevard, Beverly Hills, CA")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Wilshire%20Boulevard%2C%20Beverly%20Hills%2C%20CA",
    );
  });
});
