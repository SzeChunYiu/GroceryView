# Lloyds Apotek / DOZ Apotek (SE) pricing quirks

Primary sources: `https://www.lloydsapotek.se/` redirecting to `https://dozapotek.se/`, DOZ Plus membership terms (`https://dozapotek.se/bli-medlem-doz-apotek`), DOZ campaign page (`https://dozapotek.se/aktuella-kampanjer/25-vid-kop-av-2-pa-doz-apotek`), and DOZ online-only short-date product example (`https://dozapotek.se/doz-apotek-vaniljfudge-175-g-687303`).

## Source-backed findings

- **Brand / format:** The Lloyds Apotek domain redirects to DOZ Apotek. Connector rows keep `chain: 'lloyds-apotek'` for continuity and add `format` values for DOZ surfaces.
- **Online vs in-store:** DOZ product and campaign pages expose online price surfaces and store context. The campaign page says the 25% when buying 2 offer applies both online and in store, and that prices can differ from store prices. The connector emits the online campaign row and does not fabricate a store row without a concrete store price.
- **Online-only short-date products:** The DOZ Apotek vaniljfudge page is labeled online price / store price and says the short-date product is online-only, not for store pickup. Connector emits that row as `channel: 'online'`, `store_id: 'se:doz-online-only'`, `format: 'doz_online_only'`, and `is_clearance: true`.
- **Loyalty/member pricing:** DOZ Plus membership terms say members collect points on eligible purchases, and that discounted member prices can vary between pharmacies and online. The checked source lists DulcoSoft oral solution at campaign price 74,40 kr against ordinary price 93,00 kr. Connector emits this concrete example with `is_member_price: true`.
- **Bulk / volume pricing tiers:** The campaign page lists `25% vid köp av 2` for DOZ Apotek products and shows DOZ Apotek Zinkcitrat at campaign price 66,50 kr against ordinary price 95,00 kr. Connector emits `multi_buy: '25% vid köp av 2'`.

## Quirks not codified

- **Specific OTC categories where online is cheaper:** The listed sources prove that prices can differ from store prices and show online-only rows, but they do not provide matched in-store prices for OTC category deltas. No category delta is emitted.
- **Region / store-cluster:** The listed sources do not publish regional or store-cluster price differences. No region-specific store row is emitted.
- **Subscription-required pricing:** No subscription price terms were found in the listed sources.
- **App-only / coupon-required prices:** No coupon-code or app-only price requirement was found in the listed sources.
- **Time-of-day close-to-close clearance:** The short-date online-only row is codified as clearance, but no daily evening/close-to-close pattern was found.
- **Service-counter vs packaged:** No supermarket counter or packaged-counter split applies in the listed pharmacy sources.
- **B2B / wholesale split:** No business or wholesale customer price split was found in the listed sources.
