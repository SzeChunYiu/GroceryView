# 03 — Task B: Wire Preview Components into Public Flows

## Task
Preview components now exist. Make them visible in the website flow.

## Scope
```text
apps/web/src/components/preview/*
apps/web/src/app/search/page.tsx
apps/web/src/app/deals/page.tsx
apps/web/src/app/map/page.tsx
apps/web/src/app/market/page.tsx
apps/web/scripts/interactive-preview-contracts.test.mjs
docs/roadmap/feature-implementation-registry.md
```

## Do
1. Search page: add a `Quick view` action to product result cards using a preview component.
2. Deals page: add `Why this deal?` preview using `DealPreviewCard`.
3. Market page: add category preview behavior for category rows or heatmap cells.
4. Map page: marker/list entries should open store/fuel/pharmacy preview panel where data exists.
5. Evidence text/strip should open `EvidenceDrawer` where feasible.

## Do not
Do not replace full pages with previews. Do not create hover-only content. Do not use modal for ordinary previews. Do not add fake data.

## Accessibility
Previews must be keyboard reachable; close button exists; Escape closes drawer/sheet if interactive; focus returns to trigger.

## Tests
```bash
npm run test -w @groceryview/web -- apps/web/scripts/interactive-preview-contracts.test.mjs
```

## Acceptance
At least search and deals use preview components, not only exports.
