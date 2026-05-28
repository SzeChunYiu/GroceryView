# Data engineering principles

## Purpose

Make GroceryView a durable daily ingestion and transformation platform for **grocery**, **pharmacy OTC**, and **fuel** domains. Every user-facing price claim must trace to an immutable source run and pass quality gates before gold publish.

## Principles

1. **Raw data is immutable** — never mutate `raw_records` or payload files after capture.
2. **Every ingestion run has a `source_run` record** — status, counts, schema/code version, timestamps.
3. **Every write is idempotent** — deterministic dedupe keys; reruns do not duplicate observations.
4. **Bad rows go to dead letters** — parser failures persist as `raw_records` with `record_type=parser_failure`; never silent deletion.
5. **Gold publishes only after quality gates pass** — empty or invalid snapshots block public publish.
6. **Every metric traces to source data** — lineage from public panel → gold snapshot → observations → source run.
7. **Every source has freshness and coverage status** — surfaced on admin dashboards; summarized on public pages.
8. **Every domain has claim boundaries** — pharmacy OTC only; fuel requires station evidence; grocery requires valid product/store identity.

## Pipeline shape

```text
source connector → raw payload → source_runs → raw_records → validation → staging
→ normalization → entity matching → observations → latest_prices → gold snapshots
→ search documents → quality report → public website
```

## Bronze / silver / gold

| Tier | Tables / artifacts |
|------|---------------------|
| Bronze | `source_runs`, `raw_records`, `raw_payload_files`, `connector_http_logs` |
| Silver | `products`, `stores`, aliases, `observations`, `latest_prices`, `product_matches` |
| Gold | `market_overview_snapshot`, index dailies, `deal_scores`, `search_documents`, page snapshots |

## Source run contract (required fields)

| Field | Meaning |
|-------|---------|
| `runId`, `domain`, `sourceId`, `connectorId` | Identity |
| `status` | `running` \| `succeeded` \| `failed` \| `partial` \| `blocked` |
| `startedAt`, `finishedAt` | Timing |
| `rawRecordCount`, `acceptedRecordCount`, `rejectedRecordCount`, `duplicateRecordCount`, `deadLetterCount` | Volume |
| `schemaVersion`, `codeVersion` | Reproducibility |

## Idempotency key

```text
sha256(domain + source_id + store_id + product_id + observed_at + price + unit + currency)
```

Same source/day rerun → no duplicates. Partial run → resumable from checkpoint.

## Quality gates (critical — block publish)

- `price > 0`, valid currency, `observed_at` not in future
- Valid domain and `source_id`
- Dedupe key unique; no duplicate `latest_prices` key
- Gold snapshot non-empty

### Domain-specific

| Domain | Gate |
|--------|------|
| Pharmacy | OTC only; exact EAN for same-product comparison; no prescription claims |
| Fuel | Unit = litre; grade normalized; station-specific flag before pump-price claim |
| Grocery | Valid category/product/store; no fake branch price without branch evidence |

## Examples

**Good:** Connector run writes `source_run`, accepts 1,240 rows, rejects 3 to dead letter, refreshes `latest_prices`, publishes gold only when critical gates pass.

**Good:** Backfill command supports `domain`, `source`, `date_from`, `date_to`, `dry_run`, `write_mode: validate_only | append | reprocess`.

## Anti-patterns

- Publishing user-facing prices without a succeeded `source_run` for that source/day.
- Deleting rejected rows instead of dead-lettering them.
- Computing deal scores or indexes directly from raw payloads on request.
- Mixing pharmacy prescription rows into public OTC comparisons.
- Claiming fuel pump prices without station-level evidence.

## Required tests

- Source run contract shape validated in schema/ingestion tests.
- Idempotent rerun test: same input hash → zero new observation rows.
- Quality gate tests: negative price, future `observed_at`, duplicate latest-price key → publish blocked.
- Dead-letter persistence test for malformed connector payloads.
- Domain boundary tests for pharmacy OTC and fuel station claims.

## PR update checklist

When a PR touches ingestion or transforms, update:

- [ ] Source connector docs under `docs/connectors/` if contract changes
- [ ] Quality gate list in [data quality spec](./data-quality-observability.md) if new checks added
- [ ] [Metric dictionary](./metric-dictionary.md) if derived fields change
- [ ] Ingestion tests in `packages/ingestion/`
