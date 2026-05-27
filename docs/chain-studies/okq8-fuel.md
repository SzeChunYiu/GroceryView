# OKQ8 SE Fuel And Station Pricing Quirks

Primary source scope: `okq8.se` and OKQ8 Kundservice pages linked from `okq8.se`.

| Quirk | Verified source claim | Connector action |
| --- | --- | --- |
| Online vs in-store prices | OKQ8's station-offer page publishes in-station offers and links shoppers to stations. The checked sources do not publish an online grocery checkout price for the same station goods. OKQ8's fuel business-price page states that station signs and pumps show private-customer prices, while business customers use the table on the page. | Fuel table rows are marked `channel: 'b2b'`, `customerSegment: 'business'`, and `out_of_scope_for_consumer_connector: true`. Station-goods offer rows use `channel: 'store'`; no online consumer row is emitted. |
| Loyalty program | OKQ8 Kundservice says OK members receive monthly member offers at OKQ8 stations, cashback on OKQ8 purchases, partner offers, every-sixth in-store-purchase rewards in the OKQ8 app, and 10% car-wash discount. The monthly-offer page shows concrete member station offers, including Ramlosa & Imsdal at `2 for 32 kr` with non-member price `2 for 37 kr`. | Rows backed by those offers emit `is_member_price: true`, `membershipProgram: 'OK'`, and the concrete member price or discount. |
| Format / sub-brand | The reviewed OKQ8 pages distinguish station services and business fuel products but do not publish price levels by OKQ8 station format comparable to supermarket sub-brands. | Rows use `format: 'okq8_station'`; no unverified format tier is emitted. |
| Region / store-cluster | The business fuel page says business customers get the same price whether tanking in Pajala or Nassjo and at manned or unmanned stations, with exceptions for AdBlue, vehicle gas, and alkylate petrol where signposted pump price applies. | Business fuel rows use `store_id: 'se:national-okq8-business-fuel'`, `region: 'se-national'`, and `regional_price_policy: 'same_business_price_nationally_except_adblue_gas_alkylate'`. No regional consumer price delta is emitted. |
| Subscription / membership-required pricing | The checked OKQ8 fuel and station-offer pages do not document a consumer product subscription price. Car-wash subscription pages exist as a separate service, but the checked evidence for this connector is a member discount, not a subscription price. | Rows set `is_subscription_price: false`. |
| App-only / coupon-required prices | The monthly-offer page says OKQ8 app users who become members find coupons and personal offers in the app. Kundservice also says every-sixth in-store-purchase rewards require downloading and logging into the app. | App-personal-offer rows emit `channel: 'app'`, `is_member_price: true`, and `is_coupon_price: true`. |
| Time-of-day or close-to-close clearance | The checked OKQ8 sources do not document daily evening, late-store, close-to-close, short-date, or clearance pricing. | Rows set `is_clearance: false`. |
| Bulk / volume pricing tiers | The monthly-offer page gives explicit multi-buy station offers such as Ramlosa & Imsdal `2 for 32 kr` for members and `2 for 37 kr` for non-members. | The station-goods member row emits `multi_buy: '2 for 32 SEK; non-member 2 for 37 SEK'`. |
| Service-counter vs packaged | The checked OKQ8 sources list station food and shop services but do not document a counter-vs-packaged same-product price split. | No `channel: 'counter'` or `channel: 'packaged'` row is emitted. |
| B2B / wholesale split | The OKQ8 business-price page publishes company fuel prices for station fuel, Q8Truck, delivery, charging, and biogas. It says business customers should use the table and that station signs/pumps show private-customer prices. | Business fuel rows remain in the connector for business evidence but are flagged `customerSegment: 'business'` and `out_of_scope_for_consumer_connector: true` for consumer comparisons. |

Sources checked:

- `https://www.okq8.se/foretag/priser/`
- `https://www.okq8.se/pa-stationen/manadens-erbjudande/`
- `https://www.okq8.se/medlem/`
- `https://kundservice.privat.okq8.se/OK_Medlemskap/Bli_medlem/Medlemsf%C3%B6rm%C3%A5ner`
