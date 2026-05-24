# Chain-study comparison matrix

This table is the operator-facing rollup for `docs/chain-studies/*.md`. Use `yes` only when a chain study documents a primary-source example and the connector codifies it; use `no` when the study explicitly rules it out; use `pending` when the individual study has not landed on `main` yet.

| chain | study file | has_online? | has_loyalty? | has_format_variance? | has_region_pricing? | has_subscription? | has_app_coupons? | has_counter_pricing? | model gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _No chain-study files on `main` yet_ | — | pending | pending | pending | pending | pending | pending | pending | Add one row per `docs/chain-studies/*.md` as studies land. |

## Update rule

For each chain study, copy only claims that the individual file verifies from its listed primary sources. If a study says a quirk is unverified or skipped, mark the cell `no` and keep the connector gap out of scope until a primary source exists.
