# Promotion kinds

This document is the canonical contract for promotion rows. Every row has `kind`, `terms` (jsonb), `currency`, and `effective_unit_price`. Store the raw connector text alongside the normalized row so audits can trace back to flyer/API logs.

## Effective unit price rule

`effective_unit_price` is the best comparable single-unit price after the promotion is applied. If a promotion requires multiple units or a basket threshold, compute the unit price only for the minimum qualifying quantity/basket; otherwise use the promoted price. If the promotion cannot be reduced to a unit price, leave it null and keep the calculation inputs in `terms`.

| kind | `terms` jsonb | `effective_unit_price` | Connector-log examples |
| --- | --- | --- | --- |
| `member` | `{ "member_price": number, "program": "trumf" | "ica" | "coop" | string, "regular_price"?: number }` | `member_price` | Member-only prices from Norwegian Trumf/Joker flyers and Swedish ICA/Coop member tags. |
| `multi_buy` | `{ "qty": number, "price": number, "unit_eff": number }` | `unit_eff` (`price / qty`) | `2 för 35`, `3 st 99:-`, Krónan sale packs with multi-quantity text. |
| `x_for_y` | `{ "n": number, "price": number, "n_eligible_skus": number }` | `price / n` when all eligible SKUs share one unit size; otherwise null | Mixed eligible SKU deals such as `Välj 3 för 2` across a category. |
| `percent_off` | `{ "pct_off": number, "regular_price"?: number }` | `regular_price * (1 - pct_off / 100)` when `regular_price` exists | Lidl/Willys percentage tags and Krónan `discountPercent`. |
| `fixed_off` | `{ "amount_off": number, "regular_price"?: number }` | `regular_price - amount_off` when `regular_price` exists | `Spara 10 kr`, coupon-like fixed reductions in flyer text. |
| `bogo` | `{ "buy_n": number, "get_m"?: number, "nth_free"?: number }` | `regular_price * buy_n / (buy_n + get_m)` when `regular_price` exists; for `nth_free`, `regular_price * (nth_free - 1) / nth_free` | `Köp 2 få 1 gratis`, `3 för 2`, `Tag 4 betala för 3`. |
| `bundle` | `{ "sku_list": string[], "bundle_price": number }` | `bundle_price / sku_list.length` only when SKUs are same comparable unit; otherwise null | Meal bundles and paired product offers in weekly flyers. |
| `threshold` | `{ "min_spend": number, "discount": number }` | null unless allocated by basket model | `Handla för 500 få 50 kr rabatt`. |
| `loyalty_points` | `{ "point_multiplier": number, "program"?: string }` | base shelf price; keep points in terms | Trumf multiplier and other loyalty point boosters. |
| `surplus` | `{ "pct_off": number, "expires_at": string }` | `regular_price * (1 - pct_off / 100)` when `regular_price` exists | Short-dated/surplus markdowns with expiry timestamps. |
| `coupon` | `{ "code_required": boolean, "code"?: string, "discount"?: number }` | price after coupon only when the coupon value and eligible unit price are known | App coupons and checkout-code promotions. |
| `flyer` | `{ "week_of": string, "flyer_url"?: string }` | null unless the flyer row also carries a concrete price | Joker `kundeavis`, ICA reklamblad, and other weekly flyer-only rows. |

## Normalization notes

- Always preserve source currency; Sweden uses SEK, Norway NOK, Iceland ISK.
- Use integer minor units only at storage boundaries if a target table requires them; parser outputs may use decimal major units.
- For `bogo`, normalize synonym fields from parsers (`buy`, `free`) into `terms.buy_n` and `terms.get_m` before persistence.
- For member deals, keep the program/tier in `terms.program` and do not mix member and public prices in one row.
- For flyer-only rows, `terms.week_of` is ISO week start date (`YYYY-MM-DD`) when known; otherwise derive it from the flyer URL/title during ingestion.
