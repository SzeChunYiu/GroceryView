export type CertificationCode =
  | 'krav'
  | 'eu_eko'
  | 'fairtrade'
  | 'msc'
  | 'asc'
  | 'rainforest_alliance'
  | 'antibiotic_free';

export type CertificationLevel = 'none' | 'single' | 'multi';

export type CertificationDetail = {
  code: CertificationCode;
  label: string;
  matchedText: string;
};

export type CertificationExtraction = {
  cert_level: CertificationLevel;
  cert_details: CertificationDetail[];
};

type CertificationPattern = {
  code: CertificationCode;
  label: string;
  patterns: RegExp[];
};

const CERTIFICATION_PATTERNS: CertificationPattern[] = [
  {
    code: 'krav',
    label: 'KRAV',
    patterns: [/\bkrav(?:[-\s]?m[aä]rkt)?\b/iu]
  },
  {
    code: 'eu_eko',
    label: 'EU-Eko',
    patterns: [/\beu[-\s]?eko\b/iu, /\beu[-\s]?ekologisk\b/iu, /\beu organic\b/iu]
  },
  {
    code: 'fairtrade',
    label: 'Fairtrade',
    patterns: [/\bfair\s*trade\b/iu, /\bfairtrade\b/iu]
  },
  {
    code: 'msc',
    label: 'MSC',
    patterns: [/\bmsc\b/iu, /\bmarine stewardship council\b/iu]
  },
  {
    code: 'asc',
    label: 'ASC',
    patterns: [/\basc\b/iu, /\baquaculture stewardship council\b/iu]
  },
  {
    code: 'rainforest_alliance',
    label: 'Rainforest Alliance',
    patterns: [/\brainforest\s+alliance\b/iu]
  },
  {
    code: 'antibiotic_free',
    label: 'Utan antibiotika',
    patterns: [/\butan\s+antibiotika\b/iu, /\bantibiotic[-\s]?free\b/iu, /\bno\s+antibiotics\b/iu]
  }
];

function uniqueDetails(details: CertificationDetail[]) {
  const byCode = new Map<CertificationCode, CertificationDetail>();
  for (const detail of details) {
    if (!byCode.has(detail.code)) byCode.set(detail.code, detail);
  }
  return [...byCode.values()].sort((left, right) => left.label.localeCompare(right.label, 'sv'));
}

export function extractCertifications(input: string | string[]): CertificationExtraction {
  const text = (Array.isArray(input) ? input.join(' ') : input).trim();
  if (!text) return { cert_level: 'none', cert_details: [] };

  const certDetails = uniqueDetails(CERTIFICATION_PATTERNS.flatMap((certification) => {
    for (const pattern of certification.patterns) {
      const match = text.match(pattern);
      if (match?.[0]) {
        return [{ code: certification.code, label: certification.label, matchedText: match[0] }];
      }
    }
    return [];
  }));

  return {
    cert_level: certDetails.length === 0 ? 'none' : certDetails.length === 1 ? 'single' : 'multi',
    cert_details: certDetails
  };
}
