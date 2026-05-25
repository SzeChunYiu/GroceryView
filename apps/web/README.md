# GroceryView Web App

`apps/web` is the Next.js storefront for GroceryView. It renders public grocery price intelligence, account-gated planning surfaces, and API routes that sit in front of the shared workspace packages.

## Routes

Key App Router entry points live in `src/app`:

- `/` — market landing page with trend, discovery, source, and confidence modules.
- `/products`, `/search`, `/categories`, `/items` — catalogue browsing and product lookup.
- `/deals`, `/expiry-deals`, `/alerts`, `/watchlist` — deal, price-drop, expiry, and alert surfaces.
- `/basket`, `/weekly-basket`, `/list`, `/household` — shopping-list, household, and basket planning flows.
- `/stores`, `/map`, `/store-coverage`, `/chain-index`, `/compare` — store and chain comparison views.
- `/account`, `/login`, `/settings` — account, session, notification, billing, and preference controls.
- `/api/*` — route handlers for products, search, feed recommendations, alerts, list sharing, notifications, and ingestion-backed helpers.
- `/[country]/*` and `/[city]/*` — localized/country and city-specific pages such as terms, fuel routes, receipts, and flyer views.

## Components

Reusable UI lives in `src/components`. Important groups include:

- `data-ui.tsx` for `PageShell`, `Card`, `Eyebrow`, source coverage, and verified-data primitives.
- `SearchBar.tsx`, `FilterPanel.tsx`, `LazyItemCard.tsx`, and product/price cards for catalogue UX.
- `deal-card.tsx`, `price-intelligence-card.tsx`, and trend components for deals and savings pages.
- `basket-*`, `list-card.tsx`, and `household-*` components for planning flows.
- Client helpers such as scanner, map, notification, and account action components.

## Key files

- `src/lib/verified-data.ts` — generated/static verified grocery facts used by public pages.
- `src/lib/trends.ts`, `src/lib/price-events.ts`, `src/lib/feed-recommendations.ts` — discovery and recommendation ranking helpers.
- `src/lib/seo.ts` — route metadata, canonical URLs, cache metadata, and share URL helpers.
- `src/lib/personalization.ts`, `src/lib/user-preferences.ts` — account and browser preference shaping.
- `src/middleware.ts` — locale headers and cache-control headers for catalogue routes.
- `scripts/*.test.mjs` — lightweight Node checks used by CI for route contracts and static safeguards.

## Public exports

This app does not publish a package barrel. Public boundaries are:

- Next.js pages, layouts, metadata functions, and route handlers exported from `src/app/**`.
- Reusable React components exported from their files in `src/components/**`.
- Web-only library helpers exported from `src/lib/**` for pages, route handlers, and scripts.

Shared package exports come from workspace packages such as `@groceryview/core`, `@groceryview/db`, `@groceryview/api`, and `@groceryview/scanning`.

## Environment variables

Common runtime variables:

- `DATABASE_URL` — PostgreSQL connection used by product/search API routes.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — browser session exchange and account flows when configured.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web push notification subscription setup.
- `LIST_SHARE_SECRET` or `NEXT_PUBLIC_LIST_SHARE_SECRET` — signing and reading public list share payloads.
- Ingestion, connector, and deployment secrets are documented in the repo-level ops docs and should not be committed.

## Development and build

From the repository root, use workspace commands rather than installing new dependencies:

```bash
npm run dev -w @groceryview/web
npm run build -w @groceryview/web
npm run test -w @groceryview/web
```

The build script first builds dependent workspace packages and then runs `next build`. CI is the source of truth for full typecheck/build/test validation on this monorepo.

## Usage example

Create a server page that reuses the shared UI and SEO helpers:

```tsx
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/deals');
}

export default function ExamplePage() {
  return (
    <PageShell>
      <Eyebrow>Example</Eyebrow>
      <Card className="mt-4">Verified GroceryView content goes here.</Card>
    </PageShell>
  );
}
```
