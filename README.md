# HP Auto

The website for HP Auto, a curated dealership for luxury and performance cars. It covers the collection, vehicle
detail pages with finance and reservation, trade-in offers, pre-qualification and concierge booking.

Built with Bun, React 19, Tailwind CSS v4 and shadcn/ui.

## Getting started

```bash
bun install
bun dev        # http://localhost:3000 (set PORT to change)
```

> **Windows:** start the dev server from the path with its real casing (`D:\Users\...`, not `D:\users\...`).
> Otherwise Bun's hot reload fails to load `src/index.html`.

## Scripts

| Command | What it does |
|---|---|
| `bun dev` | Dev server with hot reload |
| `bun start` | Production server |
| `bun run build` | Static bundle in `dist/` |
| `bun test` | Unit tests |
| `bunx tsc --noEmit` | Typecheck |

## Pages

| Route | Page |
|---|---|
| `/` | Cinematic hero, quick search, showroom rail, shop-by-character bento, the HP Standard, atelier, trade-in teaser, testimonials |
| `/inventory` | The collection: search, character tabs, filters (kept in the URL so views can be shared), sort |
| `/vehicle/:id` | Gallery, key figures, story, spec sheet, 172-point inspection, finance calculator, reserve/viewing |
| `/sell` | Three-step instant trade-in offer |
| `/finance` | Payment calculator, ownership options, soft-pull pre-qualification, FAQ |
| `/concierge` | Showrooms and appointment booking |
| `/garage` | Cars saved with the heart button (stored in the browser) |

## Placeholders to replace before launch

- **Inventory** is seed data in `src/data/vehicles.ts`. Swap the functions in `src/data/inventory.ts` for API calls.
- **Leads** (`POST /api/leads`) are validated and rate-limited but kept in memory, so they are lost on restart. Wire
  `src/server/leads.ts` to your CRM or email provider.
- **Photos** are hotlinked from Unsplash. Replace them with your own photography of each car.
- **Business details** (phone number, showroom addresses and hours, statistics, testimonials) are illustrative copy.
