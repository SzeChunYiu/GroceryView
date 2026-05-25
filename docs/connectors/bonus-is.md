# Bónus IS connector health check

`npm run ops:check-bonus-is-connector` builds `@groceryview/ingestion`, fetches a small Bónus IS WooCommerce sample, and prints a JSON health record.

The record includes `rowCount`, per-field non-empty counts for `name`, `price`, `productUrl`, and `imageUrl`, plus an `error` string when the HTTP fetch fails. The command exits non-zero if no rows are returned, required fields are missing, or the fetch fails.

Use `-- --maxRows 10` to raise the default five-row sample while keeping the check bounded for ops runs.
