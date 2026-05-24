# Preem SE pricing quirks study

Primary source required for this study: `preem.se`.

Study date: 2026-05-24.

## Verified primary-source findings

- Private consumer fuel prices are station-local: Preem says it does not publish recommended approximate petrol/diesel prices for private customers, that the current price is shown on the price pole at the nearest Preem station, and that fuel pricing is local and may vary between stations depending on the local market.
- Preem Mastercard is a private-customer card discount: Preem lists 25 öre/liter discount at staffed stations, 10 öre/liter at automated stations, and 0.5% bonus on everyday purchases.
- Business list prices are separate from consumer pump prices: Preem publishes list prices for Företagskort/Transportkort, Truckkort, Bulk, and EV charging. The Företagskort/Transportkort list price applies regardless of where in the country or what facility type the customer uses, and the customer discount is deducted from that list price. Truckkort uses weekly list price. Bulk has a separate weekly list price for pickup and delivery customers.

## Required quirk coverage

1. Online vs in-store: no online grocery/convenience product price delta was verified from `preem.se`; fuel rows use `channel:'store'` only when an explicit station/pump or list-price record is supplied.
2. Loyalty program: Preem Mastercard has verified staffed-station and automated-station fuel discounts; connector emits `is_member_price:true`, `membership_program:'Preem Mastercard'`, and `discount_ore_per_liter` rows for those examples.
3. Format / sub-brand: Preem distinguishes staffed stations, automated stations, company-card list prices, truck-card list prices, bulk list prices, and EV charging list prices; connector emits `format` for those verified formats.
4. Region / store-cluster: consumer pump pricing is station-local; connector emits `store_region_tag:'station_local'` when a consumer station price row is ingested.
5. Subscription / membership-required pricing: no subscription price was verified from `preem.se`; connector does not emit `is_subscription_price:true`.
6. App-only / coupon-required prices: no app-only or coupon-required price was verified from `preem.se`; connector does not emit `is_coupon_price:true`.
7. Time-of-day / close-to-close clearance: no daily clearance pattern was verified from `preem.se`; connector does not emit `is_clearance:true`.
8. Bulk / volume pricing tiers: bulk weekly list prices are B2B pickup/delivery list prices, not consumer multi-buy pricing; connector emits `format:'bulk_list_price'` and `customer_segment:'business'`, not `multi_buy` rows.
9. Service-counter vs packaged: no service-counter/package split was verified from `preem.se`; connector does not emit counter/package channels.
10. B2B / wholesale split: Preem publishes business list prices separately from private station-local pump prices; connector emits `customer_segment:'business'` and `is_b2b_price:true` for list-price rows.

## Source URLs

- https://www.preem.se/pa-stationen/drivmedel/drivmedelspriser/
- https://www.preem.se/privat/kort-och-formaner/preem-mastercard/rabatter/
- https://www.preem.se/foretag/listpriser/
