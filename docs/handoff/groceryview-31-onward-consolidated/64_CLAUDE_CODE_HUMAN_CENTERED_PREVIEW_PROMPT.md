# 64 — Claude Code Human-Centered Preview UI Prompt

```text
You are working on GroceryView latest main.

The site should be human-centered (以人為本). Do not show everything on public pages. Users need clear answers, previews, and optional detail—not raw debug logs.

Implement a frontstage/backstage interaction model.

1. Add preview components:
   - ProductPreviewCard
   - StorePreviewCard
   - CategoryPreviewCard
   - DealPreviewCard
   - FuelStationPreviewCard
   - PharmacyOtcPreviewCard
   - EvidenceDrawer
   - PreviewSideDrawer
   - PreviewBottomSheet
   - DisclosurePanel

2. Use the right pattern:
   - tooltip: tiny non-interactive explanations only
   - disclosure/details: optional text
   - preview card: quick facts
   - side drawer: desktop contextual detail
   - bottom sheet: mobile contextual detail
   - modal: only focused tasks like sign-in, set alert, report issue, confirm destructive action
   - full page: canonical detail, SEO, shareable

3. Public pages should show:
   - meaning
   - price/trend/deal answer
   - confidence/freshness
   - next action

4. Public pages should NOT show:
   - source_run_id
   - raw_record_id
   - parser version
   - server-side cursor pagination
   - buildPriceChartSeries
   - raw_records
   - connector debug logs
   - pipeline internals

5. Move technical details to backstage:
   - /admin/source-runs
   - /admin/dead-letters
   - /admin/data-quality
   - /admin/lineage
   - /admin/search-analytics
   - /admin/query-performance
   - /admin/content-lint

6. Add behavior:
   - search product quick view opens side drawer on desktop
   - search product quick view opens bottom sheet on mobile
   - map marker opens selected detail panel/bottom sheet
   - market category row can preview trend before opening full category page
   - deal card can preview why-ranked explanation
   - evidence strip opens EvidenceDrawer

7. Add accessibility:
   - no hover-only content
   - tooltips have aria-describedby
   - disclosures use aria-expanded
   - dialogs/drawers have headings and close buttons
   - focus returns to trigger
   - Escape closes overlays
   - bottom sheets have accessible labels

8. Add tests:
   - public pages do not contain backstage/debug terms
   - preview buttons exist on search results
   - evidence drawer includes source/freshness/confidence
   - modals are not used for normal previews
   - backstage routes are admin-only
   - mobile bottom sheet exists for map/search previews

Finish when:
- users can understand the page without seeing debug data
- users can preview before committing to a full page
- full pages remain canonical and shareable
- backstage keeps the technical depth
```
