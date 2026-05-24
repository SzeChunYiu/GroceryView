# GroceryView Web

`apps/web` is the Next.js 16 storefront for GroceryView. It renders the public
price terminal, product and store pages, comparison tools, account flows, and a
small set of server-side API endpoints that read verified catalogue data or a
configured PostgreSQL database.

## Run and build

Run commands from the repository root unless noted otherwise:

```bash
npm install
npm run dev -w @groceryview/web
npm run build -w @groceryview/web
npm run start -w @groceryview/web
npm run test -w @groceryview/web
```

The web app package scripts are:

| Command | Purpose |
| --- | --- |
| `npm run dev -w @groceryview/web` | Start `next dev` for local development. |
| `npm run build -w @groceryview/web` | Build the production Next.js app with the repository webpack setting. |
| `npm run start -w @groceryview/web` | Serve a previously built production app. |
| `npm run test -w @groceryview/web` | Run the route/component smoke tests in `apps/web/scripts/*.test.mjs`. |
| `npm run perf:bundle:profile -w @groceryview/web` | Build with profiling and run size-limit. |
| `npm run perf:lighthouse:ci -w @groceryview/web` | Run Lighthouse CI against the configured local target. |
| `npm run perf:lighthouse:preview -w @groceryview/web` | Run Lighthouse CI against `LHCI_PREVIEW_URL` or `VERCEL_PREVIEW_URL`. |

## Environment variables

Most pages render from checked-in/generated data and do not require secrets.
Server routes use these optional variables when enabled:

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `/api/alerts`, `/api/digest`, `/api/export/prices`, `/api/products`, `/api/webhooks/price-change` | Enables PostgreSQL-backed runtime reads/writes. Without it, API routes either fall back to generated/static data or return explicit unavailable responses. |
| `LIST_SHARE_SECRET` | `/api/list/share` | Server-side HMAC secret for shopping-list share links. |
| `NEXT_PUBLIC_LIST_SHARE_SECRET` | `src/hooks/useList.ts` and `/api/list/share` fallback | Public dev fallback for list-share HMAC. Prefer `LIST_SHARE_SECRET` outside local development. |
| `NORWAY_COVERAGE_JSON` | `/api/ops/norway-readiness` | Optional JSON payload for the Norway coverage readiness endpoint. |
| `NORWAY_COVERAGE_AS_OF` | `/api/ops/norway-readiness` | Optional timestamp paired with `NORWAY_COVERAGE_JSON`. |
| `LHCI_PREVIEW_URL` / `VERCEL_PREVIEW_URL` | `lighthouserc.preview.cjs` | Preview URL for Lighthouse preview checks. |

Repository-level `.env.example` documents shared variables used across apps and
packages.

## Routes

Top-level public pages live under `src/app` using the App Router. Important
route groups include:

- Home and localized home pages: `/`, `/sv`, `/en`, `/ar`, `/so`.
- Catalogue pages: `/products`, `/products/[slug]`, `/product/[id]`, `/items`,
  `/items/[id]`, `/categories`, `/categories/[slug]`.
- Store and market views: `/stores`, `/stores/[slug]`, `/map`, `/heatmap`,
  `/store-coverage`, `/chain-coverage`, `/chain-index`, `/index/[symbol]`,
  `/fuel`, `/pharmacy`.
- Shopper tools: `/basket`, `/weekly-basket`, `/compare`, `/compare-items`,
  `/watchlist`, `/alerts`, `/unit-price-alerts`, `/favorites`, `/favourites`,
  `/list`, `/scanner`, `/meal-planner`, `/meal-cost`, `/pantry-planner`,
  `/shopping-trips`, `/savings-dashboard`.
- Discovery and editorial pages: `/deals`, `/screener`, `/search`,
  `/catalogue-savings`, `/coupon-stacks`, `/expiry-deals`,
  `/nutrition-value`, `/seasonal-calendar`, `/openprices-depth`,
  `/index-methodology`, `/data-sources`.
- Account/legal pages: `/login`, `/account`, `/account/profile`, `/settings`,
  `/privacy`, `/cookies`.
- SEO aliases/widgets: `/billigaste/[slug]`, `/prisjamforelse/[slug]`,
  `/widgets/grocery-index-ticker`.

API routes exported from this app include:

- `GET/POST /api/alerts` and item operations below `/api/alerts/[id]`.
- `POST /api/digest` for digest previews.
- `GET /api/products` for product search/list responses.
- `POST /api/list/share` for signed shopping-list share payloads.
- `GET /api/export/prices` for price export data.
- `GET /api/ops/norway-readiness` for ops readiness status.
- `POST /api/webhooks/price-change` for price-change webhook delivery tests.

## Components

Reusable UI is in `src/components`:

- Navigation and layout: `app-nav.tsx`, `bottom-nav.tsx`, `market-shell.tsx`,
  `Breadcrumb.tsx`, `data-ui.tsx`.
- Catalogue/search: `SearchBar.tsx`, `LazyItemCard.tsx`,
  `ItemComparisonTable.tsx`, `TrendingCarousel.tsx`, `product-price-cards.tsx`,
  `confidence-badge.tsx`, `price-chart-terminal.tsx`, `store-map.tsx`.
- Shopper actions: `basket-calculator.tsx`, `BulkImportDialog.tsx`,
  `CheckableListItem.tsx`, `favourite-product-toggle.tsx`,
  `unit-price-alert-actions.tsx`, `scanner-upload-actions.tsx`.
- Account/compliance actions: `account-billing-actions.tsx`,
  `account-mutation-actions.tsx`, `consent-manager.tsx`,
  `privacy-request-actions.tsx`, `settings-data-export-actions.tsx`.
- Shared UI primitives: `ui/button.tsx`.

## Public exports

The app's public surface is the route tree above plus selected exported helpers
that tests and pages import directly:

- App Router exports: `generateMetadata`, `generateStaticParams`, route
  handlers, `metadata`, `manifest`, `robots`, and `sitemap` exports in
  `src/app`.
- Component exports such as `AppNav`, `BottomNav`, `MarketShell`, `SearchBar`,
  `BasketCalculator`, `ProductPriceCards`, `StoreMap`, `PriceChartTerminal`,
  `AlertListItem`, `BulkImportDialog`, `Button`, and related prop/type exports.
- Hooks: `useList`, `useIntersectionObserver`, and their exported types.
- Data/model helpers under `src/lib`, including `products`, `stores`,
  `categories`, `axfoodProducts`, `buildChainComparisonTable`,
  `buildChainIndexTrendSeries`, `buildCatalogSitemapEntries`, map helpers,
  watchlist data, SEO helpers, and generated DB-site snapshots.

Prefer adding new shared UI to `src/components` and new pure data helpers to
`src/lib`; keep route-only logic inside its `src/app/.../page.tsx` or
`route.ts` file.

## Key files

| Path | Purpose |
| --- | --- |
| `src/app/layout.tsx` | Root document shell, metadata, providers, navigation, and footer. |
| `src/app/page.tsx` | Main GroceryView landing/terminal page. |
| `src/app/providers.tsx` | Client providers such as React Query. |
| `src/app/globals.css` | Tailwind and global CSS. |
| `src/components/` | Reusable client/server components. |
| `src/hooks/useList.ts` | Local shopping-list state, bulk import, and share-link signing. |
| `src/lib/demo-data.ts` | Curated in-app product, store, deal, and scenario fixtures. |
| `src/lib/generated/` | Generated DB-site snapshots consumed by static pages. |
| `src/lib/ingested/` | Checked-in retailer ingestion outputs used for catalogue coverage. |
| `src/lib/seo.ts` and `src/lib/seo-landing-pages.ts` | Metadata and SEO landing-page helpers. |
| `src/middleware.ts` | Next.js middleware for request-level routing behavior. |
| `messages/` | Localized message catalogues. |
| `scripts/*.test.mjs` | Node test suite for route and UI source assertions. |
| `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs` | Framework and styling config. |
| `lighthouserc*.cjs`, `size-limit.config.cjs` | Performance and bundle guardrails. |

## Usage example

Use the list hook in a client component to add a grocery item and keep checked
state persisted locally:

```tsx
'use client';

import { useList } from '@/hooks/useList';

export function QuickAddMilk() {
  const { items, addItem, toggleItem } = useList();
  const milk = items.find((item) => item.id === 'milk-1l');

  return (
    <button
      type="button"
      onClick={() => {
        if (milk) toggleItem(milk.id);
        else addItem({ id: 'milk-1l', name: 'Milk 1L', quantity: 1 });
      }}
    >
      {milk?.checked ? 'Uncheck milk' : 'Add milk'}
    </button>
  );
}
```

When adding new routes, add or update a route-level assertion in
`apps/web/scripts/next-routes.test.mjs` so CI catches missing copy, metadata, or
expected integration markers.
