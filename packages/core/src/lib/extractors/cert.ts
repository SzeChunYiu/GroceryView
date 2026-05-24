export type CertificationCode =
  | 'krav'
  | 'eu_eko'
  | 'fairtrade'
  | 'msc'
  | 'asc'
  | 'rainforest_alliance'
  | 'no_antibiotics';

export type CertificationLevel = 'none' | 'single' | 'multi';

export type CertificationCategory = 'organic' | 'ethical_trade' | 'seafood' | 'animal_welfare';

export type CertificationInput = {
  title?: string;
  description?: string;
  labels?: readonly string[];
  brand?: string;
  packageText?: string;
};

export type CertificationDetail = {
  code: CertificationCode;
  label: string;
  category: CertificationCategory;
  matchedText: string;
};

export type CertificationExtraction = {
  cert_level: CertificationLevel;
  cert_details: CertificationDetail[];
};

type CertificationDefinition = Omit<CertificationDetail, 'matchedText'> & {
  patterns: RegExp[];
};

const CERTIFICATION_DEFINITIONS: CertificationDefinition[] = [
  {
    code: 'krav',
    label: 'KRAV',
    category: 'organic',
    patterns: [/\bkrav(?:[-\s]?m[aä]rkt)?\b/iu]
  },
  {
    code: 'eu_eko',
    label: 'EU-Eko',
    category: 'organic',
    patterns: [/\beu[-\s]?eko(?:logisk(?:t|a)?)?\b/iu, /\beu[-_\s]?ecological\b/iu]
  },
  {
    code: 'fairtrade',
    label: 'Fairtrade',
    category: 'ethical_trade',
    patterns: [/\bfair\s*trade\b/iu, /\bfairtrade(?:[-_\s]?facet)?\b/iu]
  },
  {
    code: 'msc',
    label: 'MSC',
    category: 'seafood',
    patterns: [/\bmsc\b/iu]
  },
  {
    code: 'asc',
    label: 'ASC',
    category: 'seafood',
    patterns: [/\basc\b/iu]
  },
  {
    code: 'rainforest_alliance',
    label: 'Rainforest Alliance',
    category: 'ethical_trade',
    patterns: [/\brainforest\s+alliance\b/iu]
  },
  {
    code: 'no_antibiotics',
    label: 'Utan antibiotika',
    category: 'animal_welfare',
    patterns: [/\butan\s+antibiotika\b/iu, /\bno\s+antibiotics\b/iu]
  }
];

function textFromInput(input: CertificationInput | string): string {
  if (typeof input === 'string') return input;
  return [input.title, input.description, input.brand, input.packageText, ...(input.labels ?? [])]
    .filter((value): value is string => Boolean(value))
    .join(' ');
}

function certLevel(certCount: number): CertificationLevel {
  if (certCount === 0) return 'none';
  if (certCount === 1) return 'single';
  return 'multi';
}

export function extractCertifications(input: CertificationInput | string): CertificationExtraction {
  const text = textFromInput(input);
  const certDetails: CertificationDetail[] = [];

  for (const definition of CERTIFICATION_DEFINITIONS) {
    const matchedText = definition.patterns
      .map((pattern) => text.match(pattern)?.[0]?.trim())
      .find((match): match is string => Boolean(match));

    if (!matchedText) continue;

    certDetails.push({
      code: definition.code,
      label: definition.label,
      category: definition.category,
      matchedText
    });
  }

  return {
    cert_level: certLevel(certDetails.length),
    cert_details: certDetails
  };
}

export function hasCertification(input: CertificationInput | string, code: CertificationCode): boolean {
  return extractCertifications(input).cert_details.some((certification) => certification.code === code);
}
