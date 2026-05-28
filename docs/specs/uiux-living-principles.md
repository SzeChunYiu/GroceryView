# UI/UX living principles

## Purpose

Ensure future UI changes stay **human-centered, evidence-backed, accessible, and mobile-first**. Public pages explain prices in plain language; technical infrastructure details stay on admin/ops routes.

## Principles

1. **Human-centered (以人為本)** — design for the shopper’s question, not the database schema.
2. **Plain meaning first** — headings understandable without knowing internal field names.
3. **Evidence second** — show source, freshness, confidence after the primary answer.
4. **Progressive disclosure** — preview/quick view before full-page navigation when facts are enough.
5. **No debug content on public pages** — no cursor pagination jargon, Redis/pgbouncer ops copy, or `source_run_id`.
6. **Every visible element has a purpose** — remove decorative panels that repeat nav.
7. **Every chart/table answers a question** — e.g. “Which categories moved this week?”
8. **Every card has a next action** — open product, browse category, set alert.
9. **Every page works on mobile** — touch targets, stacked layouts, bottom sheets where needed.
10. **Every interaction is accessible** — keyboard, screen reader, non-color-only signals, visible focus.

## Page spec requirement

Every new public page must have a [page spec](../templates/page-spec-template.md) defining: user question, primary job, above-the-fold content, CTAs, data contract, empty state, evidence, ads, mobile, a11y, analytics events, tests.

## Component rule

Every interactive component documents: purpose, props, visual/loading/empty/error states, accessibility behavior, analytics events.

## Copy rule

| Bad (backstage) | Good (frontstage) |
|-----------------|-------------------|
| `domain=fuel observation terminal` | Compare verified fuel prices by grade |
| `Server-side cursor pagination` | Showing 1–24 of 340 results |
| `Redis cache TTL 300s · pgbouncer fail-closed` | Prices from verified sources · updated daily |

## Preview rule

Use preview (tooltip, drawer, bottom sheet) before full route when user likely needs quick facts: search result quick view, map marker detail, deal explanation, source evidence.

## Examples

**Good:** `/market` MVP page uses `EvidenceStrip`, `NoVerifiedDataPanel`, and category links via `categorySlug` helpers.

**Good:** Search recovery offers plain-language category shortcuts with correct `/browse/[slug]` hrefs.

**Good:** Confidence and freshness badges use shared `content-style.ts` copy across locales.

## Anti-patterns

- Infrastructure marketing copy on locale home (`market-shell.tsx` Redis section on public `/en`).
- Category links built from display labels (`Dairy`) instead of slugs (`mejeri-ost-och-agg`).
- Empty charts with interpolated fake data instead of honest empty states.
- Color-only deal labels without text (`Real Deal` text required).
- Overloaded pages when a drawer preview would suffice.

## Required tests

- `content-style-guide.test.mjs` — banned phrases, confidence/freshness wiring.
- `i18n-hardcoded-guard.test.mjs` — locale entry pages.
- Route tests per page spec (content, data contract, a11y smoke).
- Content lint blocking backstage phrases (see gap registry `public-debug-copy`).
- `skip-link.test.mjs`, overlay a11y rules for modals/drawers.

## PR update checklist

- [ ] Public route behavior change → update page spec
- [ ] New component → document states + a11y
- [ ] Copy change → verify against content-style rules
- [ ] New debug/ops info → admin route only
