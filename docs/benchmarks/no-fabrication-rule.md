# No fabrication rule for benchmarks

This registry follows `docs/PROJECT_STANDARDS.md`: do not fabricate price values, index values, history, deltas, or confidence scores.

Fabrication examples in this context:

- inventing a CPI or HICP value for a month that has not been ingested;
- interpolating between monthly releases and presenting it as official data;
- showing TLV or NOMA regulated references as retail pharmacy shelf prices;
- showing EU agri-food upstream prices as supermarket prices;
- marking a source `live` when it is only `registry_only`.
