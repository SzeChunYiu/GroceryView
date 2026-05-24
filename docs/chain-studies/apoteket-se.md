# Apoteket SE pricing quirks (primary-source study)

Sources used: apoteket.se product pages and Apoteket+ pages, checked 2026-05-24.

## Codified quirks

1. **Online vs in-store prices are real.** Product pages expose a current online/web price and a separate `Butikspris`. Example: Apoteket Snabbförband S 5 x 7,2 cm shows `Webbpris` 25 kr and `Butikspris` 35 kr on the same Apoteket product page: https://www.apoteket.se/produkt/apoteket-sterilt-snabbforband-5-st-ask-243175/. Apoteket Baby 2-i-1 rengöring shows online 29,25 kr and `Butikspris` 39 kr: https://www.apoteket.se/produkt/apoteket-baby-2-i-1-rengoring-200-ml-tub-1028996/. The connector therefore emits separate `channel:'online'` and `channel:'store'` rows when both prices exist. Largest verified deltas in this study came from non-prescription own-brand baby/children, sun-care, and wound-care examples (25 kr vs 35 kr, 29,25 kr vs 39 kr, 119 kr vs 159 kr); Apoteket does not expose a complete public ranking on the cited pages.
2. **Apoteket+ loyalty prices and bonus exist.** Apoteket's customer club is named Apoteket+. The official customer-club page says membership gives bonus checks, personal offers, plus points, and member prices; the benefits table lists bonus levels 2%, 2.2%, and 2.3%, and says members aged 65+ receive 5% every day both on apoteket.se and in Apoteket's 400 pharmacies: https://www.apoteket.se/apotekets-kundklubb/. The member-offers page says member offers require login: https://www.apoteket.se/kategori/erbjudanden/medlemserbjudanden/. The connector marks rows as `is_member_price:true` only when the page text includes a member-price/member-offer marker.
3. **Coupon/member campaign prices exist.** The official Medlemsdagar page says online discounts require code `MEDLEM` and states online threshold discounts of 15%, 20%, and 25%; it also states store terms separately: https://www.apoteket.se/kampanj/medlemsdagar/. The connector sets `is_coupon_price:true` when a page contains an explicit `Kod:` marker.
4. **Bulk / volume pricing tiers exist.** Apoteket product and campaign pages show tiers such as `20% vid köp av 2`; examples include Apoteket Sårtvätt spray and Apoteket Elastisk Gasbinda product pages: https://www.apoteket.se/produkt/apoteket-sartvatt-spray-100-ml-1579457/ and https://www.apoteket.se/produkt/apoteket-elastisk-gasbinda-2-st-1234006/. The connector emits `multi_buy` with quantity and discount percent when this text is present.

## Not codified without a concrete product/store example

- **Format/sub-brand price levels:** Apoteket pages in this study identify Apoteket AB and Apoteket+; no page cited a format such as Maxi/Nära equivalent with a separate price. Connector `format` remains `null`.
- **Region or store-cluster pricing:** Product pages show `Ingen vald butik` / `Välj apotek` for stock checks and a single `Butikspris`; no cited page showed a Stockholm/Norrland or other regional price. Connector `storeId` and `regionTag` remain `null` until a selected-store price source is added.
- **Subscription-required pricing:** The cited Apoteket+ membership is free, and no paid subscription price was found on the listed sources. Connector `is_subscription_price` remains `false`.
- **Time-of-day / close-to-close clearance:** No official daily evening clearance pattern was found on the cited pages. Connector `is_clearance` remains `false`.
- **Service-counter vs packaged:** Apoteket product pages in this study are packaged pharmacy/product pages; no service-counter price source was found. The connector supports the channel type but does not emit `counter` rows.
- **B2B / wholesale split:** Apoteket links to healthcare/company pages, but the cited consumer product pages do not mix B2B rates into consumer inventory. B2B pricing stays out of scope.
