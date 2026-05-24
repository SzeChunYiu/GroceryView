# GroceryView Web App

`apps/web` contains the React frontend for GroceryView, built with **Next.js 16 (App Router)**.
The package provides shopper-facing pages such as homepage, products, stores, weekly basket, scanner, and shopping list flows with local components and offline queue helpers.

## Where the code lives

- **`src/app/`**: Next.js routes (App Router). Includes pages and shared layout.
- **`src/components/`**: Reusable UI pieces (market shell, cards, charts, lists, scanner widgets).
- **`src/lib/`**: Local data/helpers used by pages and components.
- **`src/lib/pwa/`**: Browser-only support utilities, including offline queue helpers.
- **`public/`**: Static assets for the web package.
- **`scripts/`**: Lightweight project-level checks used by the package test script.

## Common local commands

From repository root:

```bash
# install workspace dependencies
npm install

# run this package only
npm run dev -w @groceryview/web
npm run test -w @groceryview/web
npm run build -w @groceryview/web
```

From `apps/web`:

```bash
node --test scripts/*.test.mjs
```

For the app itself:

```bash
npm run dev
```

Then open:

- `http://localhost:3000` (homepage)
- `http://localhost:3000/products`
- `http://localhost:3000/stores`
- `http://localhost:3000/weekly-basket`

## Top-level public modules

- Route modules under `src/app`:
  - `page.tsx` (homepage shell entrypoint)
  - `layout.tsx` (global providers + shell layout)
  - `products/page.tsx`
  - `stores/page.tsx`
  - `weekly-basket/page.tsx`
  - `scanner/page.tsx`
  - `list/page.tsx`
  - plus account, login, and privacy pages

- Shared UI modules:
  - `components/market-shell.tsx`
  - `components/scan`-related and card/widgets under `components/`
  - `components/ui/` for reusable primitives

- Shared logic modules:
  - `lib/demo-data.ts`
  - `lib/utils.ts`
  - `lib/openprices-products.ts`
  - `lib/osm-stores.ts`
  - `lib/ingested/*`
  - `lib/pwa/offline.ts`
