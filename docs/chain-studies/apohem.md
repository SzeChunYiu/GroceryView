# Apohem pricing quirks (SE)

Primary sources: Apohem pages for [Om oss](https://www.apohem.se/om-oss), [Prissättning](https://www.apohem.se/prissattning), [Medlemsvillkor](https://www.apohem.se/medlemsvillkor), [Rabattkod](https://www.apohem.se/rabattkod), [Veckans erbjudanden](https://www.apohem.se/erbjudande), and public Apohem listing/product pages.

## 1. Online vs in-store

Apohem describes itself as a `nätapotek` founded in 2019 and says customers order through Apohem online. No Apohem source listed above documents physical consumer stores or store-specific shelf prices. The connector therefore emits Apohem rows with `channel: 'online'` only and does not fabricate store rows.

## 2. Loyalty program

The loyalty program is `Club Apohem`. Apohem says membership is free, signup is on apohem.se, and applicants provide a personal identity number and verify with BankID. Club Apohem has four levels: Newbie, Expert, Genius, and Guru. Members earn 1 bonus point per krona on Apohem purchases, excluding prescription medicines, gift cards, freight fees, and purchases paid with bonus checks. At 1500 bonus points Apohem issues a 25 kr bonus check valid for 60 days.

Apohem's pricing page defines `Club Deal` as the member price paid by a logged-in Club Apohem member and `Ej medlem` as the non-member price. Public offer pages show concrete Club Deal examples, including SWEED Serum 5 ml with `487 kr` and `Ej medlem 695 kr`, and BioSalma Kreatin Monohydrat 500g with `149 kr` and `Ej medlem 186 kr`. The connector emits a member-price row with `is_member_price: true` and a non-member row with `is_member_price: false` when the source payload exposes distinct `member` and `nonMember` prices.

## 3. Format / sub-brand

No listed Apohem source documents separate Apohem physical store formats or sub-brand price levels. No `format` field is emitted.

## 4. Region / store-cluster

No listed Apohem source documents region- or store-cluster-specific consumer prices. The connector does not emit region tags for Apohem.

## 5. Subscription / membership-required pricing

Club Apohem member pricing is documented above. No listed Apohem source documents a separate paid subscription that unlocks product prices, so the connector does not emit `is_subscription_price` for Apohem.

## 6. App-only / coupon-required prices

Apohem's rabattkod page documents checkout discount codes, including examples such as `BABY15`, `EXTRA10`, and `MAJ20`, and says discount codes are entered in checkout. Apohem listing pages also show app-only messaging such as `20% i appen vid köp över 499 kr med kod: APP20` and `Gäller bara i appen WOW Deal`. These are verified at campaign/page level, but the current connector payload does not expose a per-product coupon price row that can be safely tied to a specific SKU. The connector therefore skips `is_coupon_price` rows until product-level coupon data is present.

## 7. Time-of-day or close-to-close clearance

No listed Apohem source documents a recurring evening, late-store, or close-to-close clearance pattern. The connector does not emit `is_clearance`.

## 8. Bulk / volume pricing tiers

Apohem public pages include campaign text such as `Köp 2 få 1` and `10 kr/st på utvalt`. The listed sources do not expose a stable per-SKU quantity tier in the connector payload. The connector does not emit `multi_buy` rows until the source payload exposes product-level tier terms.

## 9. Service-counter vs packaged

Apohem is documented as an online pharmacy. No listed Apohem source documents service-counter pricing. The connector emits no `counter` channel.

## 10. B2B / wholesale split

No listed Apohem source documents a consumer-visible B2B or wholesale price split mixed into the Apohem retail inventory. This remains out of scope for the consumer connector.
