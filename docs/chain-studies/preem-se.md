# Preem SE pricing quirks

Primary sources checked:

- Preem private fuel prices: https://www.preem.se/pa-stationen/drivmedel/drivmedelspriser/
- Preem business list prices: https://www.preem.se/foretag/listpriser/
- Preem Medlem: https://www.preem.se/medlem-och-kort/
- Preem Mastercard: https://www.preem.se/medlem-och-kort/preem-mastercard/
- Preem station offers: https://www.preem.se/pa-stationen/erbjudanden/
- Too Good To Go at Preem: https://www.preem.se/pa-stationen/too-good-to-go/

## Findings

1. Online vs in-store
   - Preem does not publish a consumer online fuel price list. The private fuel price page says current petrol and diesel prices are on the station price sign and that fuel pricing is local, so consumer pump prices must be treated as store/station-scoped rows.
   - No Preem source checked shows consumer online ordering prices for fuel or convenience goods. Do not emit online/store paired rows for Preem consumer fuel.

2. Loyalty program
   - Preem Medlem is the consumer loyalty program. The Preem Medlem page lists 25 öre/liter fuel discount at staffed stations with Preem Mastercard, 15 öre/liter at staffed stations with Preem Privatkort or a connected payment card, and 10 öre/liter at automatic stations.
   - Connector action: `parsePreemSeMemberFuelDiscounts` emits consumer `member_discount` rows with `isMemberPrice: true`, `stationFormat`, `requirement`, and `discountAmount` in SEK/l.

3. Format / sub-brand
   - Consumer fuel station formats matter for member discounts: staffed station discount amounts differ from automatic station discount amounts.
   - Business list prices for Företagskort/Transportkort and Truckkort explicitly apply regardless of country location or facility type. Connector action: business list-price rows carry `priceScope: 'national_business_list'` and `discountBasis: 'pre_discount_list_price'`.

4. Region / store-cluster
   - Consumer fuel pricing is local and can vary by station according to Preem's private fuel-price page. A consumer pump-price connector must tag station/store rows with the station id and region metadata.
   - Business list-price rows are national list prices; no regional field is emitted for those rows.

5. Subscription / membership-required pricing
   - No paid subscription price was found in the checked Preem sources. Preem Medlem is described as free membership.
   - Connector action: emitted Preem rows set `isSubscriptionPrice: false`.

6. App-only / coupon-required prices
   - Preem Medlem mentions Preempris on EV charging in the app and digital stamp cards in the Preem app. The station-offers page also instructs customers to show a QR code in the app for current offers.
   - The checked sources do not expose a machine-readable feed for all app QR offers. Do not infer coupon rows from fuel list prices. A future convenience-offer connector should emit `isCouponPrice: true` for QR/app-required station offers.

7. Time-of-day or close-to-close clearance
   - Preem's Too Good To Go page says selected stations can have surplus products at reduced prices through the Too Good To Go app and that availability varies day to day.
   - This is app-mediated surplus food, not a verified daily Preem-wide close-to-close rule. Do not mark Preem fuel/list rows as clearance. A Too Good To Go integration can use `isClearance: true` only for concrete station surplus rows from that app/source.

8. Bulk / volume pricing tiers
   - Preem publishes business bulk list prices for delivery/pickup customers on the business list-price page.
   - No source-backed consumer "buy N for price X" fuel tier was found. The connector keeps bulk as `listPriceKind: 'bulk'`, not a consumer `multiBuy` promotion.

9. Service-counter vs packaged
   - The checked Preem pages for fuel, member discounts, station offers, and Too Good To Go do not show service-counter vs packaged price splits.
   - Connector action: no `counter` channel rows are emitted.

10. B2B / wholesale split
   - Preem publishes separate business list prices for Företagskort/Transportkort, Truckkort, Bulk, and EV charging.
   - Connector action: `parsePreemSeBusinessListPrices` emits only business list-price rows and rejects consumer pump URLs.

## Connector mapping

- Business list prices: `channel: 'business_list'`, `customerSegment: 'business'`, `listPriceKind`, `priceScope: 'national_business_list'`, `discountBasis: 'pre_discount_list_price'`.
- Consumer member fuel discounts: `channel: 'member_discount'`, `customerSegment: 'consumer'`, `isMemberPrice: true`, `stationFormat`, `requirement`, `discountAmount`, `discountUnit: 'SEK/l'`.
- All rows added or changed in this ticket set `isSubscriptionPrice: false`, `isCouponPrice: false`, `isClearance: false`, and `multiBuy: null` because the source-backed rows are not subscription, coupon, clearance, or multi-buy price rows.
