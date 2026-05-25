# Kronans Apotek SE pricing quirks

Last checked: 2026-05-25. Sources are first-party Kronans Apotek pages only.

## Sources checked

- Purchase terms: https://www.kronansapotek.se/villkor/kopvillkor/
- Club terms: https://www.kronansapotek.se/villkor/medlemsvillkor/
- Customer club explainer: https://www.kronansapotek.se/kundservice/startsida-kundklubb/
- Senior Tuesday offer terms: https://www.kronansapotek.se/erbjudanden/villkor/
- Member-price offer page: https://www.kronansapotek.se/erbjudanden/alltid-hos-oss/
- Discount-code page: https://www.kronansapotek.se/erbjudanden/rabattkoder/
- Kronans own-brand campaign page: https://www.kronansapotek.se/erbjudanden/kronansapotek-klipp/

## Codified quirks

1. **Online channel is explicit, and online/store prices can differ.** The purchase terms say web/app purchases are consumer sales through `kronansapotek.se` or the app, prices are in SEK including VAT, and campaign prices can differ online and in stores. Product listing pages label examples as `Pris online` or `Kampanjpris online`, so the connector emits `channel: 'online'` for those rows. No store-specific product price example was available in the checked sources, so the connector does not emit store rows.
2. **Member prices are selected, not every item.** The member-price page says club members get selected products at extra good prices in apotek and online. Rows parsed from that page emit `is_member_price: true`.
3. **Club bonus is points, not an immediate item discount.** Club terms state that qualifying purchases earn 1 point per paid krona and that 1000 points becomes 20 SEK bonus at payout times. Prescription products, services, and high-cost-protection products do not earn bonus. The connector keeps this as documentation only because the checked sources did not attach a per-product bonus price.
4. **Senior Tuesday is a recurring member discount.** The Seniorfest terms state that members over 65 receive 15% discount every Tuesday in physical apotek and online, with exclusions for prescription/prescribed goods, infant formula, The Ordinary, services, and already discounted goods. The checked sources did not expose product-level senior prices, so the connector does not emit senior-discount rows.
5. **Coupon prices exist online.** The discount-code page says current codes can be used online at checkout and do not apply to medicines or already discounted products. The checked sources did not expose a concrete product+code price, so the connector does not emit coupon rows.
6. **Multi-buy mechanics are first-party.** The purchase terms define 3-for-2 campaigns as cheapest item free. The member-price page exposes product examples such as `2 för 20:-` and `2 för 140:-`; the connector emits `multi_buy` when a listing row includes that evidence.
7. **Campaign/original price pairs are first-party.** The own-brand campaign page exposes `Kampanjpris online` plus `Tidigare pris` examples; the connector emits `original_price_sek` only when both values are present in the source row.

## Checked but not codified

- **Format or sub-brand pricing:** the checked sources do not show Kronans store-format price levels.
- **Region or store-cluster pricing:** the checked sources do not show regional price deltas or store-cluster price examples.
- **Subscription-required pricing:** the checked sources do not show a Kronoval or other subscription price program. The source-backed program is Klubb Kronans Apotek.
- **Time-of-day / close-to-close clearance:** the checked sources do not show daily clearance pricing.
- **Service-counter vs packaged:** the checked sources do not show service-counter pricing.
- **B2B / wholesale split:** the checked consumer sources include a discount-code page and shopping terms; they do not expose consumer product rows with separate B2B prices.
