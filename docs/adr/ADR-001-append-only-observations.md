# ADR-001: Append-only price observation table

- Status: Accepted
- Date: 2026-05-24
- Scope: `price_observations`, `observations`, ingestion writers, rollups, and downstream price-history consumers

## Context

GroceryView imports public grocery, pharmacy, and fuel prices from multiple sources with different freshness, confidence, and provenance guarantees. The same product/store/chain can be seen many times with small changes in price, packaging, campaign status, source confidence, or scraping context. Analysts also need to explain why a displayed price changed, roll back bad ingestion runs, and audit stale or disputed source evidence.

Updating an old observation in place would erase that history. It would make a corrected parse indistinguishable from a new source event, hide raised-then-discounted promotion patterns, and make incident recovery depend on backups rather than normal product data.

## Decision

Price observations are immutable events. Ingestion must append a new row for each accepted source event and preserve:

- product, chain, and optional store identity;
- observed timestamp and source type;
- price, currency, unit-price, and price-type fields;
- confidence/provenance fields and raw-record linkage;
- promotion/member context when present.

Readers that need the current price must query a derived/latest view or rollup such as `latest_prices`, not mutate the historical event. Corrections are represented by appending a superseding observation or by excluding a bad source run from the rollup; they are not represented by `UPDATE price_observations SET price = ...`.

## Rationale

### Auditability

Append-only rows let operators answer:

- what did we believe at a specific time;
- which connector, raw record, and source URL produced the value;
- when a price first appeared, disappeared, or changed;
- whether a promotion claim was backed by prior observed shelf prices.

This supports user-facing confidence labels, compliance review, and reproducible debugging.

### Rollback and incident recovery

If a connector emits bad prices, operators can quarantine the `source_run_id`, rebuild current-price rollups, and keep the bad rows as evidence. With in-place updates, rollback would require point-in-time database restore or log reconstruction.

### Time-series features

Deal Score, price-change events, 30/90/365-day lows, seasonal views, and stale-observation gates all depend on a real observation tape. Updating rows would collapse that tape and overstate confidence.

## Trade-offs

| Trade-off | Cost | Mitigation |
| --- | --- | --- |
| Storage growth | Every run can add rows even for unchanged prices. | Partition by observation date/domain, compress cold partitions, and tier old data to Parquet. |
| More complex reads | Current-price surfaces cannot simply read one mutable row. | Maintain `latest_prices`/snapshot exports and indexes on product/store/date. |
| Duplicate-looking events | The same source value may appear in consecutive runs. | Keep run/provenance keys and deduplicate only in presentation or rollups. |
| Deletion requests | Private user-linked observations may require removal/anonymization. | Separate public price evidence from account data; apply GDPR deletion to user-owned linkage while preserving public aggregate evidence where lawful. |

## Consequences

- Ingestion code must treat observation writes as inserts tied to source-run provenance.
- Schema changes should add columns or new event tables rather than rewrite historical meaning in place.
- Rollups may be rebuilt idempotently from the append-only tape.
- Public UI must label stale, low-confidence, or aggregate rows instead of silently replacing them.
- Operational runbooks must prefer quarantine/recompute over manual row edits.

## Non-goals

- This ADR does not require keeping raw HTML/API payloads forever; raw records can have their own retention policy.
- This ADR does not prevent derived tables from being updated or replaced.
- This ADR does not define the exact cold-storage file layout; ADR-005 covers hot Postgres plus cold Parquet tiering.

## Implementation notes

- `db/schema.sql` defines `price_observations` with product/chain/store references, price fields, `observed_at`, source metadata, and indexes for product/store/domain time queries.
- Later ingestion paths also use `observations` / `observations_v2` for normalized source rows; the same append-only rule applies.
- Current website exports should read latest-price snapshots built from observations and include enough provenance for the UI to explain freshness and confidence.
