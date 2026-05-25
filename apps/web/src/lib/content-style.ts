export type ContentStyleTopic =
  | 'confidence'
  | 'freshness'
  | 'savings'
  | 'buyWait'
  | 'historicalPercentile'
  | 'sourceLimitations';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const honestPriceCopyRules: Record<ContentStyleTopic, {
  label: string;
  rule: string;
  preferredTerms: string[];
  bannedWithoutEvidence: string[];
}> = {
  confidence: {
    label: 'Confidence',
    rule: 'State confidence as source coverage and sample size, not certainty.',
    preferredTerms: ['high source confidence', 'medium source confidence', 'low source confidence', 'sample size'],
    bannedWithoutEvidence: ['guaranteed', 'certain', 'verified everywhere']
  },
  freshness: {
    label: 'Freshness',
    rule: 'Show when data was observed or retrieved; avoid implying current shelf state unless the source is live.',
    preferredTerms: ['observed', 'retrieved', 'latest source row', 'freshness'],
    bannedWithoutEvidence: ['live now', 'in stock now', 'current everywhere']
  },
  savings: {
    label: 'Savings',
    rule: 'Describe savings as listed, observed, or versus a named baseline; never claim household savings from catalogue rows.',
    preferredTerms: ['listed saving', 'below observed average', 'versus matched source rows'],
    bannedWithoutEvidence: ['you will save', 'guaranteed saving', 'basket saving']
  },
  buyWait: {
    label: 'Buy/Wait',
    rule: 'Use Buy/Wait only as a factual rule outcome from observed history, and name the rule.',
    preferredTerms: ['buy signal from observed history', 'wait signal from observed history', 'rule outcome'],
    bannedWithoutEvidence: ['will drop', 'price is about to', 'forecast says']
  },
  historicalPercentile: {
    label: 'Historical percentile',
    rule: 'Name the lookback window and source tape; do not present percentile as a prediction.',
    preferredTerms: ['historical percentile', 'lookback window', 'dated observations'],
    bannedWithoutEvidence: ['future percentile', 'expected percentile', 'predicted rank']
  },
  sourceLimitations: {
    label: 'Source limitations',
    rule: 'Keep exclusions visible near data-heavy UI: missing stores, loyalty terms, stock, taxes, deposits, or source classes.',
    preferredTerms: ['source limitation', 'not included', 'not reported by source'],
    bannedWithoutEvidence: ['complete market', 'all stores', 'full shelf']
  }
};

export const priceIntelligenceTerminologySeeds = {
  en: {
    confidence: 'source confidence',
    freshness: 'observed freshness',
    savings: 'listed saving',
    buy: 'buy signal from observed history',
    wait: 'wait signal from observed history',
    historicalPercentile: 'historical percentile',
    sourceLimitations: 'source limitations'
  },
  sv: {
    confidence: 'källförtroende',
    freshness: 'observerad färskhet',
    savings: 'listad besparing',
    buy: 'köp-signal från observerad historik',
    wait: 'vänta-signal från observerad historik',
    historicalPercentile: 'historisk percentil',
    sourceLimitations: 'källbegränsningar'
  },
  no: {
    confidence: 'kildetillit',
    freshness: 'observert ferskhet',
    savings: 'oppført besparelse',
    buy: 'kjøpssignal fra observert historikk',
    wait: 'vent-signal fra observert historikk',
    historicalPercentile: 'historisk persentil',
    sourceLimitations: 'kildebegrensninger'
  },
  is: {
    confidence: 'traust á heimild',
    freshness: 'skráður ferskleiki',
    savings: 'skráður sparnaður',
    buy: 'kaupmerki úr skráðri sögu',
    wait: 'biðmerki úr skráðri sögu',
    historicalPercentile: 'sögulegt hundraðshlutfall',
    sourceLimitations: 'takmarkanir heimilda'
  }
} as const;

export type PriceIntelligenceTerminologyLocale = keyof typeof priceIntelligenceTerminologySeeds;
export type PriceIntelligenceTerminology = typeof priceIntelligenceTerminologySeeds[PriceIntelligenceTerminologyLocale];

export function priceIntelligenceTerminologyForLocale(locale: string | null | undefined): PriceIntelligenceTerminology {
  const normalized = locale?.toLocaleLowerCase('en-US').split('-')[0] as PriceIntelligenceTerminologyLocale | undefined;
  return normalized && normalized in priceIntelligenceTerminologySeeds
    ? priceIntelligenceTerminologySeeds[normalized]
    : priceIntelligenceTerminologySeeds.en;
}

export function confidenceCopy(level: ConfidenceLevel, sampleSize?: number) {
  const sample = sampleSize === undefined ? 'sample size not reported' : `${sampleSize} source rows`;
  return `${level} source confidence (${sample})`;
}

export function sourceLimitationCopy(caveat: string) {
  return `Source limitation: ${caveat}`;
}

export function freshnessCopy(freshness: string) {
  return `Freshness: ${freshness}`;
}

export function listedSavingsBoundaryCopy() {
  return 'Listed savings are not basket savings. Values are observed in matched source rows and do not claim live discounts, store-specific availability, loyalty eligibility, or savings on unmatched products.';
}
