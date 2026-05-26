# Tanka SE pricing study

Primary source scope: tanka.se pages only, checked for fuel pricing quirks on 2026-05-25.

## Source-backed findings

| Requirement | Tanka.se evidence | Connector action |
| --- | --- | --- |
| Online vs in-store prices | Tanka says it no longer publishes recommended fuel prices on the website and that the current price is on the price sign at the local Tanka station (`https://www.tanka.se/`, also repeated at `https://tanka.se/aktuellt`). No Tanka.se fuel page documents an online ordering price. | Emit a store-channel station-price-sign row. Do not emit an online fuel price row. |
| Loyalty program | Tanka's CarPay page says CarPay is free, gives bonus on purchases, and that Tanka customers always have 10 öre per liter discount when paying with the card or app (`https://tanka.se/carpay`). | Emit a `channel:'store'` CarPay member-price adjustment row with `is_member_price:true` and `discountAmountSekPerLitre:0.10`. |
| Format / sub-brand | Tanka.se presents Tanka as the fuel-station concept and Tvätta as the car-wash concept. The station finder filters fuel availability, but no Tanka.se source gives fuel price levels by Tanka format or sub-brand. | No `format` field is emitted. |
| Region / store-cluster | Tanka states exact current fuel prices are shown on the local station price sign. Its about/current pages describe stations around Sweden and local Volvo/Renault dealer operation, but no public regional fuel price table or cluster rule is published on Tanka.se. | Mark fuel price capture as requiring a store id/local station source; do not infer regional price rows. |
| Subscription / membership-required pricing | No Tanka.se fuel subscription price was found. Tvätta car-wash subscriptions are documented, but they are not fuel prices. | Emit `is_subscription_price:false` for fuel rows. |
| App-only / coupon-required prices | Tanka.se documents CarPay app/card payment and bonus redemption, but no fuel coupon-only price was found. | Emit `is_coupon_price:false`. |
| Time-of-day / close-to-close clearance | No Tanka.se fuel page documents daily clearance or time-of-day discounting. | Emit `is_clearance:false`. |
| Bulk / volume tiers | No Tanka.se consumer fuel page documents a buy-N volume tier. | No `multi_buy` row is emitted. |
| Service-counter vs packaged | Not applicable to Tanka fuel sales; no Tanka.se grocery/service-counter fuel analogue is documented. | No counter/packaged channel is emitted. |
| B2B / wholesale split | The Tanka pages reviewed describe consumer station fueling and CarPay. No mixed consumer/wholesale fuel inventory or restaurant/cafe pricing is documented on Tanka.se. | No B2B/wholesale row is emitted. |

## Codified examples

- `station_price_notice`: justified by the Tanka homepage/current notice that website recommended prices are withdrawn and current fuel prices are on local station signs.
- `carpay_fuel_discount`: justified by the CarPay page's 10 öre/liter Tanka fuel discount.

No other pricing quirk above is codified because it was not verified from Tanka.se fuel sources.
