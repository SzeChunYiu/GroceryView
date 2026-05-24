# ADR-003: Separate promotion table

## Status

Accepted

## Context

GroceryView ingests observations from retailer feeds, receipts, and connector snapshots. An observation records what a source said about a product at a point in time: chain, store, product identity, shelf price, unit price evidence, availability, source metadata, and the timestamp of the observation.

Promotions have a different lifecycle. A promotion may start before the first observation that captures it, end after the last crawl that sees it, apply only to a membership tier, or describe a bundle whose effective unit price depends on quantity rules. Treating these facts as ordinary observation columns makes historical rows ambiguous and encourages consumers to infer offer windows from crawl timing rather than from source-backed promotion metadata.

## Decision

Store promotions in a dedicated promotion table instead of embedding promotion state directly in observations.

A promotion row represents the source-backed offer contract:

- product or canonical product reference
- chain and optional store scope
- promotion type, such as percent-off, fixed-price, multi-buy, member-only, coupon, or clearance
- advertised price and quantity terms
- `starts_at` and `ends_at` lifecycle bounds when the source provides them
- provenance fields that identify the source run or connector evidence

Observation rows remain point-in-time facts about what was seen. They may reference a promotion when the observation is evidence for that promotion, but the promotion lifecycle is owned by the promotion table.

`effective_unit_price` is derived from the promotion terms, product unit metadata, and observation context. It is not stored as an independent promotion column. Consumers compute or materialize it at read/export time so the value stays consistent when unit normalization, pack-size parsing, or promotion-term interpretation improves.

## Consequences

### Why promotions live separately from observations

- Promotion validity is interval-based (`starts_at`/`ends_at`), while observations are event-based (`observed_at`). Keeping them separate prevents a crawler gap from truncating a valid offer or extending an expired one.
- Multiple observations can support the same promotion without duplicating its terms on every crawl row.
- One observation can expose several offer facts, such as shelf price plus member-only promotion, without overloading a single observation schema.
- Promotion-specific review states, source terms, and de-duplication can evolve without rewriting historical price observations.

### Why `effective_unit_price` is derived

- Effective unit price depends on normalized package size, bundle quantity, membership rules, deposit handling, and local unit conventions.
- Storing it as a promotion column would create stale data whenever parsers or normalization rules change.
- Deriving it gives all consumers the same calculation path and makes changes auditable through code and tests.
- Materialized exports may include the derived value for performance, but the promotion table should not treat that value as source truth.

### Promotion lifecycle

- `starts_at` is the earliest source-backed instant when the promotion is valid. If absent, consumers may use the first supporting observation as a lower-confidence display hint, not as a contractual start.
- `ends_at` is the source-backed expiry instant. If absent, consumers should apply freshness and review policies rather than assuming the offer is open-ended.
- Promotions can be superseded by newer source-backed terms for the same product and scope. Supersession should create or update promotion lifecycle records, not mutate historical observations.
- Expired promotions remain queryable for history, audits, and price-drop explanations.

## Alternatives considered

### Store promotion fields directly on observations

This is simpler for ingestion but duplicates terms across crawls, makes offer intervals hard to model, and forces consumers to infer validity from observation timestamps.

### Store `effective_unit_price` as a promotion source field

This speeds reads but mixes derived calculations with source evidence. It also requires backfills whenever unit parsing improves.

### Infer promotions only at query time

This avoids a new table but loses explicit lifecycle and provenance, makes de-duplication inconsistent across consumers, and repeats promotion parsing in every read path.

## Implementation notes

- Prefer stable promotion identifiers based on source, product scope, offer type, terms, and lifecycle bounds.
- Keep raw source text or connector evidence available for review and audit.
- Ensure exports and UI read models can include derived `effective_unit_price` without making it authoritative storage.
- Tests should cover started, scheduled, expired, open-ended, and superseded promotions.
