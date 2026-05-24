# Skeljungur (IS) pricing quirks

Source scope: primary Skeljungur domains only (`skeljungur.is`, `en.skeljungur.is`, and `verslun.skeljungur.is`). Checked 2026-05-24.

## Verified findings

| Area | Finding | Connector action |
| --- | --- | --- |
| Public fuel list prices | Skeljungur publishes `Almennt verð eldsneytis` / `Fuel list price` and the page warns that listed fuel prices do not account for special terms. The page uses `/api/pricelistdata?date=YYYY-MM-DD` for dated rows such as `Bensín 95 okt`, `Gasolía-Diesel`, `JET A-1`, and `Metan`. | `skeljungur-is.ts` emits one `channel: 'fuel_list_price'` row per official API item with `excludesContractTerms: true`. |
| Online vs in-store | The Skeljungur fuel-order page says customers receiving petrol at a service station pay the pump price minus their agreed contract discount, while tanker-truck delivery pays the current price guide minus the agreed contract discount. The source does not publish paired online/store consumer SKU prices. | Do not emit separate `online`/`store` price rows. Keep the list-price channel separate and mark contract terms as excluded. |
| Loyalty program | No Skeljungur loyalty program name, requirements, percentage, or app-only member discount was found in the listed sources. | Do not emit `is_member_price: true`; rows use `is_member_price: false`. |
| Format / sub-brand | The listed sources identify Skeljungur as Shell's official reseller in Iceland and say Skeljungur owns Barkur, EAK, Fjölver, and Ecomar, but they do not publish separate retail price levels by format or sub-brand. | Do not emit a `format` price field. |
| Region / store-cluster | The Icelandic service price page adds a fee for deliveries outside the capital area below 800 litres and says delivery dates differ where Skeljungur does not operate supply depots. It does not publish region-specific unit fuel prices. | Do not add region-specific `store_id` price rows. |
| Subscription / membership-required pricing | The listed sources mention contract discounts and equipment/tank rental terms, but no subscription unlocking consumer prices. | Do not emit `is_subscription_price: true`; rows use `is_subscription_price: false`. |
| App-only / coupon-required prices | No app-only or coupon-required prices were found in the listed sources. | Do not emit `is_coupon_price: true`; rows use `is_coupon_price: false`. |
| Time-of-day / clearance | The service page lists off-hours service fees; no daily evening or close-to-close clearance discount pattern is published. | Do not emit `is_clearance: true`; rows use `is_clearance: false`. |
| Bulk / volume tiers | The service page lists delivery service fees under 200 litres and under 100 litres, plus equipment rental tied to minimum yearly use. These are fees/terms, not “price per unit when buying N+” product tiers. | Do not emit `multi_buy` promotions. |
| Service-counter vs packaged | Skeljungur is an energy/lubricants supplier in these sources, not a supermarket service-counter source. | No `counter`/`packaged` channel rows. |
| B2B / wholesale split | The about page states Skeljungur distributes and wholesales fuel, lubricants, cleaning and chemical products, fertilizers, and services to companies and farmers, and also serves large-scale users, shipping, aviation, and contracting. | Rows are marked `customerSegment: 'business'`; consumer pricing remains out of scope unless a public consumer price source is added. |

## Concrete examples used for codification

- Fuel list page/API: `https://www.skeljungur.is/listaverd-eldsneytis` and `https://www.skeljungur.is/api/pricelistdata?date=2026-05-24` provide official list-price item rows.
- Contract-discount boundary: `https://en.skeljungur.is/order-fuel` states pump and tanker-truck customers pay the relevant public price less agreed contract discounts.
- Online shop boundary: `https://verslun.skeljungur.is/products/helix-hx7-10w-40-1l` publishes a single list price with VAT and availability for both `Verslun Skútuvogi` and `Netverslun`; it does not show two different price points.
