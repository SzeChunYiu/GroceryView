# Tanka SE pricing quirks

Primary sources checked: Tanka homepage (`https://tanka.se/`), fuel page (`https://www.tanka.se/drivmedel`), station finder (`https://www.tanka.se/bensinstationer`).

## Source-backed findings

- Tanka is a fuel-station chain, not a grocery retailer. The source pages describe petrol, diesel, HVO100, E85, gas, AdBlue, electricity/charging, and car wash services; no supermarket goods or service-counter categories are published.
- Tanka states that it no longer publishes recommended fuel prices on the website and that the current price is on the price sign at the local Tanka station. Connector rows therefore must be store-scoped and must not fabricate a national web price.
- Tanka states that customers get bonus and discount when paying for fuel with CarPay at Tanka stations. Connector rows may mark CarPay rows as `is_member_price:true`, but the source does not publish a discount percent for fuel.
- The station finder exposes product availability filters for Bensin 95, Bensin 98, Diesel, E85, El, Gas, AdBlue, and Neste MY Förnybar Diesel (HVO100). The connector can use those categories as source-backed fuel product categories.
- The fuel page says normal pump choice remains 95, 98, or Diesel after Tanka's fuel additive change; it also documents HVO100 availability at some stations.

## Required quirk checklist

1. **Online vs in-store:** No online fuel ordering price is published. The source explicitly points shoppers to the local station price sign for current prices, so only `channel:'store'` fuel rows are justified.
2. **Loyalty program:** CarPay. Requirement: pay with the card/service. Scope: Tanka states fuel purchases paid with CarPay receive bonus and discount. Typical discount percent is not published on the listed Tanka sources, so the connector emits a member row without a percentage.
3. **Format / sub-brand:** No separate Tanka formats or sub-brands with different fuel price levels are published on the listed sources. Do not emit `format`.
4. **Region / store-cluster:** Tanka says current prices are local-station prices, not national web prices. Connector rows must carry the caller-provided `store_id` and region tag when known.
5. **Subscription / membership-required pricing:** No fuel subscription price is published on the listed Tanka fuel pages. Do not emit `is_subscription_price:true` for fuel.
6. **App-only / coupon-required prices:** No fuel coupon/app-only price is published on the listed sources. Do not emit `is_coupon_price:true` for fuel.
7. **Time-of-day / close-to-close clearance:** No daily fuel clearance pattern is published. Do not emit `is_clearance:true`.
8. **Bulk / volume tiers:** No `N+` fuel multi-buy price is published. Do not emit `multi_buy`.
9. **Service-counter vs packaged:** Not applicable; Tanka is fuel-only on the listed sources. Do not emit `channel:'counter'` or `channel:'packaged'`.
10. **B2B / wholesale split:** No consumer-facing wholesale fuel price split is published on the listed sources. Keep wholesale inventory out of the consumer connector.
