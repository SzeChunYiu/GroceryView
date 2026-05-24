# Atlantsolía pricing quirks (IS)

Primary sources checked:

- Atlantsolía Dælulykill: https://www.atlantsolia.is/daelulykill/
- Atlantsolía discounts: https://www.atlantsolia.is/daelulykill/afslattur-og-allskonar/
- Atlantsolía business solutions: https://www.atlantsolia.is/fyrirtaekjalausnir/
- Atlantsolía stations: https://www.atlantsolia.is/stodvar/

## Codified connector fields

`packages/ingestion/src/connectors/atlantsolia-is.ts` emits the verified Dælulykill/applykill fuel discount as a member-price quirk row:

- `channel: "store"` because the discount source says the Dælulykill/applykill discount applies at AO fuel stations.
- `loyaltyProgram: "Dælulykill/applykill"` because the source names those two access methods.
- `isMemberPrice: true` and `discountPerLitre: 11` because the source states the Dælulykill and applykill give an 11 kr discount.
- `excludedFormats: ["Bensínsprengjustöðvar"]` because the source states those stations already have the lowest price and no discount.

## Quirk checklist

1. **Online vs in-store**
   - Verified: the sources cover station fueling and app/key access for station purchases.
   - Not codified as an online price: no listed Atlantsolía source publishes a separate online fuel price point.

2. **Loyalty program**
   - Verified: Dælulykill/applykill gives an 11 kr discount at AO fuel stations.
   - Verified exception: Bensínsprengjustöðvar are excluded because they already have the lowest price and no discount.
   - Connector impact: emits one `isMemberPrice:true` quirk row with `discountPerLitre: 11` and the excluded format.

3. **Format / sub-brand**
   - Verified: Bensínsprengjustöðvar are a named station format for which the Dælulykill/applykill discount does not apply.
   - Connector impact: the excluded format is surfaced in `excludedFormats`.

4. **Region / store-cluster**
   - Verified: the listed sources do not publish a region-specific fuel price difference.
   - Connector impact: no region price row is emitted.

5. **Subscription / membership-required pricing**
   - Verified: the Dælulykill/applykill discount requires the key/app access method.
   - Connector impact: the row is member-priced, but no subscription price row is emitted because no paid subscription terms were found in the listed sources.

6. **App-only / coupon-required prices**
   - Verified: applykill is named alongside Dælulykill for the 11 kr discount.
   - Connector impact: the row records the loyalty program name; no coupon row is emitted because the source does not describe a coupon code.

7. **Time-of-day or close-to-close clearance**
   - Verified: the listed sources do not publish a time-of-day fuel discount pattern.
   - Connector impact: no clearance row is emitted.

8. **Bulk / volume pricing tiers**
   - Verified: the business-solutions source confirms Atlantsolía serves companies.
   - Connector impact: no multi-buy station row is emitted because the listed sources do not publish a "buy N+" fuel tier.

9. **Service-counter vs packaged**
   - Verified: Atlantsolía is covered here as a fuel chain, and the listed sources do not publish supermarket counter/packaged prices.
   - Connector impact: no counter/packaged row is emitted.

10. **B2B / wholesale split**
    - Verified: Atlantsolía has company solutions pages.
    - Connector impact: no B2B price row is emitted because the listed sources do not publish a concrete business fuel price point.
