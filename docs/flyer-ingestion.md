# Flyer ingestion architecture

## Source priority

1. **Direct per-chain flyer feeds are primary.** Prefer each retailer's own flyer, offer, or promotion feed because it is the freshest, most accurate source for validity windows, store scope, listing IDs, images, and promotion mechanics.
2. **Aggregators are fallback only.** Use Reklamblad.se, Erbjudande.se, or similar aggregators when a chain feed is unavailable, blocked, incomplete, or only publishes a PDF/image that needs secondary discovery.

## Normalized promotion rows

Every flyer item must land as a promotion row with:

- `kind = 'flyer'`
- `week_of` for the campaign week
- `ends_at` from the flyer validity window
- `listing_id` linkage back to the retailer listing or extracted flyer item
- scope metadata that is either store-specific or chain-wide
- source URL, image/PDF reference, retrieval timestamp, and OCR/parser confidence where available

Do not store flyer items as generic latest-price rows without promotion metadata. The promotion row is the durable record; latest-price projections can be derived from it later.

## PDF and image extraction

Flyer PDFs and JPG/PNG images should flow through the existing parser pipeline:

1. Fetch the source PDF/image and persist the raw source reference.
2. Extract item text, price text, package text, validity, and listing image coordinates.
3. Normalize prices and promotion mechanics into flyer promotion rows.
4. Route low-confidence OCR or ambiguous price mechanics to manual review before publishing user-facing rows.

Low-confidence examples include split price labels, multi-buy mechanics without a unit price, cropped product names, or validity text that cannot be tied to the page campaign.

## Cadence

Run flyer ingestion at least once per chain during the retailer's normal campaign rollover window. Monday morning is common in Sweden, but chain-specific schedules should override the default when evidence shows a different cadence.

Recommended cadence fields per chain:

- `chain_id`
- `country`
- `primary_source_url`
- `fallback_source_url`
- `rollover_day`
- `rollover_local_time`
- `expected_validity_days`
- `store_scope` (`chain-wide`, `store`, or `mixed`)

## Operational guardrails

- Prefer direct source freshness over aggregator breadth.
- Keep aggregator provenance distinct from chain-owned provenance.
- Preserve flyer source artifacts long enough to debug OCR and manual-review decisions.
- Fail closed when validity, listing identity, or price text cannot be normalized confidently.
