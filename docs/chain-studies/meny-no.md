# MENY Norway public product and offer source

- Source surfaces reviewed on 2026-05-25: `https://meny.no/`, `https://meny.no/varer`, `https://meny.no/varer/tilbud`, `https://meny.no/personvern/betingelser`, and `https://meny.no/personvern/bruk-av-cookies`.
- Public catalogue and offer pages render browseable shells for `Nettbutikk` and `Tilbud`, but visible product rows are client-loaded. Parser fixtures therefore use recorded public HTML/JSON payloads and do not call logged-in, cart, checkout, Trumf, or customer-specific endpoints.
- MENY documents session, anti-forgery, login, anonymous store-selection, cart, search-history, and offer-filter cookies. The connector treats this as an access boundary: anonymous public product/offer evidence is allowed for fixtures, while user/account/cart state is out of scope.
- Product rows map to `country=NO`, `currency=NOK`, `chain=meny-no`, `market=norway_grocery`, and `sourceType=product_search`.
- Online availability is emitted only when a public product payload exposes availability/stock text or booleans. Otherwise `onlineAvailability` remains `unknown`.
- Offer validity is parsed from public product payload fields when present; weekly flyer validity remains covered by `meny-flyer-no`.
