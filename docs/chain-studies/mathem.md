# Mathem pricing quirks (SE)

Primary source scope: mathem.se product/discount pages and Mathem support pages reviewed on 2026-05-25.

## Verified quirks

### Online-only grocery channel

Mathem's help page says shopping is done online or in the app, and the home-delivery page describes delivery to the customer's door rather than physical-store shopping. No physical store shelf price was verified.

Connector impact: Mathem product rows emit `channel: 'online'`. No store row is emitted without a verified store price.

### Delivery time, address, and fees affect the order, not product rows

Mathem support says product availability and prices are updated after the customer chooses a delivery time. Delivery fees can vary by delivery time, delivery method, interval length, and delivery address; the home-delivery page gives delivery-fee ranges from 0 kr upward, highest 99 kr for normal delivery and 29-119 kr for same-day delivery. Small-basket fees can also apply.

Connector impact: product rows keep product prices only. Delivery fees are order-level charges and are not emitted as product prices.

### Coupon / rabattkod pricing

Mathem support documents rabattkod entry in the cart and says only one code can be used per order. Coupon prices are therefore order/cart-level unless the product payload explicitly marks a product as coupon-required.

Connector impact: payloads that identify coupon-required product pricing emit `is_coupon_price: true`.

### Discount and multi-buy promotions

Mathem's `Extrapris` pages show discounted products with current and previous prices, labels such as `Extrapris`, `Klipp`, and `Prismatch`, and volume mechanics such as `2 för 39 kr`, `2 för 32 kr`, and `4 för 65 kr`. Some discounted products show customer limits, for example `Max 3 per kund`.

Connector impact: keep `price` as the current online price and preserve explicit volume mechanics in `multi_buy` when the page payload includes them. Clearance-like labels such as `Klipp`, `utförsäljning`, or `kort datum` emit `is_clearance: true`.

### Subscription / tier pricing

The reviewed Mathem sources did not verify a product-price subscription tier. The `gratis leverans` page documents a new-customer free-delivery benefit for up to about three months when ordering 800 kr or more at least every other week, but that is a delivery-fee benefit rather than a product unit price.

Connector impact: `is_subscription_price` remains false unless a product payload explicitly marks a subscription/tier price.

## Not verified from mathem.se in this study

- In-store prices: no physical-store prices were verified.
- Loyalty-member product prices: no Mathem-owned loyalty product price was verified.
- Format or sub-brand price levels: no chain formats were verified.
- Region-specific product prices: delivery availability/fees vary by address, but no regional product unit price field was verified in the connector payload.
- App-only product prices: shopping can happen in app, but no app-only product price was verified.
- Service-counter vs packaged prices: no counter/package channel split was verified.
- B2B / wholesale split: support notes company-customer fees can be higher, but no mixed consumer/B2B product price was verified for this connector.
