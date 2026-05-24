# TLV_MEDICINES

- Source: TLV regulated medicine prices / periodens vara.
- Country: SE.
- Vertical: pharmacy.
- Cadence: quarterly benchmark ingestion, with TLV source pages updated more frequently.
- Endpoint used: `https://www.tlv.se/apotek/generiskt-utbyte/periodens-varor.html`; the connector discovers the current `Periodens varor ... .xls/.xlsx` link from that page.
- Label: `regulated_reference`, not retail price.

## Response shape

The discovery endpoint is HTML. The connector extracts the first workbook link whose anchor text starts with `Periodens varor`. Workbook parsing is intentionally separate so fixture tests can pass explicit rows into `toTlvBenchmarkObservation`.

Observation rows emitted to `benchmark_observation` use:

```json
{
  "source_id": "TLV_MEDICINES",
  "country": "SE",
  "vertical": "pharmacy",
  "ecoicop_code": "medicine-atc-or-benchmark-code",
  "period": "YYYY-MM",
  "value": 123.45,
  "unit": "SEK regulated_reference",
  "observed_at": "2026-05-24T00:00:00.000Z"
}
```

## License / citation

TLV states that its open data is freely available and that the price and decision database contains medicines in the high-cost threshold, including AIP/AUP prices, ATC code, product number, restrictions, and related decision information. Cite TLV as: Tandvårds- och läkemedelsförmånsverket (TLV), Pris- och beslutsdatabas / Periodens varor.

## Pagination and rate limits

No pagination is exposed on the discovery page. Download only the current workbook URL found there. If a period returns no rows, emit nothing for that period: never interpolate, carry forward, or estimate regulated medicine values.
