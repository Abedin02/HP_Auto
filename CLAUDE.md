# Project Instructions

HP Auto is a reliable car dealership website.
Inventory lives in Supabase and is managed by an admin at `/admin`; the public site shows only vehicles the admin has
published (there is no seed data). The site collects no visitor data: every enquiry hands off to a `tel:`/`mailto:`
link (`src/lib/contact.ts`) instead of a form.

## Tech Stack
- Runtime/server/bundler: **Bun** (`Bun.serve` with HTML imports + HMR, no Vite/webpack)
- UI: React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind CSS v4 through `bun-plugin-tailwind`
- Components: shadcn/ui primitives + `lucide-react`; fonts Bodoni Moda (display) + Manrope (UI) via Google Fonts
- Routing: custom History-API router in `src/lib/router.tsx` (`Link`, `navigate`, `usePathname`, `useSearchParams`). No react-router
- Data: Supabase Postgres + Storage (`supabase/migrations/`, setup in `supabase/README.md`). Admins are users with
  `app_metadata.role = "admin"` (created by `bun run create-admin`); RLS enforces every write
- Images: `ImageSource` union in `src/types/vehicle.ts`. Vehicle photos are admin uploads stored as WebP renditions
  (layout in `src/lib/storage-paths.ts`); marketing imagery is Unsplash (`src/data/photos.ts`, `unsplash()` helper).
  All URLs are built in `src/lib/images.ts`

## Build & Run (run from `HP_Auto/`)
- Dev: `bun dev`. **Windows:** start it from `D:\Users\...` (capital U, matching the real folder name). From a
  differently-cased path, Bun's HMR fails with "Failed to load bundled module 'src/index.html'"
- Tests: `bun test` · Typecheck: `bunx tsc --noEmit` · Build: `bun run build` → `dist/` · Prod: `bun start`
- Deploy: Render free web service via `Dockerfile` + `render.yaml` (Blueprint). The container runs `bun src/index.ts`
  (Bun bundles the HTML at startup; `dist/` is not used). `RENDER=true` (set by Render) or `TRUST_PROXY=true` makes the
  rate limiter key on `True-Client-IP`/`X-Forwarded-For` (`src/server/client-ip.ts`); never enable it without a proxy
- Env: copy `.env.example` → `.env.local`. The server uses `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (RLS-bound, never
  the secret key); the admin SPA uses `BUN_PUBLIC_SUPABASE_*` (`src/lib/public-env.ts`); `SUPABASE_SECRET_KEY` is read
  only by `scripts/create-admin.ts`. Without env vars the admin shows `SupabaseSetupNotice`
- `README.md` is partly stale (mentions `/sell`, `POST /api/leads`, seed data in `src/data/vehicles.ts`, none of which
  exist). Trust this file and the code

## Project Structure
- `src/App.tsx`: route table (`ROUTES`) plus the header/footer shell. Add a page by adding a route here
- `src/pages/`: one component per route (Home, Inventory, Vehicle, Finance, Concierge, Garage, NotFound)
- `src/components/<feature>/`: home, inventory, vehicle (+ `detail/`), finance, layout, forms, motion
- Public vehicle data flow: `GET /api/vehicles` (`src/server/vehicles.ts`, 60s cache, publishable key + RLS) →
  `src/data/inventory-store.ts` → hooks in `src/hooks/use-inventory.ts` (`useInventory`, `useVehicle`,
  `useFeaturedVehicles`…) → pages, with `AsyncView` for loading/error. Public code must never import supabase-js
- `src/admin.html` + `src/admin/`: separate admin SPA (login, vehicle list with featured/status toggles, editor, photo
  manager). Admin saves call `POST /api/admin/revalidate` to refresh the public cache
- `src/lib/`: pure logic with tests (inventory filters + URL (de)serialisation, finance, vehicle validation,
  `vehicle-rows.ts` DB row ↔ `Vehicle` mapping, `contact.ts` showroom phone/email/maps + `tel:`/`mailto:` builders)
- `src/index.ts`: unknown `/api/*` → JSON 404; see `src/server/vehicles.ts` for the public vehicle API
- `styles/globals.css`: design tokens (ink/ivory/champagne). `src/index.css`: grain, motion, `font-display`,
  `eyebrow`, `text-gilded`, `text-outline`, `[data-reveal]`, `.spotlight`

## Code Style
- Path alias `@/*` → `src/*`; `verbatimModuleSyntax` is on, so use `import { type X }` / `import type` for type-only imports
- Named function exports; PascalCase component files, kebab-case hooks (`use-garage.ts`); lowercase shadcn files
- Double quotes, semicolons, 2-space indent, trailing commas, ~120-char lines
- Design language: dark-first "nocturne atelier". Use tokens (`text-champagne`, `bg-ink`, `border-line`) rather than raw
  colours; buttons use `variant="luxe"` / `"luxe-outline"`; scroll-in animation uses `<Reveal>`
- Never animate `transform` on `<main>` or any ancestor of `position: fixed` UI (it breaks the drawers and buy bar)
- The URL is the source of truth for inventory filters: go through `parseFilters`/`serializeFilters`
- Contact CTAs (vehicle enquiries, showroom visits, finance): plain `tel:`/`mailto:` links built from `src/lib/contact.ts`
  (`telHref`, `vehicleEmailHref`, `SHOWROOM_PHONE`, `SHOWROOM_EMAIL`, `SHOWROOMS`). No lead-capture forms or backend
- Overlays: use the native `<dialog>` `Modal` (`components/ui/modal.tsx`), or for custom sheets `useModalLayer()`, which
  makes the page inert, moves focus in and restores it. Portal a sheet to `<body>` if it is declared inside `<main>`
- Server input: throttle with `createRateLimiter` (`src/server/limits.ts`)
- Public client env vars must use the `BUN_PUBLIC_*` prefix; anything with it ends up in the browser bundle

## Testing
- `bun test`, with `*.test.ts` next to the source file. Cover pure logic in `src/lib` and data integrity in `src/data`
- Vehicle rules are enforced three times, keep them in sync: `src/lib/vehicle-validation.ts` (admin form), CHECK
  constraints in the migrations, and the shape guard in `src/data/inventory-store.ts` (public client)

## Conventions
- Git repo on `main`; use conventional commits (`feat:`, `fix:`, …)
- `dist/`, `out/`, `node_modules/`, `.env` and `.env.*.local` are gitignored
