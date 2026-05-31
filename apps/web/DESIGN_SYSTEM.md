# GroceryView Design System — Rules & Figma/MCP Integration Guide

> Single source of truth for building UI in the **official Next.js app** (`apps/web`).
> Read this before adding pages, components, or porting designs (including Figma exports
> or standalone prototypes). It reconciles the shipped `--gv-*` token system with the
> "three-style" target direction.

---

## 0. North-star: the three-style blend (HARD product rules)

1. **Scandinavian clarity for all core UI** — search, product cards, price tables,
   evidence/citations, forms, CTAs. Calm, readable, high-contrast, accessible.
2. **Bloomberg-style density for analysis zones only** — Market Trends, product price
   history, fuel charts, admin analytics. Charts, heatmaps, tickers, watchlists, index
   tables, sparklines live **here**, not in core flows.
3. **Geometric data-collage art for hero / empty / accent areas only.** Accent palette
   (burgundy / forest / neon-lime / purple / yellow) decorates; it **never** colors
   product cards, price tables, evidence, forms, or CTAs.

**Non-negotiable constraints:**
- **Official app only.** Do NOT create a second UI under `public/v2`, `public/v1`, or any
  parallel static bundle. All UI ships in `apps/web/src`. (Prototypes are *references*;
  port their design into real components.)
- **Search-first homepage.** The home route leads with search + a subtle geometric hero +
  a small market ticker — not a wall of charts.
- **Densest area = Market.** `/market` (and `[country]/...` analysis routes) may be the
  most Bloomberg-like.
- **Decision-first flows.** Search/product/deal pages stay clean and scannable.
- **Every UI change ships with tests** (see §8): search-first home, chart fallbacks,
  no debug/placeholder copy, decorative art not rendered inside core data components.

---

## 1. Design tokens

**Source of truth:** `apps/web/src/app/globals.css` (CSS custom properties, `--gv-*`).
Mirrored/extended in `apps/web/tailwind.config.ts`. Validated by
`apps/web/scripts/design-tokens.test.mjs` (asserts the `--gv-*` set exists — keep it green).

### Shipped tokens (`globals.css`)
```
Surfaces   --gv-bg #f7f3ea (oat) · --gv-bg-soft #fbf8ef · --gv-surface #fff · --gv-surface-muted #f1eee5
Ink        --gv-ink #10211a · --gv-ink-soft #46544c · --gv-muted #7a857d
Brand      --gv-primary #064e3b · --gv-primary-strong #022c22 · --gv-primary-soft #dff7ea · --gv-accent #bdeb4b (lime) · --gv-mint #a7f3d0
Semantic   --gv-success #047857 · --gv-warning #b7791f · --gv-danger #be123c · --gv-info #2563eb · --gv-border #d9dfd6
Elevation  --gv-shadow (0 18px 45px …/0.08) · --gv-shadow-sm (0 8px 24px …/0.06)
Radius     --gv-radius-control 12 · --gv-radius-card 16 · --gv-radius-section 24 · --gv-radius-hero 32
Spacing    --gv-space-xs 4 … --gv-space-3xl 64 · --gv-space-page 96
Type       --gv-font-stack (Inter …) · --gv-text-body 16 · --gv-text-small 14 · --gv-text-micro 12
```
Dark mode: class-based (`darkMode: 'class'`), overrides under `.dark` / `prefers-color-scheme`.

### Brand-art accent tokens — DECORATIVE ONLY
`apps/web/src/components/brand-art/brand-art-tokens.ts`
```
burgundy #5A1830 · burgundyDeep #3D0F20 · forest #1F4D3A · forestLight #2A6B52
neonLime #C8FF3D · purpleFrame #7B4DFF · signalYellow #FFE566
```
Used only by `BrandArtHeroShell` and `DataCollageSvg`. **Never** import these into a
product/price/data component.

### Swedish flag colors — FIXED CONSTANTS (do not theme)
Blue `#006AA7`, Yellow `#FECC00`. If/when a flag is rendered, these are constants, never
recolored by palette/theme changes.

### Target direction (from the latest prototype) — migration map
The newest prototype refines the identity. When adopting it, change the **token layer**,
not each component. Map prototype → `--gv-*`:

| Prototype token | Value | Maps to |
|---|---|---|
| `--font-display` | `'Newsreader', Georgia, serif` | add `--gv-font-display`; editorial headings (hero, section titles like *Fuel by type*) |
| `--font` | `'Inter Tight', system-ui` | `--gv-font-stack` (UI/body) |
| `--mono` | `'JetBrains Mono', ui-monospace` | add `--gv-font-mono`; all **numeric/data** cells (prices, %Δ, indices, tickers) |
| `--brand` | `oklch(48% 0.16 38)` (terracotta) | `--gv-primary` candidate — confirm with operator before flipping from forest emerald |
| `--up` / `--down` | `oklch(46% .14 152)` / `oklch(48% .18 25)` | `--gv-success` (up) / `--gv-danger` (down) for %Δ |
| `--r-xs…--r-xl` | 2–10px (sharp) | tighten `--gv-radius-*` for the terminal/editorial feel |
| shadows | hairline + soft | `--gv-shadow-sm/-md/-lg` |

**Rule:** prefer **OKLCH** for new color tokens. Numeric data uses the **mono** font;
display headings use the **serif**; everything else uses Inter Tight. Keep one token layer
in `globals.css` + `tailwind.config.ts`; do not hardcode hex in components.

---

## 2. Tailwind & styling approach

- **Tailwind 3.4** (`apps/web/tailwind.config.ts`), `darkMode: 'class'`, content `./src/**/*.{ts,tsx}`.
  Theme extension currently adds `market.{ink,paper,mint,tomato,oat}`. Add new brand/serif/mono
  families and OKLCH colors here rather than inline.
- **Utilities inline in JSX**, merged with `cn()` (`apps/web/src/lib/utils.ts` = `twMerge(clsx(...))`).
- **Variants via `class-variance-authority` (CVA)** — see `apps/web/src/components/ui/button.tsx`.
- **Token-bound class strings** in `apps/web/src/components/design-system/shared.ts`
  (`dsCard`, `dsSectionCard`, `dsEyebrow`, `dsPrimaryButton`, `dsSecondaryButton`). Reuse these;
  don't reinvent card/button class soup.
- No CSS Modules, no styled-components/Emotion. Reference tokens as
  `bg-[var(--gv-surface)]`, `rounded-[length:var(--gv-radius-card)]`,
  `text-[color:var(--gv-primary)]`.

```ts
// cn() — the only class-merge helper
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

---

## 3. Component library

**Primitives** — `apps/web/src/components/data-ui.tsx`:
`PageShell` (nav + main max-w-7xl + footer + BottomNav), `Eyebrow`, `Card`, `DashboardHero`,
`StatusBadge`, `SourceCitation`, `NoVerifiedData`, `MetricGrid`, `TopSpreads`,
`SearchRecoveryPanel`, source-health/coverage panels.

**Shared package** — `packages/ui/src`: `FormField`, `CursorPagination`, `ChainLogo`
(coop/hemkop/ica/lidl/netto/willys).

**Core-flow components** (keep Scandinavian-clean): `SearchBar`, `ItemGrid`/`ItemCard`/`LazyItemCard`,
`FilterPanel`, `BasketBuilder`/`BasketCalculator`, `StoreComparisonTable`, `AddressSearch`, `StoreMap`.

**Bloomberg-density components** (analysis zones only): `PriceChartTerminal`
(uses `lightweight-charts`), `StorePriceMatrix` (Regular/Member/Coupon/Stacked modes),
`GroceryIndexTicker` (widget), `Heatmap` (`app/heatmap`), `TrendingCarousel`.

**Rules:**
- New core-flow UI composes `PageShell` + `data-ui` primitives + `design-system/shared.ts` classes.
- Charts/tickers/heatmaps are imported **only** in Market, product price-history, fuel, and
  admin-analytics routes — never in search/product/deal decision flows.
- Every data component must handle the **empty/unknown** state with `NoVerifiedData` /
  `SourceCitation` (no fabricated rows, no placeholder numbers). See §7.

---

## 4. Icons

**Lucide React** (`lucide-react`) only — named imports (`import { Search, Heart } from 'lucide-react'`).
No custom SVG icon sets, no heroicons. Chain logos are real SVGs in `public/logos/*.svg` via
`packages/ui` `ChainLogo`. Decorative geometric SVGs belong to `brand-art/` only.

---

## 5. Fonts / typography

- Loaded via the font stack token (`--gv-font-stack`, Inter today). When adopting the prototype,
  add **Newsreader** (display) + **Inter Tight** (UI) + **JetBrains Mono** (data) — prefer
  `next/font` (self-hosted, no layout shift) over a raw Google Fonts `<link>`.
- Scale: `--gv-text-body 16 / -small 14 / -micro 12`. Eyebrows: uppercase, `tracking-[0.2em]`,
  micro size, `--gv-primary`.
- **Numbers are mono.** Prices, %Δ, indices, ticker values render in the mono family for the
  terminal feel and column alignment.

---

## 6. Assets & images

- `next/image` with configured `remotePatterns`: `assets.axfood.se`, `images.openfoodfacts.org`,
  `images.openbeautyfacts.org`; local `/api/images`. Add new hosts to `next.config.mjs` (don't use
  raw `<img>` for remote product images).
- Formats: AVIF/WebP; deviceSizes/imageSizes preconfigured. Static art in `public/`.

---

## 7. Data & evidence rules (core to this product)

- **Real data only.** Pages read verified data via the app's data layer (`@/lib/verified-data`,
  the DB-backed API routes `/api/search`, `/api/products`, `@groceryview/db`). No invented
  prices/rows. Wiring a ported prototype = replace its `data.js` mocks with these sources.
- Every price/index/stat carries provenance: `SourceCitation` (source label, observedAt,
  confidence). Missing data → `NoVerifiedData`, never a zero/placeholder.
- **No debug copy** in shipped UI (no "TODO", "lorem", "placeholder", "demo data", "FIXME").

---

## 8. Required tests for any UI change

Unit: `node:test` + `@testing-library/react` in `src/components/__tests__`.
E2E: Playwright in `apps/web/e2e` (`baseURL` :3000, locale sv-SE).
Token guard: `scripts/design-tokens.test.mjs`.

Add/extend tests asserting:
1. **Search-first home** — home renders the search affordance above any chart/ticker.
2. **Chart fallbacks** — chart components render a graceful empty/unknown state when series is
   empty (no crash, no blank box) — assert `NoVerifiedData`/fallback text.
3. **No debug copy** — a guard test greps rendered output / source for placeholder strings.
4. **Decorative art isolation** — brand-art components are not imported by core data components
   (e.g. a test/lint asserting `brand-art/*` is referenced only by hero/empty/accent files).
5. **No second UI** — a guard asserting no `public/v1|v2` HTML UI bundle is reintroduced.

---

## 9. Project / route structure

```
apps/web/src/
  app/
    layout.tsx            # globals.css, providers (React Query), theme script, metadata/PWA
    page.tsx -> MvpHomePage  # SEARCH-FIRST home (BrandArtHeroShell + PageQuestionHeader)
    market/               # densest Bloomberg zone (+ [category])
    [country]/            # sweden|norway|iceland: compare, deals, fuel, chain-index, pharmacy, …
    grocery-index/        # personalized index landing (renamed from /index — keep redirect)
    products/[slug]/ · search/ · stores/ · heatmap/ · admin/ …
  components/             # data-ui, ui/ (CVA), design-system/, brand-art/, charts/ticker/matrix
  lib/                    # verified-data, utils(cn), seo, cache-policy
packages/ui/src/          # FormField, CursorPagination, ChainLogo
```

Compose pages with `PageShell`. Country routes carry hreflang SEO. Keep the `/index→/grocery-index`
redirect (a route literally named `index` collides with Next's root output).

---

## 10. Porting a prototype / Figma export — checklist

1. Map prototype tokens → `--gv-*` in `globals.css` + `tailwind.config.ts` (don't hardcode).
2. Add fonts via `next/font`; numbers → mono, display → serif, UI → Inter Tight.
3. Rebuild screens as React components under `src/components` + route pages — reuse `data-ui`,
   `design-system/shared.ts`, CVA, `cn()`, Lucide.
4. Replace mock `data.js` with real sources (`verified-data` / DB API); attach `SourceCitation`
   + `NoVerifiedData`.
5. Keep charts/tickers in Market/history/fuel/admin; keep home search-first; keep art decorative.
6. Add the §8 tests. Run `npm run build:web && next build` locally before deploy.
7. Never introduce `public/v2`.
```
