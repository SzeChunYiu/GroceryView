# Iteration 92 Deliverable Audit — Open Prices Real-Data Pull

## Objective restatement

Continue closing the "make sure you can pull real data" gap without weakening retailer/legal gates. This iteration adds a public Open Food Facts Open Prices pull path that can fetch real SEK grocery price rows, normalize usable rows into GroceryView ingestion records, and prove a live API response with content-addressed provenance.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Pull real price data from a public source | `infra/scripts/smoke-open-prices.sh` calls Open Prices `/api/v1/prices` with `currency=SEK`, `location__osm_address_country_code=SE`, and bounded `size` | Implemented |
| Respect source access conditions | The smoke requires `OPEN_PRICES_USER_AGENT` and prints attribution/rate-limit/license reminder for Open Prices by Open Food Facts | Implemented |
| Normalize real rows into GroceryView ingestion records | `parseOpenPricesSnapshot()` maps Open Prices product, location, date, price, discount, quantity, and brand fields into `RetailerConnectorParsedProduct` rows | Implemented |
| Preserve provenance for follow-up storage | The smoke reports source URL, status, content type, byte count, retrieved timestamp, SHA-256 content hash, and raw snapshot reference | Implemented |
| Fail closed on unusable real data | `parseOpenPricesSnapshot()` throws when no usable SEK product-price rows are present; ops script exits nonzero unless at least one row is accepted | Implemented |
| Document operator command | `infra/README.md` documents build/run commands and override variables for Open Prices real-data smoke | Implemented |
| Prove live pull in this iteration | `OPEN_PRICES_USER_AGENT='GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' rtk infra/scripts/smoke-open-prices.sh` returned status `passed`, status code `200`, 29,850 bytes, SHA-256 `f682cada46f30b147461ffc482db6783f0fb881328fbef6fdb563a28b7b0844b`, and 6 accepted rows | Verified locally |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ingestion` | Open Prices URL/parser and ingestion tests pass |
| `rtk npm run test --workspace @groceryview/ops` | Smoke script and docs tests pass |
| `rtk npm run build --workspace @groceryview/ingestion && OPEN_PRICES_USER_AGENT='GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' rtk infra/scripts/smoke-open-prices.sh` | Build succeeds and live Open Prices smoke returns accepted rows |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- Open Prices gives real public price pulls and normalizable grocery rows, but it is crowdsourced and not a replacement for approved retailer-specific Stockholm connectors.
- Durable persistence of the pulled rows, scheduled production ingestion, and same-product Stockholm/local distribution computed from fresh provider data still need hosted database and worker proof.
