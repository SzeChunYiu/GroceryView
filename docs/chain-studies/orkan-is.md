# Orkan IS Pricing Quirks

Study note date: 2026-05-25.

Primary sources checked:

- https://www.orkan.is/
- https://www.orkan.is/english/
- https://www.orkan.is/english/apply-for-orkan-discount-card/
- https://www.orkan.is/stod/horgarbraut

## Lowest-price station cluster

Orkan says it offers its lowest fuel price at a named station cluster. The Icelandic homepage lists Brúartorg, Bústaðavegur, Dalvegur, Einhella, Furuvellir, Hörgárbraut, Kleppsvegur, Mýrarvegur, Reykjavíkurvegur, Salavegur, Skógarhlíð, Suðurfell, and Suðurlandsvegur, with 95 okt at 205.3 ISK/l and diesel at 246.6 ISK/l on 2026-05-25.

Connector action: `packages/ingestion/src/connectors/orkan-is.ts` emits the checked 95 okt and diesel rows with `format:'lowest_price_station'`, `store_id:'orkan-is-lowest-price-network'`, `region:'lowest_price_network'`, and `is_member_price:false`.

## Loyalty program

The English Orkan card page says applying for an Orkan card to Apple/Google wallet gives a 12 ISK/l discount. It also lists excluded stations where Orkan offers the lowest possible price. The English homepage says the Orkan card gives a 12 ISK/l and kWh discount and free coffee around Iceland at stations that offer services.

Connector action: the connector emits a member discount row with `is_member_price:true`, `memberProgram:'Orkan card'`, `discountPerLitre:12`, and the excluded-location list. It does not compute discounted petrol or diesel prices for non-lowest stations because the checked sources do not expose their undiscounted pump prices.

## EV charging

The English homepage lists EV charging at 58 ISK/kWh at all stations except Fitjar and Vesturlandsvegur, with 58 ISK/min after 60 minutes. It lists 38 ISK/kWh at Fitjar and Vesturlandsvegur, with 38 ISK/min after 60 minutes. The same section states a 12 ISK/kWh Orkan card discount at all EV stations except Vesturlandsvegur and Fitjar.

Connector action: the connector emits ordinary EV rows for 58 ISK/kWh and 38 ISK/kWh, plus an `is_member_price:true` EV row at 46 ISK/kWh for the 58 ISK/kWh stations.

## Online vs store pricing

The checked Orkan sources describe self-service pumps, EV charging, partner benefits, and station services. They do not expose online product ordering prices versus physical-store prices for Orkan consumer goods.

Connector action: no `channel:'online'|'store'` grocery product rows are emitted.

## App, coupon, subscription, clearance, bulk, and counter pricing

The checked pages do not expose subscription-required prices, coupon-only prices, close-to-close clearance pricing, bulk volume tiers, or service-counter versus packaged grocery prices.

Connector action: no `is_subscription_price:true`, `is_coupon_price:true`, `is_clearance:true`, `multi_buy`, or `channel:'counter'|'packaged'` rows are emitted.

## B2B / wholesale split

The checked pages describe consumer pump, card, and EV charging terms. They do not expose restaurant, cafe, or wholesale inventory prices.

Connector action: no B2B consumer rows are emitted.
