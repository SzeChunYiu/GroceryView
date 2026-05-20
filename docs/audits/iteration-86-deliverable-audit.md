# Iteration 86 Deliverable Audit — Retailer JSON Snapshot Parser

## Objective restatement

Continue reducing the gap between approved retailer pulls and usable GroceryView price rows. The connector runner can fetch and hash real endpoint payloads; this iteration adds a provider-neutral JSON parser for endpoints or adapters that can emit normalized product rows.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Convert pulled data into ingestible rows | `parseRetailerProductJsonSnapshot()` parses `items` arrays or root arrays of normalized retailer product JSON into `RetailerConnectorParsedProduct` rows | Implemented |
| Preserve fail-closed parser behavior | Parser throws on malformed JSON, non-array payloads, missing required fields, non-numeric prices/package sizes, and invalid booleans | Implemented |
| Work with the approved connector runner | Ingestion tests call `runRetailerConnector()` with `parseRetailerProductJsonSnapshot` as the parser and verify accepted price-observation provenance | Covered |
| Support real endpoint adapter flexibility | Parser accepts numeric strings for price/package fields and boolean strings for `memberOnly`, while runner stamps source type, URL, parser version, raw snapshot ref, and source run ID | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/ingestion` | Ingestion parser/runner tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- This parser handles a normalized JSON contract; retailer-specific API/page adapters still need to map live provider payloads into that contract.
- Production still needs approved endpoints, credentials, durable snapshot storage, scheduled worker wiring, and live smoke artifacts from a real retailer source.
