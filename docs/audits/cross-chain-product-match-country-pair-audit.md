# Cross-chain product match country-pair audit

Date: 2026-05-25.

Scope: `classifyProductMatch` in `packages/core/src/index.ts`. The requested `packages/core/src/lib/productMatch.ts` file is not present on this branch.

## Method

Added `auditProductMatchPrecisionByCountryPair`, which takes reviewed product-pair samples, deterministically samples up to 50 by seed, classifies each pair with the existing matcher, and reports precision per directional country pair.

The checked-in audit fixture uses 50 Nordic product-pair reviews across SE, NO, and IS. It includes normal same-category matches plus reviewed false-match controls where language or naming can make Norwegian and Swedish rows look comparable even when they are not.

## Report

| Country pair | Reviewed samples | Predicted matches | False positives | Precision | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| IS-NO | 5 | 4 | 0 | 1.00 | keep threshold |
| IS-SE | 6 | 6 | 0 | 1.00 | keep threshold |
| NO-IS | 5 | 5 | 1 | 0.80 | tighten country-pair review |
| NO-SE | 10 | 9 | 1 | 0.89 | tighten country-pair review |
| SE-IS | 8 | 6 | 0 | 1.00 | keep threshold |
| SE-NO | 16 | 14 | 2 | 0.86 | tighten country-pair review |

## Follow-up tuning target

The audit report keeps exact barcode/package matches high-confidence, but it gives Nordic cross-country reviewers a per-pair precision gate. SE-NO, NO-SE, and NO-IS samples fall below the 0.90 precision floor in the fixture and should require more review before accepting broad fuzzy category/package matches.
