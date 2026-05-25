# ADR-001: Append-only Price Observations

- **Status:** Accepted
- **Date:** 2026-05-25
- **Owners:** GroceryView data/ingestion maintainers
- **Scope:** `price_observations`, ingestion corrections, audit trails, and price-history rollback

## Context

GroceryView ingests grocery, pharmacy, fuel, and receipt-backed price evidence from many sources with different freshness, confidence, and provenance guarantees. A single product/store price can be observed repeatedly as connectors rerun, retailer pages change, human review fixes a parse, or a source is later found to be wrong.

If the platform updates an old observation row in place, it loses the evidence needed to answer basic operational questions:

- what did the connector observe at that time;
- which source run, parser version, or reviewer produced the row;
- which public snapshot or index calculation consumed the old value; and
- how to roll back a bad run without inventing replacement history.

## Decision

`price_observations` is append-only. Ingestion, review, and repair workflows must insert a new observation or correction record instead of updating historical observation facts in place.

Allowed mutable state lives outside the observation fact table:

- current rollups such as `latest_prices` may be recomputed from accepted observations;
- source-run status, review state, and suppression metadata may change as workflow state; and
- derived public snapshots may be regenerated after bad observations are excluded or superseded.

Historical observation rows keep their original price, currency, unit, source URL/run id, observed timestamp, parser/reviewer provenance, and confidence fields. Corrections link forward to the superseding evidence rather than rewriting the original row.

## Rationale

### Auditability

An append-only trail lets operators prove which source produced a price claim and when it entered GroceryView. This is required for freshness badges, confidence disclosures, connector QA, and user-facing explanations that distinguish observed prices from inferred or unavailable prices.

### Rollback and incident response

When a connector ships a bad parser, rollback should be a filter or recomputation problem, not a forensic reconstruction problem. Keeping the original rows means operators can mark a run, source, or parser version as excluded and rebuild `latest_prices`, category indices, alerts, and static snapshots from the remaining accepted evidence.

### Reproducible analytics

Price-history charts, inflation/index calculations, and promotion studies need stable inputs. Append-only observations make old reports reproducible because the raw facts they read do not silently change after publication.

## Trade-offs

- **Storage growth:** every re-observation and correction adds rows, so raw history grows faster than a mutable current-price table.
- **Query complexity:** current-price queries must read rollups or filter by accepted/superseded state instead of assuming one mutable row per product/store.
- **Correction workflow discipline:** tooling must make superseding and excluding evidence easy so operators do not reach for direct SQL updates during incidents.
- **Backfill volume:** historical connector improvements may create many replacement rows rather than patching old ones.

These costs are accepted because auditability and rollback safety are more important than minimizing row count in the source-of-truth evidence table.

## Mitigations

- Maintain indexed current rollups (`latest_prices` and product/store summaries) for user-facing reads that need low latency.
- Store source-run ids, parser versions, observed timestamps, country, currency, and confidence fields so bulk exclusion and recomputation can target the bad slice precisely.
- Use the hot/cold storage policy from ADR-005: keep the operational window in Postgres, then move verified old observations to immutable Parquet partitions with manifests.
- Partition and compact cold files by country, domain, and observation date so long-horizon analytics do not overload the hot database.
- Add runbooks for connector rollback, superseding observations, and regenerating derived snapshots after an exclusion.

## Consequences

- Product and index surfaces can show provenance and freshness without hiding overwritten history.
- Bad data can be excluded and derived tables rebuilt while preserving the original evidence for review.
- Database storage planning must include observation growth, partitioning, and verified cold-tier export.
- Direct `UPDATE` statements against observation facts are considered data-corruption risk unless a documented emergency repair is approved and logged.

## Guardrails

- Never update an observation row to change price, currency, unit, source, observed time, or provenance.
- Never mix correction workflow state with the immutable observed fact; link to superseding evidence instead.
- Never prune hot observations until a verified cold-tier manifest covers them and no incident/review hold applies.
- Derived tables may be mutable, but they must be rebuildable from the accepted append-only observation set.
