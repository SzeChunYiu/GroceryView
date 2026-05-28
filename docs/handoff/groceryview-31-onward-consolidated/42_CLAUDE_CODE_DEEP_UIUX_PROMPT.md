# 42 — Claude Code Deep UI/UX Prompt

```text
You are working on GroceryView latest main.

The project idea is strong, but the UI currently feels unattractive and inconsistent. Redesign the UI system so GroceryView feels like a polished Nordic price-intelligence product.

Do not only change colors. Build a complete visual design system.

Research-informed principles:
- Follow NN/G usability heuristics: visibility, real-world language, consistency, recognition, minimalist design, error recovery.
- Follow design-system discipline: tokens, semantic color, reusable components, interaction states.
- Use Power BI/Tableau patterns for the Market page: KPI row, filter rail, primary visual, supporting visuals, drillthrough.
- Use Google/Algolia-like search UX: result-first, typo/synonym aware, filters, sort, recovery.
- Follow WCAG accessibility: readable contrast, keyboard focus, chart descriptions, table fallbacks.
- Keep ads separated and labelled Advertisement.

Implement:

1. Brand / theme
   - Warm oat background
   - Deep forest green primary
   - Fresh lime/mint accent
   - Semantic warning/danger/info colors
   - Polished card surfaces
   - Consistent typography and spacing tokens

2. Component polish
   - PageQuestionHeader
   - ProductCard
   - DealCard
   - KpiCard
   - EvidenceStrip
   - ChartShell
   - AdSlot
   - EmptyState
   - FilterRail
   - SortControl

3. Page redesigns
   Home:
   - strong hero
   - big search
   - domain cards
   - deal preview
   - market snapshot
   - clean how-it-works

   Search:
   - result-first
   - polished product cards
   - domain chips
   - visible sort/filter
   - no technical copy

   Market:
   - KPI row
   - left filter rail
   - primary chart
   - category table
   - heatmap
   - data quality

   Browse:
   - attractive category cards
   - chain/type discovery

   Product:
   - hero with image and price answer
   - where-to-buy
   - price history
   - comparison bands
   - evidence

   Deals:
   - exciting but trustworthy deal cards
   - clear Real Deal / Fair Discount / Not Really a Deal labels

   Map:
   - real controls
   - map
   - selected detail
   - list fallback

   Pharmacy:
   - safety-first, exact EAN, blue/indigo calm design

   Fuel:
   - grade selector, price chart, station candidates, clear source boundary

4. Copy cleanup
   Replace technical-first phrases:
   - server-side cursor pagination → showing results
   - ingestion pipeline → verified price source
   - dated OpenPrices tape → price history from observations
   - domain=fuel observations → verified fuel price rows

5. Mobile polish
   - use simplified mobile nav
   - one-column cards
   - filter drawers
   - bottom sheet for map detail
   - no dense tables without card fallback

6. Tests
   - content lint
   - no forbidden public copy
   - card route tests
   - ad placement tests
   - mobile nav tests
   - accessibility chart fallback tests

Finish when a normal user can answer in 5 seconds:
- What is this page?
- What is the main thing I should do?
- Why should I trust this?
```
