# ICA pricing quirks

Primary sources checked:

- https://www.ica.se/erbjudanden/
- https://www.ica.se/stammis/other-languages/english/
- https://www.ica.se/filer/stammis/20260601_stammis_villkor.pdf
- https://www.ica.se/butiker/kvantum/handla-online/
- https://www.ica.se/butiker/supermarket/hofors/ica-supermarket-hofors-1003931/
- https://www.ica.se/butiker/kvantum/astorp/
- ICA store-scoped promotions JSON under `https://handlaprivatkund.ica.se/stores/{storeAccountId}/api/product-listing-pages/v1/pages/promotions`

## 1. Online vs in-store

ICA says many ICA Kvantum stores offer online shopping with home delivery or pickup and often have the same broad online assortment as the physical store. ICA Supermarket Hofors publishes a store-specific claim: "Samma priser online som i vår butik!" and then lists a pickup fee. That verifies that at least one ICA store advertises identical online and in-store prices, not a cross-chain online premium.

Codified: no separate online/store price rows are emitted from the public promotions connector because the public store-scoped promotions endpoint does not expose paired online and in-store price points in the same row. The connector keeps the source store identity so a future endpoint with paired channel evidence can emit separate rows without losing provenance.

## 2. Loyalty program

ICA's loyalty program is Stammis. ICA states that registered Stammis members get Stammis prices, personalised offers, and bonuses. ICA also states that members get special prices on selected in-store items, and the terms say members must identify themselves at checkout; online shoppers must be logged in to receive benefits.

Codified: `fetchIcaProducts` emits `is_member_price: true` when a source promotion description contains `Stammispris`, `ICA Stammis`, or `medlemspris`.

## 3. Format / sub-brand

ICA store pages and store-list URLs expose formats such as Maxi, Kvantum, Supermarket, and Nära. The existing store names in the connector include those format labels.

Codified: `fetchIcaProducts` emits `format` alongside the existing `ica_format`, derived from explicit store config or the ICA store name.

## 4. Region / store cluster

ICA store-scoped promotion URLs are parameterized by store account and region ID. ICA store pages are also city/location-specific.

Codified: rows retain `storeAccountId`, `storeName`, and `regionId` so regional/store-cluster differences stay attached to each price observation.

## 5. Subscription / membership-required pricing

The checked sources verify the free Stammis loyalty program and linked ICA payment-card benefits. They do not verify a separate grocery subscription that unlocks a second consumer price level.

Codified: no `is_subscription_price` field is emitted for ICA store promotions.

## 6. App-only / coupon-required prices

ICA states that personalised offers are available on ica.se, in the ICA app, on store websites, and by store mail/email. The checked public promotion rows do not expose a reliable app-only or coupon-required flag.

Codified: no `is_coupon_price` field is emitted from the public store-scoped promotions connector until a source row exposes that requirement.

## 7. Time-of-day / close-to-close clearance

The checked ICA sources do not verify a daily evening or close-to-close clearance pricing rule.

Codified: no `is_clearance` field is emitted.

## 8. Bulk / volume pricing tiers

ICA's official offers page publishes x-for-y mechanics such as `2 för 35 kr` and `3 för 50 kr` on grocery offers.

Codified: `fetchIcaProducts` parses source promotion text matching x-for-y SEK mechanics into `multi_buy: { quantity, price, currency, sourceText }`.

## 9. Service-counter vs packaged

ICA store pages expose service counters such as `Delikatessdisk`, `Charkuteri`, and `Fiskdisk`. The public promotions endpoint also contains source evidence for weight-sold products, including counter-like category/name/package/unit combinations.

Codified: rows with source-backed counter evidence emit `channel: 'counter'`; other promotion rows emit `channel: 'packaged'`.

## 10. B2B / wholesale split

ICA store pages can link to `Handla online som företag`, but the checked consumer sources do not mix B2B price rows into the consumer promotions endpoint.

Codified: no B2B/wholesale price rows are emitted from the consumer ICA connector.
