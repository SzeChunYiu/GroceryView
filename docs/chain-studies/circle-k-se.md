# Circle K Sweden pricing quirks study

Sources reviewed: Circle K Sweden pages for consumer fuel prices, Circle K EXTRA, charging prices, car wash prices, business fuel list prices, truck fuel list prices, and Circle K sustainability/food-waste content.

## Findings codified in `packages/ingestion/src/connectors/circle-k-se.ts`

1. **Consumer fuel is local station pricing, not a public online list price.** Circle K states that it removed recommended consumer fuel prices from the website and that the current price is visible on the local station price pylon. It also says pump prices are adapted to the market situation on each locality. Connector impact: consumer pump fuel rows are withheld because no station-specific consumer price feed is published on the listed Circle K source.
   Source: https://www.circlek.se/drivmedel/drivmedelspriser

2. **Business fuel uses list prices and a lowest-price rule versus local pump price.** Circle K Pro lists current business-card prices for light traffic. The same page states that business-card fuel uses the business list price regardless of automat/full-service station, and that if the pump price is lower than list price minus discount the customer pays the lower option. Connector impact: business-card rows use `channel: 'business_card'`, `format: 'fullservice_or_automat'`, and keep `store_id: null` because the source is not station-specific.
   Source: https://www.circlek.se/foretag/drivmedel/priser

3. **Truck customers have a separate weekly price list.** Circle K Truck lists weekly prices for miles diesel, HVO100, B100, and AdBlue. The page says those prices apply Monday-Sunday for truck diesel customers regardless of the pump/pylon price. Connector impact: truck rows use `channel: 'truck_card'` and `format: 'truck_network'`.
   Source: https://www.circlek.se/foretag/fordonspark/truck/priser

4. **Circle K EXTRA is a member-price layer, not a separate base price list.** Circle K EXTRA offers 50 öre/liter on the first three fuel purchases for new members, 50 öre/kWh on first Charge-app charging, member-only store offers, reward choices after every fifth visit, higher discount tiers after 7 and 16 visits, and automatic fuel discount when paying with a card connected to EXTRA. Connector impact: member discount rows use `is_member_price: true`; app reward/coupon mechanics are documented but only emitted when a concrete price or discount is published.
   Source: https://www.circlek.se/extra

5. **Charging has app and single-payment channels.** Circle K publishes Sweden charger prices with both `Pris via app` and `Engångsbetalning`, currently the same value on the source page for Circle K 300-400 kW chargers. Connector impact: charging rows emit separate `channel: 'app'` and `channel: 'single_payment'` rows, both sourced to the charging price page.
   Source: https://www.circlek.se/laddning/priser

6. **Car wash prices are starting prices with local deviations and selected-station subscriptions.** Circle K lists starting prices for Budget, Standard, Premium, and Ultimat säsong, and says local price/program deviations can occur. It also says car-wash subscription is offered at selected stations. Connector impact: car-wash rows carry `format: 'car_wash'`; no subscription price row is emitted because the reviewed page does not publish subscription prices.
   Source: https://www.circlek.se/biltvatt/priser

7. **Close-to-close clearance exists through Too Good To Go.** Circle K says it cooperates with Too Good To Go to sell food that risks being discarded at one third of price; examples include fresh sandwiches, pastries, drinks, candy, nuts, and salads. Connector impact: a food-rescue row uses `channel: 'partner_app'` and `is_clearance: true` with `priceMultiplier: 1/3`.
   Source: https://www.circlek.se/hallbarhet/riktigt-bra-mat

## Quirks not codified

- **Online vs in-store grocery delta:** The reviewed Circle K source pages did not publish an online grocery ordering price list to compare with station store prices. No online-vs-store grocery delta is emitted.
- **Region/store-cluster prices:** Circle K verifies that local fuel prices vary by station/locality, but the reviewed source does not publish station-level prices or region-tagged price rows. No synthetic region rows are emitted.
- **App-only/coupon prices:** EXTRA rewards and personal offers are in the app, but the public pages do not publish a concrete current coupon SKU/price. No `is_coupon_price: true` row is emitted.
- **Bulk/multi-buy tiers:** No current source in this study published a concrete Circle K Sweden multi-buy price tier. No `multi_buy` row is emitted.
- **Service-counter vs packaged:** Circle K is a fuel/convenience chain; the reviewed sources do not describe cheese/charcuterie counter pricing. No counter-vs-packaged rows are emitted.
- **B2B/wholesale split:** Business and truck fuel prices are documented as card/list prices and codified separately. No consumer grocery wholesale split was found.
