# GroceryView metric dictionary

Version: 2026-05-28. Owner team defaults: **data_engineering** (pipeline/serving), **analytics** (product/UX metrics), **product** (claim copy).

Each metric uses the semantic shape from handoff 70. Public claim boundaries prevent overstating coverage or deal quality.

---

## unit_price_sek

| Field | Value |
|-------|-------|
| **Definition** | Comparable price per normalized unit (SEK/kg, SEK/litre, SEK/item) for a product at a store or chain scope. |
| **Formula** | `unit_price_sek = price_sek / normalized_quantity` where `normalized_quantity` comes from package parsing (`unit`, `quantity`, `domain`). |
| **Source tables** | `observations.unit_price`, `latest_prices.unit_price`, `products` (package metadata) |
| **Owner** | data_engineering |
| **Grain** | product × store × domain × day |
| **Claim boundary** | Requires valid unit parsing; do not compare across incompatible units (e.g. per-item vs per-kg without conversion). |

---

## current_best_price_sek

| Field | Value |
|-------|-------|
| **Definition** | Lowest source-backed current shelf/online/member/promotion price for a product within filters (domain, region, price types). |
| **Formula** | `min(price)` over `latest_prices` where `price > 0`, `confidence >= threshold`, and price_type in allowed set. |
| **Source tables** | `latest_prices`, `stores`, `chains` |
| **Owner** | data_engineering |
| **Grain** | product × domain |
| **Claim boundary** | Not “cheapest everywhere”; only verified sources in scope. |

---

## deal_score

| Field | Value |
|-------|-------|
| **Definition** | Composite 0–100 score for how strong a current offer is vs historic and peer prices, weighted by freshness and confidence. |
| **Formula** | Weighted blend of historic discount depth, `price_spread_pct`, `observation_confidence`, observation count, and availability; mapped to labels **Real Deal** / **Fair Discount** / **Not Really a Deal**. |
| **Source tables** | `deal_scores`, `latest_prices`, `observations`, `products` |
| **Owner** | analytics |
| **Grain** | product × domain × day |
| **Claim boundary** | Label is evidence-based, not a guarantee of future price. |

---

## observation_confidence

| Field | Value |
|-------|-------|
| **Definition** | Evidence-weighted score (0–1) for a price observation or aggregated product price, from freshness, source reliability, match quality, and row count. |
| **Formula** | `clamp01(w_fresh * freshness_factor + w_src * source_reliability + w_match * match_quality + w_n * min(1, observation_count / n_target))` stored on rows as `confidence`. |
| **Source tables** | `observations.confidence`, `latest_prices.confidence`, `source_runs` |
| **Owner** | data_engineering |
| **Grain** | observation or product × store |
| **Claim boundary** | Low confidence must surface caveats on frontstage (handoff 76). |

---

## price_spread_pct

| Field | Value |
|-------|-------|
| **Definition** | Percent gap between highest and lowest comparable source-backed prices for the same product (or exact pharmacy EAN). |
| **Formula** | `100 * (max(price) - min(price)) / min(price)` over comparable `latest_prices` rows. |
| **Source tables** | `latest_prices`, `products`, `pharmacy_eans` (pharmacy domain) |
| **Owner** | analytics |
| **Grain** | product × domain |
| **Claim boundary** | Exact same product/EAN only; no cross-brand substitution. |

---

## basket_savings_sek

| Field | Value |
|-------|-------|
| **Definition** | Estimated SEK saved for a basket or list vs a reference basket (e.g. highest observed shelf price per line or user baseline store). |
| **Formula** | `sum(max(0, reference_unit_price_sek - chosen_unit_price_sek) * quantity)` per line item. |
| **Source tables** | `latest_prices`, list/basket runtime state, `products` |
| **Owner** | product |
| **Grain** | basket × user session or saved list |
| **Claim boundary** | Estimate only; missing lines reduce completeness; show coverage of priced lines. |

---

## chain_price_index

| Field | Value |
|-------|-------|
| **Definition** | Chain-level price index (base 100) from verified observations vs a fixed basket or category mix. |
| **Formula** | `100 * (chain_basket_cost / baseline_basket_cost)` using `chain_index_daily` or live rollups from `latest_prices`. |
| **Source tables** | `chain_index_daily`, `latest_prices`, `chains` |
| **Owner** | analytics |
| **Grain** | chain × domain × day |
| **Claim boundary** | Requires sufficient comparable observations; index movement ≠ individual product price. |

---

## weekly_change_pct

| Field | Value |
|-------|-------|
| **Definition** | Week-over-week percent change in indexed or best price for a product, category, or chain scope. |
| **Formula** | `100 * (price_now - price_week_ago) / price_week_ago` from rolling windows on `observations` or snapshot tables. |
| **Source tables** | `observations`, `category_index_daily`, `chain_index_daily` |
| **Owner** | analytics |
| **Grain** | entity × domain × week |
| **Claim boundary** | Sparse history yields null or low-confidence; do not imply precision beyond observation density. |

---

## freshness_rate

| Field | Value |
|-------|-------|
| **Definition** | Share of rows (or universe keys) with `observed_at` within the freshness SLA for domain/source/category. |
| **Formula** | `count(rows where now - observed_at <= sla_hours) / count(rows in scope)`. |
| **Source tables** | `latest_prices`, `source_runs`, `daily_freshness_report` (ops JSON) |
| **Owner** | data_engineering |
| **Grain** | domain × source × day |
| **Claim boundary** | SLA is per-source configured; stale sources publish with warnings only. |

---

## coverage_rate

| Field | Value |
|-------|-------|
| **Definition** | Share of target product/store/category universe with at least one source-backed price in scope. |
| **Formula** | `count(distinct product_id with latest_price) / count(distinct product_id in target_universe)`. |
| **Source tables** | `products`, `latest_prices`, `stores`, catalog coverage reports |
| **Owner** | data_engineering |
| **Grain** | domain × category × region × day |
| **Claim boundary** | Target universe definition must match documented catalog coverage targets. |

---

## search_zero_result_rate

| Field | Value |
|-------|-------|
| **Definition** | Fraction of search sessions that return zero product result cards. |
| **Formula** | `count(search_submitted where result_count = 0) / count(search_submitted)`. |
| **Source tables** | `search_events` (when persisted), aggregate analytics runtime buckets |
| **Owner** | analytics |
| **Grain** | domain × day |
| **Claim boundary** | Aggregate only; no storage of raw query strings in analytics tables. |

---

## search_to_product_click_rate

| Field | Value |
|-------|-------|
| **Definition** | Share of non-empty search sessions that include a product detail open (`product_opened` or funnel `product_view`). |
| **Formula** | `count(sessions with product_opened after search_submitted) / count(search_submitted where result_count > 0)`. |
| **Source tables** | `search_events`, funnel aggregates (`packages/analytics/src/funnel.ts`) |
| **Owner** | analytics |
| **Grain** | domain × day |
| **Claim boundary** | Session linkage uses anonymous `sessionId`; not user-identified without consent. |

---

## watchlist_alert_trigger_rate

| Field | Value |
|-------|-------|
| **Definition** | Triggered target-price or deal-score alerts divided by active alert rules in period. |
| **Formula** | `count(alert_fired) / count(active watchlist_items or alert rules)`. |
| **Source tables** | `watchlist_items`, `watchlist_events`, notification delivery logs |
| **Owner** | product |
| **Grain** | user × day (backstage); aggregate for dashboards |
| **Claim boundary** | Alerts depend on `latest_prices` freshness; misfires during stale data must be excluded from SLA numerators. |

---

## source_success_rate

| Field | Value |
|-------|-------|
| **Definition** | Share of `source_runs` that end in `succeeded` or acceptable `partial` vs failed/blocked. |
| **Formula** | `count(source_runs where status in ('succeeded','partial')) / count(source_runs)`. |
| **Source tables** | `source_runs`, `source_run_events` |
| **Owner** | data_engineering |
| **Grain** | source × domain × day |
| **Claim boundary** | `partial` runs may omit gold publish; success ≠ full catalog coverage. |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-28 | Initial dictionary (Agent 5): 14 metrics with formulas and owners. |
