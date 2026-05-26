# Iceland fuel chain notes

Study note date: 2026-05-25.

GroceryView keeps Iceland fuel observations in the fuel domain rather than the grocery basket domain. N1 public fuel-price evidence is documented in the connector note:

- [N1 IS connector notes](../connectors/n1-is.md)

The N1 connector reads the public operator fuel-price page, extracts ordinary petrol and diesel table rows, excludes colored diesel, and records `ISK/l` provenance with the source URL and parser version.

## Related Swedish fuel connector notes

GroceryView also documents Swedish fuel station-location evidence separately from pump prices:

- [Circle K SE connector notes](../connectors/circle-k-se.md)

The Circle K Sweden connector note covers the Overpass `amenity=fuel` source, extracted station fields, and guardrails that prevent station-location rows from being rendered as current pump prices.

