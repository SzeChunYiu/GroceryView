# 65 — Interaction Acceptance Tests

## Public copy tests

Public pages must not include:

```text
source_run_id
raw_record_id
server-side cursor pagination
buildPriceChartSeries
raw_records
parser version
COPY staging
dead letter
quality_check_result_id
```

Allowed only in admin/data-source/methodology contexts.

## Preview tests

```text
Search product card has:
- Open product
- Quick view
- Add to watchlist if supported

Quick view opens drawer/sheet.
Drawer has source/freshness/confidence.
Drawer has canonical product link.
Closing returns focus to trigger.
```

## Map tests

```text
Marker click opens selected detail.
Selected detail has full page link.
Mobile uses bottom sheet.
Map has list fallback.
```

## Market tests

```text
Category row has preview or direct category link.
Heatmap cell links to filtered search.
Evidence strip opens evidence drawer.
```

## Overlay tests

```text
Tooltips contain no focusable controls.
Dialogs have accessible names.
Escape closes non-destructive overlays.
Focus returns to trigger.
No nested accordions.
No modal used for ordinary product previews.
```

## Backstage tests

```text
/admin/source-runs exists.
Admin pages require admin role.
Public pages do not expose debug identifiers.
Evidence drawer links to backstage only for authorized users.
```
