/**
 * Pure span/aspect assignment for CharacterBento's bento grid, derived only from how many
 * tiles are being shown — never from which characters they are. This is what keeps the grid's
 * shape stable across the loading -> ready transition: the loading skeleton and the real grid
 * both size themselves from a tile count, so mounting real content never reflows the page.
 */
export type BentoTileLayout = {
  /** Tailwind grid-column/row span classes (`md:col-span-*`, optionally `md:row-span-*`). */
  span: string;
  /** Width / height for the tile's image. */
  aspect: number;
};

const FULL: BentoTileLayout = { span: "md:col-span-12", aspect: 21 / 9 };
const HALF: BentoTileLayout = { span: "md:col-span-6", aspect: 4 / 5 };
const HERO: BentoTileLayout = { span: "md:col-span-7 md:row-span-2", aspect: 4 / 5 };
const WIDE: BentoTileLayout = { span: "md:col-span-5", aspect: 16 / 10 };
const STANDARD: BentoTileLayout = { span: "md:col-span-4", aspect: 4 / 5 };

/**
 * Returns exactly `count` tile layouts, balanced for any count from 1 to 10 (or more): a
 * single tile goes full-width, two tiles split the row evenly, and three or more get an
 * editorial hero + wide companion followed by standard tiles filling the remaining rows.
 */
export function bentoTileLayouts(count: number): BentoTileLayout[] {
  if (count <= 0) return [];
  if (count === 1) return [FULL];
  if (count === 2) return [HALF, HALF];

  const layouts: BentoTileLayout[] = [HERO, WIDE];
  for (let i = layouts.length; i < count; i++) layouts.push(STANDARD);
  return layouts;
}
