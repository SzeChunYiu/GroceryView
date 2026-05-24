# ICA Sweden pricing quirks study

Last verified: 2026-05-25. Sources are limited to ICA-owned pages and ICA storefront/API surfaces.

## Primary sources checked

- ICA online purchase terms: <https://www.ica.se/handlaonline-kopvillkor/>
- ICA Stammis overview: <https://www.ica.se/stammis/>
- ICA Stammis English overview: <https://www.ica.se/stammis/other-languages/english/>
- ICA Stammis benefits: <https://www.ica.se/stammis/bonus-och-formaner/>
- ICA store and format pages, including <https://www.ica.se/butiker/maxi/butiker/>, <https://www.ica.se/butiker/nara/malung-salen/ica-klappen-1060001/>, <https://www.ica.se/butiker/nara/malung-salen/ica-nara-salen-595/nyckel-till-butiken/>, store pages under `ica.se/butiker/...`, and store-scoped `handlaprivatkund.ica.se` promotion JSON already used by the connector.

## Findings mapped to connector behavior

| Quirk | Verifiable claim from ICA sources | Connector action |
|---|---|---|
| Online channel | ICA's online terms define the online shop as `Nätbutiken`; prices are the prices that apply when the customer completes checkout. The store-scoped promotion API used by GroceryView is under `handlaprivatkund.ica.se/stores/{storeAccountId}/...`. | Rows emitted by `fetchIcaProducts()` are marked `channel: 'online'`. No in-store row is emitted unless a separate in-store source is present. |
| Store-specific online fees and possible price differences | The online terms state picking, pickup, and home-delivery prices are shown in the online shop and can vary by chosen store. ICA Kläppen and ICA Nära Sälen store pages explicitly say they have the same online and in-store prices after removing online markups. | Keep `storeAccountId` and `regionId` on every row. Do not infer in-store equality for other stores. |
| Stammis loyalty prices | ICA says Stammis is ICA's loyalty scheme; members receive Stammis prices, personalised offers, and bonuses. ICA's Swedish Stammis pages describe reduced prices on selected goods every week and personalised offers. | Promotion descriptions containing `Stammis` are emitted with `isMemberPrice: true`; daily ingestion maps that to `memberOnly`. |
| Store format / sub-brand | ICA's own store pages and URLs distinguish ICA Maxi, ICA Kvantum, ICA Supermarket, and ICA Nära. | The connector derives `format: 'maxi' | 'kvantum' | 'supermarket' | 'nara' | 'other'` from the configured store name. |
| Store / region clustering | ICA online endpoints are store scoped (`/stores/{storeAccountId}/...`) and require a `regionId` query parameter in the observed promotions endpoint. | Continue emitting `storeAccountId` and `regionId`; use them as the region/store tags for any future comparison. |
| Multi-buy tiers | ICA store pages expose offers such as `2 för 40kr`, `4 för 50kr`, and `2 för 30kr`. | Promotion descriptions matching `N för X kr` are emitted as `multiBuy: { quantity, price, currency: 'SEK' }`. |
| Service-counter / weight-priced goods | ICA's online terms define weight-priced goods (`viktvara`) whose exact price is set after picking and weighing. ICA store pages list deli/fish/counter departments. | Existing counter evidence stays: rows with kg evidence and counter-like product/category text are marked `soldByWeight: true`. |

## Explicitly not codified from these sources

- **Separate in-store product prices:** no listed source provided a machine-readable product-level in-store price row alongside the online row for the same SKU, so the connector does not emit `channel: 'store'` rows.
- **Subscription-required grocery prices:** no ICA source checked documented a consumer grocery subscription that unlocks separate product prices, so no `isSubscriptionPrice` field is emitted.
- **Coupon/app-only product prices:** ICA documents personalised offers and app/account surfaces, but the current public promotion payload does not expose a stable coupon/app-only field. The connector does not emit `isCouponPrice` until a concrete payload example is captured.
- **Time-of-day or close-to-close clearance:** the checked ICA sources did not document a recurring daily clearance pricing feed, so no `isClearance` field is emitted.
- **B2B/wholesale prices:** ICA store pages may offer `Handla online som företag`, but no mixed consumer/B2B price payload was verified in the connector source. B2B pricing remains out of scope for this consumer connector.
