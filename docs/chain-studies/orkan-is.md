# Orkan (IS) pricing quirks

Primary sources reviewed:

- Orkan English landing page: <https://www.orkan.is/english/>
- Orkan lowest-price page: <https://www.orkan.is/laegsta-verdid/>
- Orkan stations page: <https://www.orkan.is/orkustodvar/>
- Orkan discounts page: <https://www.orkan.is/afslaettir/>
- Orkan English terms and conditions: <https://orkan.is/english/terms-and-conditions/>

## Verifiable quirks

### Online vs in-store

No online grocery or online fuel-order price was found in the listed Orkan sources. Orkan describes its fuel operation as self-service stations where customers pay at the pump before fuelling. The connector therefore emits `channel: 'store'` only.

### Loyalty program

Orkan offers Orkan card / Orkulykill discounts. The English page says the card gives 12 kr. discount per liter and kWh, except named lowest-price fuel stations and the Fitjar / Vesturlandsvegur EV stations. The Icelandic discounts page also states 12 kr. discount for fuel and electricity with Orkan cards / Orkulykill, excluding the same lowest-price fuel and EV locations. Terms say the Orkan key is linked to a debit or credit card and that key holders receive fixed per-liter discounts and partner discounts.

Connector rule: emit `is_member_price: true` rows for standard stations when a base store row is present; do not emit a member row for stations tagged as lowest-price locations.

### Format / sub-brand

Orkan identifies selected stations as lower-price locations. The lowest-price page lists 13 stations: Skógarhlíð, Bústaðavegur, Suðurfell, Kleppsvegur, Dalvegur, Salavegur, Reykjavíkurvegur, Einhella, Mýrarvegur, Hörgárbraut, Furuvellir, Brúartorg and Suðurlandsvegur. The stations page shows a "Lægsta verðið" / lowest-price section with 95 octane and diesel prices for those locations.

Connector rule: tag those station rows with `format: 'lowest_price_station'`. EV low-price stations Fitjar and Vesturlandsvegur are tagged `format: 'lowest_price_ev_station'`.

### Region / store-cluster

The lowest-price page groups the 13 fuel locations by city or area: Reykjavík, Kópavogur, Hafnarfjörður, Akureyri, Borgarnes and Selfoss. The connector encodes this in `store_id` as `orkan-is:<region>:<station-slug>` and also emits a separate `region` field.

### Subscription / membership-required pricing

No subscription price was found in the listed Orkan sources. The Orkan key/card is a loyalty/payment credential rather than a paid subscription. No `is_subscription_price` row is emitted.

### App-only / coupon-required pricing

No app-only coupon price was found in the listed Orkan sources. No `is_coupon_price` row is emitted.

### Time-of-day or close-to-close clearance

No daily time-of-day or clearance discount pattern was found in the listed Orkan sources. No `is_clearance` row is emitted.

### Bulk / volume pricing tiers

No multi-buy or volume-tier consumer fuel pricing was found in the listed Orkan sources. No `multi_buy` promotion row is emitted.

### Service-counter vs packaged

Orkan is a self-service fuel / EV station chain in the listed sources. No grocery service-counter vs packaged pricing was found.

### B2B / wholesale split

The discounts page says Skeljungur handles distribution, purchasing and wholesale of fuel, lubricants, cleaning and chemical products, fertilizer and other products/services for companies and farmers. The listed Orkan consumer sources do not publish a separate B2B price table to mix into the consumer connector, so no B2B rows are emitted.
