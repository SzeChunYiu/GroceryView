# Apohem pricing quirks (SE)

Primary source scope: apohem.se pages reviewed on 2026-05-25.

## Verified quirks

### Online-only channel

Apohem presents itself as an online pharmacy (`apohem.se`) and the ticket source scope is the Apohem online pharmacy. The product and campaign pages reviewed expose online stock/delivery and checkout flows, not physical store prices. No separate in-store price was verified.

Connector impact: Apohem rows are emitted with `channel: 'online'`. No store row is emitted because no store price exists in the verified source pages.

### Club Apohem member pricing and offers

Apohem's membership terms identify the loyalty program as `Club Apohem`. Membership is free, registration is done on apohem.se, and applicants provide a personal identity number and verify with BankID. The terms say members get member offers, personal offers, event invitations, and levels: Newbie (0-1499 points), Expert (1500-3499), Genius (3500-5999), and Guru (6000+).

The rabattkod page says new Club Apohem members receive 15% off their first purchase when shopping for 299 kr. The `Livsnjutarrabatt` campaign says members aged 60+ receive 10% off and double bonus points, activated in checkout while logged in.

Connector impact: payloads labeled `Club Apohem`, `Club Deal`, `medlem`, or equivalent member-offer text should emit `is_member_price: true`.

### Coupon / rabattkod pricing

The rabattkod page documents coupon codes including `BABY15`, `EXTRA10`, and `MAJ20`. It also explains that most monthly campaign prices require no code, while coupon codes are entered in checkout and have their own conditions. Examples on Apohem listing pages show product labels such as `20% MAJ20`.

Connector impact: payloads that identify a coupon code or coupon-required price should emit `is_coupon_price: true`.

### Deal / Nice Price / previous-price promotions

Apohem documents price-reference labels in FAQ: ordinary price, lowest price, Club Deal, Deal, and Nice Price. Product/listing examples show `Deal`, `Nice Price`, and ordinary-price text (`Ord.pris`) alongside discounted current prices. The connector already stores the current price and previous/original price when present.

Connector impact: keep `price` as the current online price and `originalPrice` as the previous/ordinary price when supplied by the page payload.

### Bulk / volume labels

Apohem pages use explicit offer labels on products and campaigns. No durable page in this study verified a specific Apohem `N for X kr` item, but if the page payload exposes a label such as `2 för`, `3 för 2`, or `% vid köp av N`, that label is a product-level promotion rather than a separate store price.

Connector impact: preserve those labels in `multi_buy` when they are present in the payload.

## Not verified from apohem.se in this study

- Online vs in-store deltas: no physical-store prices were verified.
- Format or sub-brand price levels: no sub-brand formats were verified.
- Region or store-cluster price differences: no regional prices were verified.
- Paid subscription pricing: no subscription that unlocks product prices was verified.
- Daily time-of-day or close-to-close clearance: no recurring time-of-day clearance was verified.
- Service-counter vs packaged prices: not applicable to verified Apohem pages.
- B2B / wholesale split: no mixed consumer/B2B inventory prices were verified.
