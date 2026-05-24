# OKQ8 fuel pricing quirks (SE)

Primary sources checked:

- OKQ8 företagspriser: https://www.okq8.se/foretag/priser/
- OK membership overview: https://www.okq8.se/medlem/
- OKQ8 business overview: https://www.okq8.se/foretag/
- OKQ8 station overview: https://www.okq8.se/pa-stationen/

## Codified connector fields

`packages/ingestion/src/connectors/okq8-fuel.ts` emits the OKQ8 public business fuel price table with:

- `customerSegment: "business"` because the source page says the listed prices are current prices for business customers.
- `channel: "store"` because the table section is "Drivmedel på station" and applies to fueling at OKQ8/Tanka/St1 BioGas stations.
- `storeRegion: "SE-national"` because OKQ8 states the same business price applies from north to south, including staffed and unmanned stations, except for AdBlue, vehicle gas, and alkylate petrol.

## Quirk checklist

1. **Online vs in-store**
   - Verified: the source distinguishes business prices on the website from the private-customer prices shown on station and pump signs.
   - Not codified as a second row: the OKQ8 source does not publish the private pump price table on the listed source page, so the connector cannot emit a verified private/store-sign price point.

2. **Loyalty program**
   - Verified: OK membership includes monthly member offers, annual patronage/återbäring, and a reward after every sixth registered in-store purchase.
   - Verified exclusion: the sixth-purchase reward text excludes fuel.
   - Connector impact: no `is_member_price:true` fuel row is emitted because no concrete OKQ8 fuel member price was found in the listed sources.

3. **Format / sub-brand**
   - Verified: the business fuel price page says the listed prices apply at OKQ8, Tanka, and St1 BioGas, and that staffed vs unmanned stations have the same price for the covered fuels.
   - Connector impact: no `format` split is emitted because the source states no format price split for the covered fuels.

4. **Region / store-cluster**
   - Verified: OKQ8 states the same business fuel price applies from north to south.
   - Connector impact: rows emit `storeRegion: "SE-national"` instead of store-specific regional pricing.

5. **Subscription / membership-required pricing**
   - Verified: the listed sources do not publish a consumer fuel subscription price.
   - Connector impact: no subscription price row is emitted.

6. **App-only / coupon-required prices**
   - Verified: OKQ8 promotes the app for payment and member offers, but the listed sources do not publish a concrete app-only or coupon-only fuel price.
   - Connector impact: no coupon price row is emitted.

7. **Time-of-day or close-to-close clearance**
   - Verified: the business price page states the price applies all day, 00:00-24:00.
   - Connector impact: no clearance flag is emitted.

8. **Bulk / volume pricing tiers**
   - Verified: OKQ8 has separate business bulk fuel services and says companies using less than 50,000 litres per year can order online.
   - Connector impact: no consumer station multi-buy row is emitted because the listed station price table does not publish a "buy N+" fuel tier.

9. **Service-counter vs packaged**
   - Verified: this fuel connector covers fuel grades only. The listed OKQ8 sources do not publish a counter-vs-packaged fuel distinction.
   - Connector impact: no counter/packaged channel row is emitted.

10. **B2B / wholesale split**
    - Verified: OKQ8 publishes business fuel prices and has separate business fuel/bulk offerings.
    - Connector impact: the connector marks the public price rows as `customerSegment: "business"`; deeper B2B negotiated prices remain out of scope because the source page does not publish account-specific terms.
