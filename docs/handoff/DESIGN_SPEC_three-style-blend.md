# GroceryView — Design Spec: Three-Style Blend

**Status:** DRAFT for approval (not yet implemented)
**Author brief (verbatim, 2026-05-31):**
> Blend three styles: Scandinavian clarity for all core UI, Bloomberg-style density for analysis/chart zones, and geometric data-collage art only for hero/empty/accent areas. Keep search/product/deal flows clean and decision-first; use charts, heatmaps, tickers, and watchlists mainly in Market Trends, product history, fuel charts, and admin analytics. Use art colors burgundy/forest/neon-lime/purple/yellow as accents, but keep product cards, price tables, evidence, forms, and CTAs calm, readable, and accessible. Homepage should be search-first with subtle geometric hero art and a small market ticker; Market page can be the densest Bloomberg-like area.

This spec turns that brief into concrete, buildable rules. It **extends** the existing `design/editorial-terminal-v3` design system (warm-cream paper, Newsreader/Inter-Tight/JetBrains, terracotta accent) — it does not replace it.

---

## 1. The three styles — where each one is allowed

| Style | Zone (where it applies) | Never applies to |
|---|---|---|
| **A. Scandinavian clarity** (default) | All core UI: nav, product cards, price tables, deal cards, evidence strips, forms, CTAs, search results | — (this is the baseline everywhere) |
| **B. Bloomberg density** (data-dense) | Market/Trends page, product price history, fuel charts, admin analytics. Charts, heatmaps, tickers, watchlists. | product cards, forms, CTAs, checkout/deal flows |
| **C. Geometric data-collage art** (expressive) | Hero band, empty states, section accents, 404/landing splash | anything with a decision or a number to read (tables, cards, forms) |

**Governing rule:** the warm-cream paper and calm typography never change. Density and art are *additive layers* in their allowed zones only. If a surface shows a price, a CTA, or a form → it's Style A, full stop.

---

## 2. Color system

### 2.1 Core palette (unchanged — Style A & B)
From v3 `design-system.css`. Calm, accessible, used for all readable UI:
- bg `oklch(96.5% 0.012 78)` · surface `oklch(98% 0.008 78)` · ink `oklch(18% 0.020 250)`
- rule `oklch(86% 0.014 78)` · primary/brand terracotta `oklch(48% 0.16 38)`
- up/positive `oklch(46% 0.14 152)` · down/negative `oklch(48% 0.18 25)` · warn `oklch(58% 0.14 80)` · info `oklch(42% 0.14 240)`

### 2.2 Art palette (NEW — Style C only)
The five art accents, used **only** in geometric art zones (hero shapes, empty-state illustration, decorative section dividers). Never on cards/tables/CTAs.
- **burgundy** `oklch(38% 0.13 12)`
- **forest** `oklch(45% 0.12 152)`
- **neon-lime** `oklch(88% 0.22 128)`  ← high-energy, decorative ONLY (fails text contrast — never use for type/UI)
- **purple** `oklch(48% 0.18 300)`
- **yellow** `oklch(86% 0.16 95)`

Tokens to add: `--art-burgundy`, `--art-forest`, `--art-lime`, `--art-purple`, `--art-yellow`. Scope them under an `.art` / `[data-zone="art"]` wrapper so they can't leak into core UI.

### 2.3 Accessibility guardrail
neon-lime and yellow are decorative-only (large geometric fills, ≥24px, non-text). All **text, icons, badges, and interactive states** use the core palette and must hit WCAG AA (4.5:1 body, 3:1 large/UI). A lint test will assert no `--art-*` token appears inside card/table/form/button selectors.

---

## 3. Page-by-page intent

### 3.1 Homepage — **search-first** (Style A + subtle C)
Top-to-bottom:
1. **Hero band** — large search input is the visual + functional center ("Search any product, store, or category"). Behind/around it: *subtle* geometric data-collage art (Style C) using art palette at low opacity — thin rules, offset rectangles, a sparkline motif. Art must not compete with the search field.
2. **Small market ticker** — one slim horizontal ticker (price index, top movers). Compact, mono numerics. Not the full Bloomberg board.
3. **Calm content** below: domain entry cards (groceries/fuel/pharmacy), today's best deals, featured products — all Style A.

Explicitly **drop** the index-first "Nordic price index" hero that the prototype/v3 currently leads with → demote it to the Market page.

### 3.2 Market / Trends page — **densest, Bloomberg** (Style B)
This is where density lives: the price-index board, sector breakdown, heatmaps, multi-series charts, watchlist, biggest movers. Dense rows, mono numerics, tight rules, terminal feel. The "Nordic price index" hero moves here.

### 3.3 Product / Deal / Search flows — **clean, decision-first** (Style A)
Product cards, price tables, evidence strips, compare, basket, checkout: calm and readable. Charts allowed **only** in product *price history* (Style B inset), not in the card grid.

### 3.4 Empty states & 404 — **art** (Style C)
Geometric data-collage illustration with the art palette. The one place the expressive style runs free.

### 3.5 Admin analytics — Style B (dense charts/tables, internal).

---

## 4. Typography
- Display (Newsreader serif) — headings, hero. Optional Bodoni Moda accent in art zones only.
- Body/UI (Inter Tight) — all readable UI.
- Mono (JetBrains Mono) — all numerics, tickers, tables, chart axes.

(Drop the prototype's DM Sans / Archivo experiments unless used purely as art-zone display.)

## 5. Motion
Keep v3's gentle `gvRise` entrance + hover-lift on cards. Art zones may add slow, low-amplitude geometric motion (respect `prefers-reduced-motion`). Charts: no decorative motion.

---

## 6. Build plan (after this spec is approved)
**Phase 1 — base to main:** rebase the v3 Scandinavian+Bloomberg design layer onto current `main` (it's 172 commits behind), wire `app/page.tsx`, update contract tests, render-verify, merge. Gets the site off the old look.
**Phase 2 — this blend:** new PR adds the `--art-*` palette, the geometric hero art component, search-first homepage reorg, Bloomberg-dense Market page, empty-state art. Each render-verified.

## 7. Open questions for sign-off
1. Search-first hero: search bar alone, or search + the small ticker stacked in the hero band?
2. Geometric art intensity: barely-there (texture) or a bold statement panel beside the search?
3. Is neon-lime the primary art "pop", or reserved for rare highlights?
4. Should the homepage keep ANY chart above the fold, or is that strictly Market-page now?
