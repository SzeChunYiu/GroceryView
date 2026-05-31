# GroceryView — UI/UX Upgrade Plan (toward award-tier feel)

**Goal:** move from "clean and functional" to "distinctive, polished, top ~10% data-product site" — flirting with Awwwards/CSSDA tier — using Claude Code, free assets, and motion. No AI credits required.

## Honest ceiling (read this first)
Claude Code CAN deliver: world-class **layout, typography, color craft, motion/micro-interactions, polish**, and competent **WebGL/canvas** hero effects. Claude Code CANNOT originate **bespoke illustration / hand-drawn / 3D art** — that needs a human illustrator, a commission, or Figma Make. The realistic target here is award-*adjacent* through craft + motion, with art filled by free open-license assets. The biggest, most underused lever is **motion** (100% code, zero credits).

To calibrate the bar, the user should drop 3-5 competition-winner URLs/screenshots into `docs/handoff/REFERENCES/` — the motion/type/grid techniques get extracted from those and applied here.

---

## Current state (from the component audit, this branch)
- 16 STRONG, token-correct components already exist (ProductCard, DealCard, EvidenceStrip, KpiCard, ChartShell, FilterRail, EmptyState, PageShell/AppNav/BottomNav, PriceChartTerminal, ConfidenceBadge, DataStatePanel, GeometricHeroArt, SearchFirstHome scaffold).
- **Two color palettes fight each other**: legacy emerald/slate vs. the v3 warm-cream/terracotta `--gv-*` oklch tokens. This inconsistency is the #1 thing making it look unpolished.
- 6 sets of duplicate components across `design-system/` vs `mvp/` vs `preview/`.
- Real gaps: hero search has no autocomplete (plain `<form>`), no command palette, no reusable `<MarketTicker>`, no Market price-index board, no Style-C geometric empty-states, no general form atoms.

---

## Phase 1 — Token unification (biggest visual ROI, do FIRST)
Kill the emerald/slate→terracotta split. One source of truth.
- Map every legacy emerald/slate usage to the v3 `--gv-*` oklch tokens. Targets: `SearchBar.tsx`, `app-nav.tsx` (emerald-950 active → `--gv-primary`), `bottom-nav.tsx`, `preview/*-preview-card.tsx`, `mvp/deal-badge.tsx`, `confidence-badge.tsx` (map level colors), `search/search-filter-rail.tsx`, `mvp/visual-intelligence.tsx` chart colors (hardcoded `#047857`), `ui/button.tsx` (orphaned `market-*` tokens → reconcile with `dsPrimaryButton`).
- Add a lint/contract test asserting `--art-*` tokens never appear in card/table/form/button selectors (spec §2.3 — currently only a CSS comment).
- Verify: screenshot before/after; AA contrast holds.

## Phase 2 — Deduplicate (consistency)
Keep the canonical, delete/alias the rest (per audit):
- Product card → `design-system/product-card.tsx` (drawer contexts use `preview/product-preview-card.tsx`); delete `mvp/product-card.tsx` wrapper.
- Deal card → `design-system/deal-card.tsx`. Evidence strip → `design-system/evidence-strip.tsx` (delete `mvp/evidence-strip.tsx`).
- ChartShell + KpiCard → the `design-system/` versions. **Fix regression:** `search-first-home.tsx` currently imports KpiCard from `mvp/visual-intelligence` — repoint to `design-system/kpi-card`.
- Breadcrumbs → consolidate `Breadcrumb.tsx` + `Breadcrumbs.tsx` + `mvp/mvp-breadcrumbs.tsx` into one.

## Phase 3 — Fill real gaps (shadcn/ui primitives, themed to --gv-*)
Add ONLY interaction primitives (not cards/charts — those stay bespoke):
- `Command` (cmdk) → the missing Cmd-K command palette + wire the hero search to real autocomplete (reuse `SearchBar.tsx`'s suggestion logic, restyle to tokens).
- `Dialog`/`Sheet`/`Drawer` (Radix) → replace hand-rolled `preview/preview-drawer.tsx` etc. (gains focus-trap, aria, animation).
- `Select`, `Popover`, `Tooltip` → themed to `--gv-*`.
- Build `<MarketTicker>` (extract from homepage inline), and the Market **price-index board** for phase 2b.

## Phase 4 — Motion layer (the award-tier lever, code-only)
This is where "wow" comes from. Add tastefully, respect `prefers-reduced-motion`:
- Library: Framer Motion (or CSS scroll-driven animations + a little GSAP for sequenced hero).
- Hero: staggered entrance, search field focus choreography, subtle parallax on the geometric art.
- Market ticker: real continuous marquee with eased pauses on hover.
- Charts: draw-on animation (PriceChartTerminal line reveal), number count-ups on KPIs.
- Lists/cards: stagger-in on scroll (IntersectionObserver), hover lift with spring easing.
- Page transitions: view-transition API / Framer layout transitions.
- Loading: skeleton choreography, not spinners.

## Phase 5 — Art assets (free, no credits)
- Hero / accent / empty-state art: Hero Patterns (CC0 geometric), unDraw (recolor to terracotta), Tabler/Lucide motifs — per `DESKTOP_SESSION_PROMPT.md`. Build 2-3 variants, user picks.
- Optional WebGL hero: a tasteful generative shader/canvas backdrop (Claude-authored) as one variant — judge by screenshot, keep only if it looks intentional.
- TRUE bespoke illustration (if user wants it): commission a human or use Figma Make — out of code scope; flagged honestly.

## Phase 6 — Measure (real optimization, not vibes)
- Lighthouse / Core Web Vitals (repo has `perf:lighthouse:ci`), INP, bundle budget (`perf:bundle:budget`).
- Accessibility pass: WCAG AA contrast, keyboard nav, focus rings, reduced-motion.
- Verify every phase with HTTP 200 + screenshot before claiming done.

---

## Sequencing & where it ships
All on branch `feat/figma-homepage` / PR #3808 (additive; never break main; SzeChunYiu pushes only).
Order by ROI: **Phase 1 (tokens) → 2 (dedupe) → 4 (motion) → 5 (art) → 3 (gaps) → 6 (measure)**. Phases 1-2 alone make it look dramatically more "designed"; phase 4 is what buys the award-tier *feel*; phase 5 fills the art; phase 3 adds the missing interactions; phase 6 proves quality.

## What needs the user (only two things)
1. Drop 3-5 competition-winner references into `docs/handoff/REFERENCES/` to calibrate the look.
2. For TRUE bespoke illustration/3D only: a human designer / Figma Make. Everything else is code + free assets.
