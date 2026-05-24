# TLV_MEDICINES — TLV regulated medicine prices

Status: `ingestion_ready` until the first production fetch lands rows; then promote to `live`.

## Source

- Publisher: Tandvårds- och läkemedelsförmånsverket (TLV), Sweden.
- Source page: https://www.tlv.se/lakemedelsforetag/om-tlv/oppna-data.html
- Search/database page: https://www.tlv.se/beslut/sok-i-databasen.html
- Label: `regulated_reference`, not retail price.
- Country: `SE`
- Vertical: `pharmacy`
- Frequency: quarterly benchmark capture, even though TLV notes that the open data is updated more frequently.

TLV describes its price and decision database as open data containing medicines and consumables included in the Swedish high-cost protection system, including AIP/AUP prices, ATC code, product number and company. TLV states the data can be downloaded as an Excel file from tlv.se.

## Endpoint used

Initial connector endpoint: `https://www.tlv.se/lakemedelsforetag/om-tlv/oppna-data.html`

The page is used as the stable discovery endpoint. If TLV exposes a direct Excel URL in the crawl, the production scheduler should pass that file content into `parseTlvMedicinesBenchmarkObservations`; no value should be emitted from the discovery page itself.

## Response shape

The parser accepts fixture rows in JSON or delimited text while the production fetcher resolves TLV's downloadable Excel file:

```json
{
  "period": "2026-03-31",
  "atc": "N02BE01",
  "aup": "42,50",
  "unit": "SEK regulated reference"
}
```

Mapped benchmark row:

```json
{
  "source_id": "TLV_MEDICINES",
  "country": "SE",
  "vertical": "pharmacy",
  "ecoicop_code": "N02BE01",
  "period": "2026-03-31",
  "value": 42.5,
  "unit": "SEK regulated reference"
}
```

## License and citation

TLV lists the price and decision database under its open data page for reuse. Cite TLV as the publisher and retain the source URL with every ingest run.

## Pagination and rate limits

No paginated API was identified. Treat the workbook/download as a snapshot. Fetch at the benchmark cadence and do not crawl the search UI aggressively.

## Hard rule

Never fabricate a value. If the TLV download returns no row for a period, emit no `benchmark_observation` for that period; do not interpolate, carry forward or estimate.
