# Kronans Apotek SE pricing quirks

Primary sources checked: Kronans Apotek `köpvillkor`, `erbjudanden`, `rabattkoder`, `kundklubb`, `klubberbjudande`, senior terms, store-finder, and store detail pages on kronansapotek.se.

## Codified connector fields

| Quirk | Verifiable source claim | Connector behavior |
| --- | --- | --- |
| Online price channel | Product tiles on offer/category pages label rows as `Pris online` or `Kampanjpris online`; the purchase terms state that prices can differ online and in store. Example source pages: `https://www.kronansapotek.se/erbjudanden/`, `https://www.kronansapotek.se/villkor/kopvillkor/`. | Emit `channel:'online'` for online product rows; emit `channel:'store'` only when a store-specific source row is present. |
| Kundklubben member prices | The customer club page names `Kundklubben` and says members get bonus and offers. The member-offer page says members get exclusive offers and better prices on selected products both in apotek and online. Example: Kronans Apotek Linsvätska Allt-i-ett 355 ml appears under `För våra klubbmedlemmar` with `2 för 140:-` and `Pris online 79 kr`. | Emit `is_member_price:true` for rows sourced from member-only offer surfaces. |
| Senior member discount | Senior terms state members over 65 get 15% senior discount every Tuesday in physical apotek and online, with exclusions. Source: `https://www.kronansapotek.se/erbjudanden/villkor-seniortisdag/`. | Treat as member-price metadata when a captured row explicitly comes from that surface; do not apply globally. |
| Coupon/rabattkod | The rabattkoder page says online discount codes are entered at checkout and do not apply to medicines or already discounted products. Source: `https://www.kronansapotek.se/erbjudanden/rabattkoder/`. | Emit `is_coupon_price:true` only for coupon-code rows. |
| Multi-buy | Offer pages expose multi-buy labels such as `Köp 2 få 25%`, `3 för 2`, and member examples such as `2 för 140:-`. Sources: `https://www.kronansapotek.se/erbjudanden/`, `https://www.kronansapotek.se/erbjudanden/klubberbjudande/`. | Emit `multi_buy:{quantity,price,label}` when the observed label gives a quantity and total price. |
| Store / region tag | Store finder lists Kronans Apotek in Swedish counties and store detail pages expose branch addresses, e.g. Arvidsjaur and Stockholm Renstiernas gata. Sources: `https://www.kronansapotek.se/store-finder/`, store detail pages. | Pass through `store_id` and `region` when a store-specific row is captured; do not infer regional price differences from locator pages alone. |

## Not codified from this study

- `Kronoval` subscription pricing: no Kronans Apotek consumer price page for a `Kronoval` subscription discount was verifiable from the listed source domain during this study. The connector records this as not verified and does not emit `is_subscription_price:true` from the current evidence.
- Format/sub-brand price levels: no ICA-style format split for Kronans Apotek was visible on the checked primary-source pages.
- Time-of-day or close-to-close clearance: no daily evening clearance rule was found on the checked primary-source pages.
- Service-counter vs packaged pricing: not applicable to the checked pharmacy offer surfaces.
- B2B/wholesale split: the separate `foretag.kronansapotek.se` surface exists for business customers, but no mixed consumer inventory price row was verified, so it stays out of the consumer connector.
