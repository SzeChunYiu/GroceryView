# Eurostat HICP

## What it measures

Harmonised Index of Consumer Prices datasets by geography and ECOICOP category for cross-country consumer-index comparison.

## What it does not measure

It does not measure GroceryView product, chain, store, or shelf prices.

## Sample API call

```sh
curl 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx?geo=SE&coicop=CP01'
```

## License / terms

Use under Eurostat reuse terms; preserve source attribution and dataset metadata.

## Refresh cadence

Monthly for HICP datasets; registry stays metadata-only until a connector verifies pulls.
