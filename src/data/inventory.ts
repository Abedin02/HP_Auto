/**
 * Pure inventory helpers. Vehicles themselves come from GET /api/vehicles (see
 * src/data/inventory-store.ts + src/hooks/use-inventory.ts) — these functions only ever
 * operate on a pool the caller supplies, so they stay trivially testable.
 */
import type { Character, Vehicle } from "@/types/vehicle";
import { PHOTOS } from "./photos";

export function getFeaturedVehicles(pool: readonly Vehicle[]): Vehicle[] {
  return pool.filter(vehicle => vehicle.isFeatured);
}

/** Same make or shared character first, then closest in price. */
export function getSimilarVehicles(target: Vehicle, limit: number, pool: readonly Vehicle[]): Vehicle[] {
  const affinity = (candidate: Vehicle): number =>
    (candidate.make === target.make ? 2 : 0) +
    (candidate.characters.some(c => target.characters.includes(c)) ? 1 : 0);

  return pool
    .filter(candidate => candidate.id !== target.id)
    .map(candidate => ({ candidate, score: affinity(candidate), gap: Math.abs(candidate.price - target.price) }))
    .sort((a, b) => b.score - a.score || a.gap - b.gap)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export type CharacterMeta = {
  key: Character;
  label: string;
  tagline: string;
  photoId: string;
};

export const CHARACTER_META: Record<Character, CharacterMeta> = {
  track: {
    key: "track",
    label: "Circuit",
    tagline: "Homologation specials and track-bred weapons",
    photoId: PHOTOS.porscheGt3RsShowroom,
  },
  "grand-touring": {
    key: "grand-touring",
    label: "Grand Touring",
    tagline: "Continents crossed in a single sitting",
    photoId: PHOTOS.audiRs7Mountain,
  },
  utility: {
    key: "utility",
    label: "Expedition",
    tagline: "Luxury that does not stop where the road does",
    photoId: PHOTOS.amgG63Track,
  },
  electric: {
    key: "electric",
    label: "Electric",
    tagline: "Silent, brutal, inevitable",
    photoId: PHOTOS.audiEtronGtShowroom,
  },
  heritage: {
    key: "heritage",
    label: "Heritage",
    tagline: "Analogue icons with provenance",
    photoId: PHOTOS.porscheScTargaForest,
  },
  hypercar: {
    key: "hypercar",
    label: "Halo",
    tagline: "The rarest machines, by appointment",
    photoId: PHOTOS.laFerrariShowroom,
  },
  "off-road": {
    key: "off-road",
    label: "Off-Road",
    tagline: "Built to leave the pavement behind",
    photoId: PHOTOS.defenderStudio,
  },
  family: {
    key: "family",
    label: "Family",
    tagline: "Room for the car seats, no compromise on the drive",
    photoId: PHOTOS.audiRs6Alps,
  },
  commuter: {
    key: "commuter",
    label: "Daily Driver",
    tagline: "Effortless enough for Monday, sharp enough for Sunday",
    photoId: PHOTOS.bmwM3Blue,
  },
  luxury: {
    key: "luxury",
    label: "Luxury",
    tagline: "Every surface considered, every mile cosseted",
    photoId: PHOTOS.amgCabin,
  },
};
