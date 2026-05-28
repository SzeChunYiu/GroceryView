# Production readiness checklist

This checklist is the human release gate for the current GroceryView domain-closure pack.

## Required automated gate

Run these commands from the repository root:

```bash
npm run test -w @groceryview/web
npx tsc --noEmit
node scripts/ops/release-readiness-report.mjs
```

The release is blocked if any command exits non-zero.

## Ads

- [ ] Ad labels are exactly `Advertisement`.
- [ ] Ads are blocked on admin, account, privacy, auth, and sensitive pharmacy routes.
- [ ] Search ad placement is after organic result 12 only.
- [ ] Ads are not nested inside result cards, tables, charts, or maps.
- [ ] `live_adsense_fill` remains deferred until provider credentials, ads consent, and viewport visibility are ready.

## Accessibility

- [ ] Preview drawers and bottom sheets are keyboard reachable.
- [ ] Each overlay has a Close button, Escape closes, and focus returns to trigger.
- [ ] Each overlay exposes an accessible heading/name.
- [ ] Charts/maps include `aria-label`, plain summary, table/list fallback, and non-color state cues.

## Production data

- [ ] Admin report pages show generated or live report source labels.
- [ ] Data quality, source runs, search analytics, query performance, and storage reports are available.
- [ ] Public pages avoid backstage table names and debug implementation details.
