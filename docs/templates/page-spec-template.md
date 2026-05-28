# Page Spec: [Page Name]

> Copy this template to `docs/specs/pages/[route-slug].md` for each public route.

## Route

`/[route]`

## Domain

grocery | pharmacy | fuel | multi-domain

## Purpose

One sentence: why this page exists in GroceryView.

## User question

What does the user want to know?

## Primary user job

What should the user accomplish?

## Above the fold

What is visible before scrolling?

## Panels

For each panel:

1. **Panel name**
   - purpose
   - data (serving tables / metrics from [metric dictionary](../specs/metric-dictionary.md))
   - action (primary CTA)
   - evidence (source, freshness, confidence)
   - empty state (`NoVerifiedDataPanel` or equivalent)

## Data contract

Types and fields required. Link to gold snapshot or API route. **No raw observation scans.**

## Links

| Direction | Targets |
|-----------|---------|
| Up | Parent nav / breadcrumb |
| Down | Product, category, store detail |
| Sideways | Related compare, deals, map |
| Evidence | Source limitation drawer |

## Preview behavior

tooltip | disclosure | preview card | drawer | bottom sheet | full page — and when each applies.

## Ads

| | Detail |
|---|--------|
| Allowed slots | |
| Disabled slots | |
| Reason | |

## Accessibility

- Keyboard:
- Screen reader:
- Chart/table fallback:
- Mobile behavior:

## Analytics events

List `noun_verb` events per [event tracking spec](../specs/analytics-event-tracking.md).

## Examples

Good empty state, good evidence strip, good CTA copy (plain language).

## Anti-patterns

Backstage copy, label-based category URLs, missing freshness when data is stale.

## Required tests

| Test type | What it proves |
|-----------|----------------|
| Route test | 200, key headings |
| Content test | No banned debug phrases |
| Data test | Serving contract / fixture shape |
| Accessibility test | Skip link, landmarks, focus |
| Visual/interaction test | Mobile stack, preview open |

## Maturity

Current level (0–8) per [versioning process](../specs/versioning-roadmap-process.md).

## Owner / reviewer checklist

- [ ] Plain-language copy reviewed
- [ ] Metric dictionary references correct
- [ ] Gap registry updated if closing items
