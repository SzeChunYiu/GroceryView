# Promotion kinds

This document defines the promotion `kind` values GroceryView normalizes from connector logs, the expected `terms` jsonb shape, and the `effective_unit_price` calculation used for comparison.

All money values are stored in the offer currency minor/decimal format already emitted by the connector. `effective_unit_price` is always the best comparable price for one eligible sellable unit after applying the promotion terms; if the promotion cannot be reduced to one unit, use the promoted bundle/threshold price and mark the caveat in `terms.notes`.

## Common fields

Every promotion row should include:

```json
{
  "kind": "member",
  "terms": {},
  "regular_price": 42.9,
  "promotional_price": 35.9,
  "effective_unit_price": 35.9,
  "currency": "SEK",
  "source": "connector-name",
  "valid_from": "2026-05-18",
  "valid_to": "2026-05-24"
}
```

`terms` should keep connector-specific evidence fields when useful, but the required keys below must remain stable.

## Kinds

| kind | Required `terms` jsonb | `effective_unit_price` calculation | Real connector-log example |
|---|---|---|---|
| `member` | `{ "member_program": string, "member_price": number, "regular_price": number? }` | `member_price` per sellable unit. If a unit-size denominator exists, divide by package quantity for comparable unit price. | ICA/Willys member-only weekly price, e.g. `member_program="Stammis"` or `member_program="Willys Plus"`. |
| `multi_buy` | `{ "qty": number, "price": number, "unit_eff": number }` | `unit_eff` if provided; otherwise `price / qty`. | Willys/Hemköp `2 för 35 kr`; Coop `3 för 2` normalized when total promo price is explicit. |
| `x_for_y` | `{ "n": number, "price": number, "n_eligible_skus": number }` | `price / n`. Use `n_eligible_skus` to show breadth of the mix-and-match pool, not to divide price. | Matpriskollen mix-and-match campaign where several yoghurt SKUs share `3 för 45`. |
| `percent_off` | `{ "pct_off": number, "base_price": number }` | `base_price * (1 - pct_off / 100)`. Round to the connector currency precision after calculation. | Lidl/City Gross `25% rabatt` category or shelf promotion. |
| `fixed_off` | `{ "amount_off": number, "base_price": number }` | `max(base_price - amount_off, 0)`. | Fuel and grocery coupons such as `5 kr rabatt` on a specific SKU. |
| `bogo` | `{ "buy_n": number, "get_m": number, "nth_free": boolean, "unit_price": number }` | `(buy_n * unit_price) / (buy_n + get_m)` when the free items are the same unit. If `nth_free=true`, use the same formula with `get_m=1`. | Pharmacy/grocery `köp 2 få 1` or `3:e gratis` campaigns. |
| `bundle` | `{ "sku_list": string[], "bundle_price": number }` | `bundle_price / sku_list.length` only when all SKUs are comparable units; otherwise store `bundle_price` and add `terms.notes="not unit-comparable"`. | Meal-kit or dinner bundle connector rows, e.g. taco-kit ingredient bundle. |
| `threshold` | `{ "min_spend": number, "discount": number, "scope": "basket" | "category" | "sku" }` | SKU/category scope: allocate `discount` across eligible units when the basket composition is known. Basket scope: `effective_unit_price` remains the observed item price and `terms.threshold_savings_unallocated=true`. | Online grocery basket campaign `100 kr rabatt vid köp över 800 kr`. |
| `loyalty_points` | `{ "point_multiplier": number, "point_program": string, "cash_value_per_point": number? }` | If `cash_value_per_point` is known, subtract `point_multiplier * base_points * cash_value_per_point`; otherwise leave price unchanged and expose points as non-cash value. | Trumf/Joker GLAD or ICA Stammis extra-points campaign. |
| `surplus` | `{ "pct_off": number, "expires_at": string, "base_price": number }` | `base_price * (1 - pct_off / 100)`. `expires_at` is required because short-dated stock should not be mixed with normal flyer price history. | Matsmart/short-date rows or store surplus shelf markdowns. |
| `coupon` | `{ "code_required": boolean, "coupon_code": string?, "discount": number?, "pct_off": number? }` | Apply `discount` or `pct_off` only when `code_required` is false or the connector has captured the public code in `coupon_code`; otherwise retain base price with `terms.requires_manual_code=true`. | Online grocery voucher such as `code_required=true` for checkout-only campaign. |
| `flyer` | `{ "week_of": string, "flyer_id": string?, "page": number?, "valid_from": string?, "valid_to": string? }` | Use the flyer item price as the effective unit price, then divide by package/comparable unit where present. | Weekly flyer rows from Willys/Lidl/City Gross and Nordic direct flyer connectors. |

## Calculation examples

```json
{
  "kind": "multi_buy",
  "terms": { "qty": 2, "price": 35, "unit_eff": 17.5 },
  "regular_price": 21.9,
  "promotional_price": 35,
  "effective_unit_price": 17.5
}
```

```json
{
  "kind": "bogo",
  "terms": { "buy_n": 2, "get_m": 1, "nth_free": true, "unit_price": 29.9 },
  "regular_price": 29.9,
  "promotional_price": 59.8,
  "effective_unit_price": 19.93
}
```

```json
{
  "kind": "flyer",
  "terms": { "week_of": "2026-05-18", "flyer_id": "willys-2026-w21", "page": 3 },
  "regular_price": 39.9,
  "promotional_price": 29.9,
  "effective_unit_price": 29.9
}
```

## Connector logging requirements

1. Preserve the raw promotion text in `terms.raw_text` when available.
2. Preserve chain-specific loyalty names in `terms.member_program` or `terms.point_program`.
3. Keep validity evidence (`week_of`, `valid_from`, `valid_to`, `expires_at`) so short-lived flyer, coupon and surplus rows do not pollute regular price history.
4. Do not infer a discount from a crossed-out price unless the connector observed both regular and promoted prices in the same crawl.
5. If the promotion spans multiple SKUs, store every participating SKU in `sku_list` or count them in `n_eligible_skus` so downstream ranking can explain the mix-and-match scope.
