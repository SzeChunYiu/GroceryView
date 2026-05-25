# 10-11 (Iceland) pricing quirks

Source checked: <https://www.10-11.is/> on 2026-05-25.

The official 10-11 site page checked for this study lists three store locations:
Laugavegur, Skólavörðustígur 42, and Austurstræti. It also lists store opening
hours and the contact email `10-11@10-11.is`.

## Pricing-quirk findings

| Requirement | Source-backed finding | Connector action |
| --- | --- | --- |
| 1. Online vs in-store prices | The checked official source does not publish an online product catalogue, online checkout prices, or physical-store product prices. | Emit no `channel:'online'` or `channel:'store'` price rows. |
| 2. Loyalty program | No loyalty-program name, requirements, member discount, or member-only price was found on the checked official source. | Emit no `is_member_price:true` rows. |
| 3. Format / sub-brand | The checked official source lists three 10-11 locations but no price-level format or sub-brand. | Do not add a `format` price field. |
| 4. Region / store-cluster | The checked official source lists the three locations above; it does not publish regional product-price differences. | No regional price rows or region-price fields are emitted. |
| 5. Subscription / membership-required pricing | No subscription or membership-required pricing terms were found on the checked official source. | Emit no `is_subscription_price:true` rows. |
| 6. App-only / coupon-required prices | No app-only or coupon-required price examples were found on the checked official source. | Emit no `is_coupon_price:true` rows. |
| 7. Time-of-day / close-to-close clearance | No daily clearance or time-of-day product-price rule was found on the checked official source. | Emit no `is_clearance:true` rows. |
| 8. Bulk / volume pricing tiers | No multi-buy or volume-tier product-price example was found on the checked official source. | Emit no `multi_buy` promotion rows. |
| 9. Service-counter vs packaged | No counter-vs-packaged product-price example was found on the checked official source. | Emit no `channel:'counter'` or `channel:'packaged'` rows. |
| 10. B2B / wholesale split | No restaurant/cafe/wholesale pricing terms were found on the checked official source. | No B2B price rows are in scope. |

## Codification rule

Because the listed primary source exposes store/location information but no
verifiable product prices or pricing programs, the 10-11 connector records the
official stores and emits an empty `priceRows` array with an empty
`codifiedPricingQuirks` array. New pricing fields must only be added after a
future primary source provides a concrete product-price example.
