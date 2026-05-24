# STATICE_ENERGY — Statistics Iceland energy/fuel

- Source: Statistics Iceland energy/fuel PX endpoint.
- Endpoint used: `https://px.hagstofa.is/pxis/api/v1/is/Efnahagur/utanrikisverslun/`
- Cadence: monthly.
- Country/vertical: IS fuel.
- Response shape: JSON-stat2 dimensions for period and product/fuel code plus a flat `value` array.
- License/citation: cite Statistics Iceland as publisher for every row.
- Pagination/rate limits: POST query; connector skips null/missing periods and never interpolates, carries forward, or estimates values.
