# GroceryView MVP release verification report

**Date:** 2026-05-29
**Verified at:** `origin/main` @ `0073efaf` ("Polish public domain copy (#3784)")
**Scope:** Multi-domain price intelligence platform — Grocery, Fuel/Gas, Pharmacy OTC.
**Method:** Read release/spec docs → ran required automated gates → independently grepped public copy and analytics constants → inspected closure-test assertions → dispositioned anomalies at source level.

---

## Overall status: **READY**

No confirmed defects. No code patch required. No PR opened. Every repo claim was verified against tests, reports, or source. The only remaining work is deployed-environment-only (Search Console, live AdSense provider, live DB monitoring), which the task explicitly defines as the finishing condition.

> **Evidence-class note:** Closure tests are `assert.match(source, /.../)` checks — they prove structure/copy/wiring exists in source, which is the sanctioned evidence for structural claims. Runtime behaviors (focus return, Escape-close, keyboard nav, mobile, route rendering) are covered by **automated proxy + the shipped manual checklists**, not by a runtime pass in this audit. See "Public pages needing manual review" and "Accessibility risks".

---

## Automated checks run

| Check | Result |
|---|---|
| `npm run test -w @groceryview/web` | **PASS** — 473 tests, 51 suites, 0 fail |
| `npx tsc --noEmit` | **PASS** — exit 0 |
| `node scripts/ops/release-readiness-report.mjs` | **PASS** — `status: ready`, 10/10 rows pass, 0 blocked |
| `node scripts/ops/seo-sitemap-audit.mjs` | **PASS** — `status: ok`, `forbiddenHits: []` |
| `node scripts/ops/seo-indexable-routes-report.mjs` | **PASS** — `missing: []`, 5 noindex routes covered |
| `node scripts/ops/seo-structured-data-report.mjs` | **PASS** — `status: ok`, all 9 helpers + uses present |
| `node scripts/ops/seo-canonical-report.mjs` | **PASS** — `status: ok` |
| Data-ops reports (quality, db-size, db-index-health, search-analytics, gold-publish-gate) | **PASS** — `status: generated`, exit 0 |
| `source-run-report.mjs`, `dead-letter-report.mjs` | **PASS w/ alert** — exit 1 by design (fixture seeds 1 failed run + 1 critical dead letter); valid JSON, `status: generated`; exit 0 with `*_ALLOW_FAILURES=1` (proven by `data-ops-production-closure.test.mjs`) |
| `npm run build -w @groceryview/web` (non-gating insurance) | **Compiles clean** — webpack + type-check succeeded, prerendered 132/528 static pages, then failed **only on `ENOSPC` (disk 99% full)**. Environment/disk issue, not a code defect. Partial `.next` (8.8 G) removed to reclaim disk (→ 9 G free). |

---

## Passed checks (claim-by-claim)

**Release gates**
- Atomic gap registry: `open 0`, `in_progress 0`, `done 10` ✓
- Domain completion matrix: all cells `yes + tested` for Grocery / Fuel / Pharmacy ✓
- `domain-closure-matrix.json`: all domains + platform `yes + tested`, `blockingItems: []` ✓
- Release readiness report: `ready` ✓ · TypeScript ✓ · Web tests ✓ · SEO reports ✓
- Manual QA docs exist and are actionable: `manual-smoke-test-plan.md`, `manual-ux-accessibility-checklist.md`, `production-readiness-checklist.md` ✓

**Domain routes (all exist as real App Router pages)**
- Grocery: `/`, `/search`, `/market`, `/market/[category]`, `/browse`, `/browse/[category]`, `/products/[slug]`, `/stores/[slug]`, `/deals`, `/map`, `/watchlist` ✓
- Fuel: `/fuel`, `/fuel/stations`, `/fuel/stations/[stationId]` ✓ (`?grade=`, `?domain=fuel`, `?station=` handled in-page)
- Pharmacy: `/pharmacy`, `/pharmacy/search`, `/pharmacy/otc`, `/pharmacy/[product]` ✓ (`?domain=pharmacy`, `?pharmacy=` handled in-page)
- The web suite's "visible route contracts" test maps every requested visible page to a real App Router page.

**Domain closure assertions (source-verified by closure tests)**
- Pharmacy: exact-EAN comparison, `pharmacy_product_clicked` / `pharmacy_ean_comparison_opened` / `pharmacy_otc_alert_set` events, safety copy "No prescription medicine / No medical advice / no prescription or medical advice", map + watchlist OTC flows ✓
- Fuel: grade/operator/station cards, `fuel_grade_selected` / `fuel_station_candidate_clicked`, "operator-level price guardrail" (no pump-price inference), grade-target + saved-station watchlist ✓
- Cross-domain: `/search?domain=all|grocery|fuel|pharmacy` with three distinct card types + source/freshness/confidence/limitation; map layers for all 3 domains + selected-detail states (store, kommun, fuel station, pharmacy); watchlist sections (Grocery products, Stores, Categories, Pharmacy OTC, Fuel, Saved views, Alerts); home cards (Compare groceries / OTC pharmacy / fuel) with evidence fields ✓

**Public copy (independent grep, all 10 forbidden terms, non-admin `app`/`components`)**
- Zero hits for `buildPriceChartSeries`, `raw_records`, `Redis cache`, `pgbouncer`, `parser version`, `Server-side cursor pagination`, `dead-letter queue`, `COPY staging`.
- Two hits, both non-defects: (a) `app/api/export/prices/route.ts` — `source_run_id`/`raw_record_id` are CSV column names in a **premium-entitlement-gated data-export API** (intentional provenance feature, not a rendered page); (b) `components/preview/evidence-drawer.tsx` — a code comment documenting that frontstage hides these. ✓

**Ads**
- `AdSlot` label literal is exactly `'Advertisement'` (`design-system/ad-slot.tsx`, `public-ad-slot.tsx`) ✓
- Release-readiness validates: ad-free on admin/account/privacy/auth/sensitive-pharmacy; search ad only after result 12; no nested ads in cards/tables/charts/maps; reserved height; `live_adsense_fill` deferred until credentials + consent + visibility ✓

**SEO**
- `robots.ts` disallows `/admin`, `/account`, `/login`, `/settings`, `/watchlist`, `/api`, `/users`, `/component-preview` ✓
- `sitemap.ts` covers indexable public + dynamic routes; canonical/noindex policy present; faceted/empty/selected-map states noindexed; structured-data helpers source-backed; `/admin/seo` exists; all SEO reports exit 0 ✓

**Data operations**
- All report helpers exist and return the shared closure shape with clear status; gold-publish gate blocks critical fixture failures (`publishAllowed: false`); idempotency helper deterministic (`buildSourceRunInputHash`, `buildObservationIdempotencyKey`, `stableValue`); admin pages use `AdminReportSourceLabel`; public pages contain no backstage table identifiers ✓

**Analytics**
- All 14 required events centralized in `GROCERYVIEW_ANALYTICS_EVENT_NAMES` (`apps/web/src/lib/analytics.ts`); docs match code (`deal_opened` and `deal_card_clicked` both present); no PII in event payload contract ✓

---

## Blockers

**None.** No release-blocking defect found.

---

## Warnings

1. **`source-run-report` / `dead-letter-report` exit 1 in default fixture mode.** This is intentional alerting (`failedRunCount > 0` / `criticalCount > 0`). It is suppressible via `GROCERYVIEW_SOURCE_RUN_REPORT_ALLOW_FAILURES=1` / `GROCERYVIEW_DEAD_LETTER_ALLOW_CRITICAL=1` and the closure test relies on that. **Action for ops/CI:** any pipeline that runs these as health checks must set the allow-flags or treat exit 1 as "data has failures," not "script broken."
2. **All data-ops reports are in `fixture` mode** (no `DATABASE_URL`). Provenance is honestly labeled (`mode: fixture`, `sourceLabel: local fixture`, `productionClaim: false`). Live status requires DB wiring in the deployed environment.
3. **Verification machine disk was at 99%** — the production build aborted on `ENOSPC` mid static-export (after compiling cleanly). Not a code issue, but the build host / CI must have headroom for the 528-page static export (`.next` reaches ~9 G). Recommend a CI disk check or `output: 'standalone'` / on-demand ISR review for the large dynamic store/product route sets.

---

## Public pages needing manual review (proxy-verified, runtime pass pending)

Source/structure verified by closure tests; **runtime rendering not exercised in this audit.** Run `docs/qa/manual-smoke-test-plan.md` against a preview deploy:
- Home domain cards open expected routes (grocery/pharmacy/fuel).
- `/search` filters/sort + ad-after-12 placement; `/search?domain=all` shows three card types.
- `/deals` preview open/close; `/market` heatmap + category trend; `/map` layer switch + selected detail + list fallback; `/watchlist` add target stays account-safe.

---

## Data freshness risks

- Public surfaces are fail-closed and evidence-labeled, but **no live source is connected** (fixture mode). Before public launch: wire `DATABASE_URL`, run a real ingestion, confirm freshness SLA banners reflect real `observed_at`, and confirm gold-publish gate passes on live data.

---

## SEO risks

- `robots.ts` / `sitemap.ts` hardcode `https://grocery-web-mu.vercel.app`. Confirm this matches the final production domain before launch (or templatize via env).
- **Search Console verification + sitemap submission** is a deployed-environment task (`/admin/seo` import scaffold exists; live verification pending).

---

## Accessibility risks

- Overlay a11y (Escape-close, focus-return-to-trigger, keyboard reach, accessible heading), chart/map aria-labels + table fallbacks + non-color signals, and mobile usability are **asserted in source and required by the manual checklist**, but **not runtime-tested here.** Execute `docs/qa/manual-ux-accessibility-checklist.md` on a preview build (ideally with a screen reader + keyboard-only pass) before sign-off.

---

## Ad risks

- Policy is correct and gated; **`live_adsense_fill` must remain deferred** until provider credentials, consent (Google consent mode), and placement/viewport QA are ready. No live fill should be enabled in this release.

---

## Exact files changed

**None.** Audit only. The sole addition is this report file (`docs/release/mvp-verification-report-2026-05-29.md`); no code, config, test, or product surface was modified.

## Exact tests added or updated

**None.** No defect required a test change. Existing coverage (473 tests / 51 suites) was sufficient and rigorous (content/boundary assertions, not shallow existence checks).

---

## Final recommendation

**Release-READY for code/content.** Ship the candidate. Gate public launch only on the deployed-environment items, in this order:
1. Point `DATABASE_URL` at production, run a real ingestion, confirm gold-publish gate + freshness banners on live data.
2. Execute both manual checklists (smoke + UX/a11y) on the preview deploy.
3. Confirm production domain in `robots.ts`/`sitemap.ts`; complete Search Console verification + sitemap submission.
4. Keep `live_adsense_fill` deferred until AdSense credentials + consent + placement QA land.

No further atomic gaps, domain-matrix changes, or release-report changes are needed: gaps remain `open 0`, matrix remains `yes + tested`, and the readiness report remains `ready`.
