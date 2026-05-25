# Atlantsolía (Iceland) pricing quirks

Source checked: <https://www.atlantsolia.is/> on 2026-05-25.

Primary-source pages checked:

- <https://www.atlantsolia.is/>
- <https://www.atlantsolia.is/stodvar/>
- <https://www.atlantsolia.is/appid/>
- <https://www.atlantsolia.is/daelulykill/afslattur-og-allskonar/>
- <https://www.atlantsolia.is/daelulykill/saekja-um-lykil/>
- <https://www.atlantsolia.is/skilmalar/>
- <https://www.atlantsolia.is/daelulykill/samstarfsadilar/>
- <https://www.atlantsolia.is/fyrirtaekjalausnir/fyrirtaekjalausnir/>
- <https://www.atlantsolia.is/fyrirtaekjalausnir/tankar/>
- <https://www.atlantsolia.is/fyrirtaekjalausnir/dreifing/>

## Pricing-quirk findings

| Requirement | Source-backed finding | Connector action |
| --- | --- | --- |
| 1. Online vs in-store prices | The station page publishes per-station 95 Okt., Dísel, and Rafmagn prices. The checked sources do not publish online fuel order prices. | Fuel rows emit `channel: 'store'`; no `channel: 'online'` rows are emitted. |
| 2. Loyalty program | Atlantsolía says the app and dælulykill give an 11 ISK discount on fuel at AO stations. The terms state dælulykill gives an agreed discount of at least 11 ISK from station price, except at marked low-price stations. | Eligible station fuel rows emit extra `is_member_price: true` rows with `membershipProgram: 'Atlantsolía app/dælulykill'` and `memberDiscountIskPerLitre: 11`. |
| 3. Format / sub-brand | The checked sources describe Atlantsolía stations and low-price stations, but no separate store-format price level such as supermarket sub-brands. | No `format` field is emitted. |
| 4. Region / store-cluster | The station page shows different prices by station, for example Akureyri Baldursnes at 205,40 ISK/l for 95 Okt., Bíldshöfði at 231,40 ISK/l, Njarðvík at 221,40 ISK/l, and Stykkishólmur at 220,30 ISK/l. | Rows preserve the exact station using `store_id`; no regional aggregate price field is emitted. |
| 5. Subscription / membership-required pricing | No subscription product that unlocks a separate consumer fuel price was found on the checked sources. | Rows emit `is_subscription_price: false`. |
| 6. App-only / coupon-required prices | The app page says the applykill works like the dælulykill and gives the discount. The checked sources do not show a coupon-code or app-only price separate from the dælulykill/applykill member discount. | Member rows are not marked coupon prices; rows emit `is_coupon_price: false`. |
| 7. Time-of-day / close-to-close clearance | No daily time-of-day or clearance fuel discount pattern was found on the checked sources. | Rows emit `is_clearance: false`. |
| 8. Bulk / volume pricing tiers | No consumer multi-buy or volume-tier fuel price was found on the checked sources. | No `multi_buy` promotion rows are emitted. |
| 9. Service-counter vs packaged | Atlantsolía is documented as a fuel station operator in the checked sources; no supermarket service-counter or packaged-goods pricing was found. | No `channel: 'counter'` or `channel: 'packaged'` rows are emitted. |
| 10. B2B / wholesale split | Business pages describe company services, invoice/payment terms, tank loans from 450 to 10,000 litres, distribution orders, a 200-litre minimum for tank/equipment delivery, and same-day and small-order fees. They do not publish a consumer-comparable B2B fuel-price table. | B2B delivery/tank terms are documented but not emitted as consumer price rows. |

## Codification rule

The connector emits station-specific store fuel prices from the public station
table. It emits member discount rows only when the public station price and the
11 ISK/l app/dælulykill discount can be combined without contradicting the
published exclusion list. The exclusion list is Kaplakriki, Sprengisandur,
Öskjuhlíð, Selfoss, and Akureyri Baldursnes.
