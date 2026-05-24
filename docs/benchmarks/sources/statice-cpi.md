# STATICE_CPI — Statistics Iceland CPI

- Source: Statistics Iceland CPI / HICP PX endpoint.
- Endpoint used: `https://px.hagstofa.is/pxis/api/v1/is/Efnahagur/visitolur/1_neysluverdsvisitala/1_neysluverdsvisitala/`
- Cadence: monthly.
- Country: IS.
- Response shape: JSON-stat2 dimensions for period and ECOICOP/CPI code plus a flat `value` array.
- License/citation: cite Statistics Iceland as the publisher for every emitted observation.
- Pagination/rate limits: PX endpoint is queried by POST; connector emits only numeric values returned by the source and skips null/missing periods without interpolation.
