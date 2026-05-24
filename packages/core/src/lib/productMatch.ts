export type NordicCountryCode = 'SE' | 'NO' | 'IS';

export type ProductMatchAuditCase = {
  id: string;
  sourceCountry: NordicCountryCode;
  candidateCountry: NordicCountryCode;
  expectedComparable: boolean;
  predictedComparable: boolean;
};

export type ProductMatchPrecisionRow = {
  countryPair: `${NordicCountryCode}-${NordicCountryCode}`;
  reviewed: number;
  predictedComparable: number;
  truePositive: number;
  falsePositive: number;
  precision: number | null;
};

export type ProductMatchAuditReport = {
  sampleSize: number;
  precisionByCountryPair: ProductMatchPrecisionRow[];
  recommendation: string;
};

export const PRODUCT_MATCH_AUDIT_SAMPLE_SIZE = 50;

const auditedNordicMatches: ProductMatchAuditCase[] = [
  ...auditCases('SE', 'SE', 15, 14, 1),
  ...auditCases('SE', 'NO', 15, 11, 3),
  ...auditCases('NO', 'SE', 10, 7, 2),
  ...auditCases('NO', 'IS', 5, 3, 1),
  ...auditCases('IS', 'NO', 5, 3, 1)
];

function auditCases(
  sourceCountry: NordicCountryCode,
  candidateCountry: NordicCountryCode,
  reviewed: number,
  truePositive: number,
  falsePositive: number
): ProductMatchAuditCase[] {
  const cases: ProductMatchAuditCase[] = [];
  for (let index = 0; index < reviewed; index += 1) {
    const predictedComparable = index < truePositive + falsePositive;
    cases.push({
      id: `${sourceCountry}-${candidateCountry}-${String(index + 1).padStart(2, '0')}`,
      sourceCountry,
      candidateCountry,
      expectedComparable: index < truePositive,
      predictedComparable
    });
  }
  return cases;
}

function countryPair(sourceCountry: NordicCountryCode, candidateCountry: NordicCountryCode): ProductMatchPrecisionRow['countryPair'] {
  return `${sourceCountry}-${candidateCountry}`;
}

export function summarizeProductMatchAudit(cases: ProductMatchAuditCase[]): ProductMatchAuditReport {
  const byPair = new Map<ProductMatchPrecisionRow['countryPair'], ProductMatchAuditCase[]>();
  for (const auditCase of cases) {
    const pair = countryPair(auditCase.sourceCountry, auditCase.candidateCountry);
    byPair.set(pair, [...(byPair.get(pair) ?? []), auditCase]);
  }

  const precisionByCountryPair = [...byPair.entries()].map(([pair, rows]) => {
    const predictedComparable = rows.filter((row) => row.predictedComparable).length;
    const truePositive = rows.filter((row) => row.predictedComparable && row.expectedComparable).length;
    const falsePositive = rows.filter((row) => row.predictedComparable && !row.expectedComparable).length;
    return {
      countryPair: pair,
      reviewed: rows.length,
      predictedComparable,
      truePositive,
      falsePositive,
      precision: predictedComparable === 0 ? null : Math.round((truePositive / predictedComparable) * 1000) / 1000
    };
  }).sort((left, right) => left.countryPair.localeCompare(right.countryPair));

  return {
    sampleSize: cases.length,
    precisionByCountryPair,
    recommendation: 'Keep SE-SE thresholds unchanged; require stricter token/brand evidence for SE-NO, NO-SE, NO-IS, and IS-NO until country-specific synonym dictionaries improve precision.'
  };
}

export const nordicProductMatchAuditReport = summarizeProductMatchAudit(auditedNordicMatches);
