# GroceryView public API

## Price history

`GET /api/v1/products/{id}/history?limit=250`

Returns JSON price-history observations for a product id for researcher and journalist reuse. The endpoint is rate limited to 60 requests per minute per forwarded client IP and caps `limit` at 1000 rows.

Responses include `productId`, `count`, `limit`, `license`, and `observations`. Code examples are Apache-2.0 licensed; exported observation data is CC-BY-4.0 with attribution to GroceryView verified price history.

The endpoint fails closed with `503 history_database_unconfigured` when `DATABASE_URL` is absent rather than returning fabricated rows.
