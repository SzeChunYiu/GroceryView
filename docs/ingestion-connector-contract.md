# Ingestion Connector Contract

GroceryView market connectors should expose one typed connector boundary before rows enter the shared `IngestRow` normalization path.

The shared connector shape lives in `packages/ingestion/src/connectors/connector-interface.ts`:

- `fetch(context)` retrieves raw source evidence with connector headers, source URLs, and abort support.
- `parse(raw, context)` extracts source-shaped records without dropping lineage.
- `normalize(parsed, context)` emits `ConnectorNormalizedRow` records with required fields, units, freshness, error context, and lineage.
- `persist(rows, context)` is optional and writes normalized rows through the shared repository/source-run path.

Every connector should call `assertConnectorConformance` from its fixture tests before it persists rows. The conformance gate verifies:

- required identity fields: `id`, `chainId`, `productName`, `categoryId`;
- market fields: Sweden `SE/SEK`, Norway `NO/NOK`, or Iceland `IS/ISK`;
- unit contracts: `each`, `kg`, `g`, `l`, `ml`, or `metadata`;
- freshness: parseable `retrievedAt` and optional max-age budget;
- lineage: `sourceUrl`, `parserVersion`, `rawSnapshotRef`, and matching row lineage;
- errors: fetch/parse/normalize/persist failures keep stage, message, source URL, and retryability evidence.

## Market Plug-In Pattern

Sweden connectors such as Willys, ICA, Coop, Hemköp, Lidl, and City Gross should keep their current source-specific fetchers, then add a thin adapter that maps parser output into `ConnectorNormalizedRow` before calling `planIngestionBatch`.

Norway connectors such as Best, Rema 1000, Meny, Joker, and specialty retailers should use `countryCode: 'NO'`, `currency: 'NOK'`, and `unit: 'metadata'` for source-backed non-price metadata rows where no public price is present.

Iceland connectors such as Bónus, Krónan, Nettó-style flyers, and fuel sources should use `countryCode: 'IS'`, `currency: 'ISK'`, source URLs from the public page/API, and a raw snapshot reference that points to the captured HTML, JSON, or flyer artifact.

New connectors should add one fixture conformance case covering successful normalized rows and one failure sample covering blocked, stale, malformed, or missing-source evidence.
