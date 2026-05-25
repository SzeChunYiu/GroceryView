# Paradiset SE pricing quirks

Study date: 2026-05-25. Sources were limited to Paradiset first-party pages and Paradiset's Mynewsdesk press room.

## Source-backed findings

| Topic requested | Verifiable finding | Connector handling |
| --- | --- | --- |
| Online vs store | Paradiset documented a store discount and an online discount for investors: 20% on the whole in-store assortment and 10% online. The reviewed pages did not publish a same-SKU regular online/store price comparison. | Parsed product rows keep their source channel. Optional owner/member rows apply a 20% discount for `store` or `counter` rows and a 10% discount for `online` rows. No synthetic online/store pair is emitted without both source rows. |
| Loyalty or member tier | Paradiset's crowdfunding page said everyone investing at least 1000 kr received a personal 20% discount on ordinary prices for one year. A later Paradiset page said investors received 20% in store and 10% online. | Owner discount rows emit `is_member_price: true`, `membershipProgram: 'Paradiset delagare'`, and `membershipDiscountPercent`. |
| Format / sub-brand | Paradiset described the original Brannkyrkagatan store as a 1600 square meter full-assortment organic market with mejeri, torrvaror, deli, frys, halsa/skonhet, and barn categories. It later described Sickla as a store with brewery, coffee roastery, health and beauty salon, and foodcourt. | Rows can carry `format: 'organic_market'`, `store_id`, and `region: 'stockholm'` when the source row identifies the store. No format price tier is generated without row-level source evidence. |
| Region / store-cluster | The reviewed Paradiset pages named Stockholm stores and did not publish regional price differences. | Connector rows support Stockholm store ids but do not create regional price deltas. |
| Subscription / membership-required pricing | The reviewed Paradiset sources did not publish a consumer subscription price. | Rows set `is_subscription_price: false`. |
| App-only / coupon-required prices | The reviewed Paradiset sources did not publish an app-only or coupon-code price. | Rows set `is_coupon_price: false`. |
| Time-of-day or close-to-close clearance | Paradiset stated that foodcourt meals used damaged or close-date ingredients to reduce food waste. The reviewed sources did not publish a daily clearance price rule or a clearance product price. | Rows set `is_clearance: false`. |
| Bulk / volume pricing tiers | The reviewed Paradiset sources did not publish a buy-N or volume-price example. | `multi_buy` remains null. |
| Service-counter vs packaged | Paradiset documented a deli counter and foodcourt, but the reviewed sources did not publish a counter-vs-packaged price comparison. | The parser accepts `channel: 'counter'` for source-identified counter rows but does not synthesize counter rows. |
| B2B / wholesale split | The reviewed Paradiset sources did not publish a restaurant, cafe, or wholesale consumer-mixed price table. | No B2B rows are emitted. |

## Reviewed examples

- Paradiset's 2015 opening announcement described the first Stockholm store as a 1600 square meter full-assortment organic store with more than 4500 products across dairy, dry goods, deli, frozen, health/beauty, and children's departments; it gave the address Brannkyrkagatan 62-64, 118 23 Stockholm. Source: https://www.mynewsdesk.com/se/paradiset/pressreleases/nu-oeppnar-skandinaviens-stoersta-ekobutik-1300783
- Paradiset's 2017 crowdfunding announcement said all shareholders were offered 20% off the entire assortment in all stores for one year, and specified that a 1000 kr minimum investment gave a personal 20% discount on ordinary prices for a year. Source: https://www.mynewsdesk.com/se/paradiset/pressreleases/vaerldens-foersta-crowdfunding-foer-en-matvarukedja-paradiset-fortsaetter-att-utmana-den-svenska-dagligvaruhandeln-2143246
- Paradiset's 2018 White Guide Green news item said investors received 20% on the whole in-store assortment and 10% online. Source: https://www.mynewsdesk.com/se/paradiset/news/paradiset-blir-aarets-haallbara-foeregaangare-2018-av-white-guide-green-308438
- Paradiset's 2017 Retail Awards announcement described the Sickla unit as having a brewery, coffee roastery, health and beauty salon, and foodcourt, and said all stores had a deli counter where much food was made with damaged or close-date ingredients. Source: https://www.mynewsdesk.com/se/paradiset/pressreleases/paradiset-vinner-aarets-butikskoncept-1969755

## No codified row changes from the reviewed pages

- No first-party product page with a current SKU price was found in the reviewed source set.
- No regular same-SKU online/store price delta was published in the reviewed source set.
- No current app coupon, subscription, multi-buy, daily clearance, regional-price, or wholesale consumer row was published in the reviewed source set.
