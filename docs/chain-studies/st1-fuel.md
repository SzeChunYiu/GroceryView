# ST1 SE fuel pricing quirks

Primary sources reviewed on 2026-05-24:

- St1 listpris St1-stationer: https://st1.se/foretag/listpris
- St1 listpris för tung trafik: https://st1.se/foretag/listpris-truck
- St1 lågt pris: https://st1.se/privat/tjanster/billig-bensin
- St1 Mobility / Bonustian campaign: https://st1.se/privat/bonustian-kampanj
- St1 Business-kort: https://st1.se/foretag/st1-business-kort-och-app/st1-business-kort

## Connector codification

The current connector parses the St1 Business list-price page for St1-stationer. Its rows now emit `channel:'store'` and `format:'st1_station'` because the source states the listed prices apply when fueling at St1 stations in Sweden.

## 1. Online vs in-store

St1 publishes station fueling prices, not online fuel-order prices, on the reviewed sources. The St1 list-price page says the listed St1 Business-card prices apply when fueling at St1 stations in Sweden. The low-price page says the current price is shown on the station price pole and pumps. No online fuel price point is documented, so the connector emits only `channel:'store'` rows.

## 2. Loyalty program

No reviewed St1 source documents a consumer loyalty fuel price with a discount percentage. The Bonustian campaign is app-only, but it awards store vouchers after fueling through St1 Mobility and explicitly excludes fuel purchases from voucher redemption. No `is_member_price:true` fuel row is codified.

## 3. Format / sub-brand

St1 separates St1-stationer list prices from St1 Truck list prices. The St1 Truck page covers St1 Business-card heavy-traffic pricing at St1 Truck in Sweden; the St1-stationer page covers St1 Business-card pricing at St1 stations in Sweden. The connector currently codifies the parsed St1-stationer rows as `format:'st1_station'`.

## 4. Region / store-cluster

For the parsed St1 Business list price, St1 states the list prices apply regardless of where the card is used in Sweden. For consumer pump prices, St1 states prices vary between stations because of local competition and that current prices are shown on the station price pole and pumps. The reviewed sources do not publish a store-level region table, so no region tag is emitted.

## 5. Subscription / membership-required pricing

The reviewed fuel sources do not document a fuel subscription price. The reviewed Bonustian page documents a voucher campaign, not a subscription. No `is_subscription_price:true` row is codified.

## 6. App-only / coupon-required prices

St1 documents app-only offers and the Bonustian app campaign. The campaign gives digital vouchers after app fueling, and those vouchers can be used at PLOQ/Välkommen in but not for fuel. No app-only fuel price or coupon-required fuel price is documented, so no `is_coupon_price:true` row is codified.

## 7. Time-of-day or close-to-close clearance

No reviewed St1 source documents evening, late-day, or clearance fuel pricing. No `is_clearance:true` row is codified.

## 8. Bulk / volume pricing tiers

Bonustian awards 1, 2, or 3 vouchers after 15, 30, or 45 liters via St1 Mobility, capped at 3 vouchers per fueling. The vouchers are not fuel-price reductions and cannot be redeemed for fuel. No fuel `multi_buy` promotion row is codified.

## 9. Service-counter vs packaged

The reviewed St1 fuel sources do not document service-counter versus packaged fuel pricing. No counter or packaged channel is codified.

## 10. B2B / wholesale split

St1 publishes Business-card list prices for St1 stations and a separate heavy-traffic St1 Truck list-price page. The St1 Truck page says heavy-traffic Business-card customers are debited weekly list price minus any discount, even if the pump shows a fictitious 1 kr/liter price, and that St1-station fueling uses current pump price without truck discount. The current connector remains scoped to the St1-stationer list-price rows it parses.
