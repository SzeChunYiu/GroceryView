# Circle K (SE) pricing quirks

Primary sources checked on 2026-05-25:

- <https://www.circlek.se/drivmedel/drivmedelspriser>
- <https://www.circlek.se/extra>
- <https://www.circlek.se/extra-club/erbjudanden>
- <https://www.circlek.se/foretag/drivmedel/priser>
- <https://www.circlek.se/foretag/fordonspark/truck/priser>

## Source-backed findings

- **Consumer fuel prices are local store prices:** Circle K says current consumer
  fuel prices are no longer shown on the website and that the current price is
  on the local station price sign. The same page says fuel prices vary from day
  to day and from station to station. Connector emits a store-channel metadata
  row with `requiresStoreId: true` and `storePriceSource:
  'local_station_price_sign'`; it does not emit a national consumer fuel price.
- **Circle K EXTRA member prices:** Circle K EXTRA gives new members 50 ore per
  litre off the first three fuel purchases after joining with a bank or payment
  card. Connector emits this as an `is_member_price: true` fuel discount row.
- **Circle K Charge app-only discount:** Circle K EXTRA says the first charging
  discount is 50 ore per kWh through the Circle K Charge app. Connector emits an
  app-channel row with `is_member_price: true` and `is_coupon_price: true`.
- **EXTRA app reward coupons:** Circle K EXTRA says every fifth visit lets the
  member choose a reward in the Circle K app from drinks, food, and snacks.
  Connector emits a store-offer metadata row with `is_member_price: true` and
  `is_coupon_price: true`; it does not create item prices because the checked
  source does not publish concrete SKU prices.
- **Business fuel split:** Circle K Pro publishes current business-customer
  fuel list prices and says Pro customers refuel at current list price minus
  discount. Connector parses the list-price tables as business fuel rows and
  emits a B2B metadata row marked out of consumer-connector scope.
- **Truck weekly prices:** Circle K Pro truck prices are listed separately and
  the source says they are weekly prices valid Monday through Sunday and
  include VAT. Connector parses these rows with `listPriceKind: 'truck_card'`
  and emits a B2B truck metadata row.

## Requirement mapping

| Requirement | Source-backed finding | Connector action |
| --- | --- | --- |
| 1. Online vs in-store prices | No online food or consumer fuel checkout price is published in the checked sources. Consumer fuel prices are local station price-sign prices. | Emit no `channel: 'online'` consumer rows. Emit store metadata requiring a store id for consumer fuel. |
| 2. Loyalty program | Circle K EXTRA documents fuel, charging, and app reward benefits. | Emit `is_member_price: true` rows for the concrete 50 ore/l fuel discount, 50 ore/kWh app charging discount, and app reward offer. |
| 3. Format / sub-brand | The checked sources separate consumer station prices, Circle K Pro business prices, and truck prices, but do not document Circle K store-format food price tiers. | Use `customerSegment`, `listPriceKind`, and `productScope` rather than a grocery `format` field. |
| 4. Region / store-cluster | Consumer fuel price varies by local station price sign; the source does not publish region clusters. | Require `store_id` for consumer fuel captures; do not infer regional clusters. |
| 5. Subscription / membership-required pricing | EXTRA is a membership program, but no paid subscription price tier was found in the checked sources. | Emit no `is_subscription_price: true` rows. |
| 6. App-only / coupon-required prices | Circle K Charge discount and every-fifth-visit rewards are app surfaces. | Emit `is_coupon_price: true` rows for app-channel charging/reward rows. |
| 7. Time-of-day / close-to-close clearance | No daily clearance or time-of-day product-price rule was found in the checked sources. | Emit no `is_clearance: true` rows. |
| 8. Bulk / volume pricing tiers | No consumer multi-buy product-price example was found in the checked sources. | Emit no `multi_buy` promotion rows. |
| 9. Service-counter vs packaged | No counter-vs-packaged food price example was found in the checked sources. | Emit no `channel: 'counter'` or `channel: 'packaged'` rows. |
| 10. B2B / wholesale split | Circle K Pro and truck pages publish business/truck fuel price surfaces separate from consumer station prices. | Parse business/truck price rows and mark B2B quirk metadata out of consumer scope. |

## Quirks not codified

- The checked sources describe food, drinks, and snacks as reward choices but do
  not publish concrete convenience-store SKU prices.
- The checked sources do not publish a region table, supermarket-style service
  counter prices, recurring clearance schedule, subscription tier, or consumer
  multi-buy food price.
