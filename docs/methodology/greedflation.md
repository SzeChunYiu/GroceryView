# Greedflation detector methodology

The detector is a margin-trend screen, not an accusation. It compares the percentage change in observed retail price with the percentage change in a supplier-cost proxy for the same chain/product window.

`excessMarginTrendPercent = retailChangePercent - supplierCostProxyChangePercent`

A row is flagged when the excess trend is at least the configured threshold, defaulting to 5 percentage points. Rows with invalid or zero starting values are treated as 0% change rather than inferred. The UI must show the retail window, proxy source, threshold, and this caveat next to any flag.
