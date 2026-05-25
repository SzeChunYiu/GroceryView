export type ProductPackingChannel = 'packaged' | 'loose' | 'pre_packed' | 'mixed' | 'counter_meat' | 'counter_deli' | 'counter_fish' | 'unknown';
export type ProductPackingSignal = 'loose' | 'pre_packed';

export type LoosePackedInput = {
  title?: string;
  description?: string;
  unit?: string;
  priceText?: string;
  packageText?: string;
};

export type LoosePackedDetection = {
  channel: ProductPackingChannel;
  confidence: 'high' | 'medium' | 'low';
  looseSignals: string[];
  prePackedSignals: string[];
  counterSignals: string[];
  reason: string;
};

export type ChannelTrackingInput = {
  canonicalId: string;
  storeId: string;
  channel: ProductPackingChannel;
};

const LOOSE_PATTERNS: RegExp[] = [
  /\bl[oö]s\s*vikt\b/iu,
  /\bl[oö]svikt\b/iu,
  /\bl[oö]s\b/iu,
  /\bper\s*kg\b/iu,
  /\bpris\s*\/\s*kg\b/iu,
  /\bkr\s*\/\s*kg\b/iu,
  /\bkg\s*pris\b/iu,
  /\bj[aä]mf[oö]rpris\s*[:]?\s*\d+(?:[,.]\d+)?\s*(?:kr|sek)\s*\/\s*kg\b/iu
];

const PRE_PACKED_PATTERNS: RegExp[] = [
  /\bpaket\b/iu,
  /\btr[aå]g\b/iu,
  /\bf[oö]rpack(?:ning|ad|at|ade)?\b/iu,
  /\bfp\b/iu,
  /\bst\b/iu,
  /\b(?:ca\s*)?\d+(?:[,.]\d+)?\s*(?:g|gram)\b/iu,
  /\b\d+(?:[,.]\d+)?\s*(?:kg)\s*(?:paket|tr[aå]g|f[oö]rpack)/iu
];

const COUNTER_MEAT_PATTERNS: RegExp[] = [
  /\bk[oö]tt\s*disk(?:en)?\b/iu,
  /\bmanuell\s*k[oö]tt\b/iu,
  /\bbutiksstyckat\b/iu,
  /\bserved\s*meat\s*counter\b/iu,
  /\bmeat\s*counter\b/iu
];

const COUNTER_DELI_PATTERNS: RegExp[] = [
  /\bdelikatess\s*disk(?:en)?\b/iu,
  /\bchark\s*disk(?:en)?\b/iu,
  /\bmanuell\s*(?:deli|delikatess|chark)\b/iu,
  /\bdeli\s*counter\b/iu
];

const COUNTER_FISH_PATTERNS: RegExp[] = [
  /\bfisk\s*disk(?:en)?\b/iu,
  /\bmanuell\s*fisk\b/iu,
  /\bfiskhandlare\b/iu,
  /\bfish\s*counter\b/iu,
  /\bseafood\s*counter\b/iu
];

const normalize = (value: string): string =>
  value
    .toLocaleLowerCase('sv-SE')
    .replace(/\s+/g, ' ')
    .trim();

const unique = (values: string[]): string[] => [...new Set(values)].sort((a, b) => a.localeCompare(b));

function collectSignals(text: string, patterns: RegExp[]): string[] {
  const signals: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) signals.push(match[0].trim());
  }
  return unique(signals);
}

export function detectLoosePackedChannel(input: LoosePackedInput | string): LoosePackedDetection {
  const rawText = typeof input === 'string'
    ? input
    : [input.title, input.description, input.unit, input.priceText, input.packageText].filter(Boolean).join(' ');
  const text = normalize(rawText);

  if (!text) {
    return {
      channel: 'unknown',
      confidence: 'low',
      looseSignals: [],
      prePackedSignals: [],
      counterSignals: [],
      reason: 'No product text was provided.'
    };
  }

  const looseSignals = collectSignals(text, LOOSE_PATTERNS);
  const prePackedSignals = collectSignals(text, PRE_PACKED_PATTERNS);
  const counterSignalsByChannel = [
    { channel: 'counter_meat' as const, signals: collectSignals(text, COUNTER_MEAT_PATTERNS) },
    { channel: 'counter_deli' as const, signals: collectSignals(text, COUNTER_DELI_PATTERNS) },
    { channel: 'counter_fish' as const, signals: collectSignals(text, COUNTER_FISH_PATTERNS) }
  ];
  const counterDetection = counterSignalsByChannel.find((candidate) => candidate.signals.length > 0);
  const counterSignals = unique(counterSignalsByChannel.flatMap((candidate) => candidate.signals));

  if (counterDetection) {
    return {
      channel: counterDetection.channel,
      confidence: counterDetection.signals.length > 1 ? 'high' : 'medium',
      looseSignals,
      prePackedSignals,
      counterSignals,
      reason: 'In-store counter service language was found; keep this observation separate from packaged shelf prices.'
    };
  }

  if (looseSignals.length > 0 && prePackedSignals.length > 0) {
    return {
      channel: 'mixed',
      confidence: 'medium',
      looseSignals,
      prePackedSignals,
      counterSignals,
      reason: 'Both loose-weight and pre-packed packaging signals were found; keep channel-specific observations separate.'
    };
  }

  if (looseSignals.length > 0) {
    return {
      channel: 'loose',
      confidence: looseSignals.length > 1 ? 'high' : 'medium',
      looseSignals,
      prePackedSignals,
      counterSignals,
      reason: 'Loose-weight product language was found.'
    };
  }

  if (prePackedSignals.length > 0) {
    return {
      channel: 'pre_packed',
      confidence: prePackedSignals.length > 1 ? 'high' : 'medium',
      looseSignals,
      prePackedSignals,
      counterSignals,
      reason: 'Pre-packed packaging language was found.'
    };
  }

  return {
    channel: 'unknown',
    confidence: 'low',
    looseSignals,
    prePackedSignals,
    counterSignals,
    reason: 'No loose-weight or pre-packed packaging signal was found.'
  };
}

export function buildChannelTrackingKey(input: ChannelTrackingInput): string {
  if (!input.canonicalId.trim()) throw new Error('canonicalId is required.');
  if (!input.storeId.trim()) throw new Error('storeId is required.');
  const channel = input.channel === 'mixed' ? 'unknown' : input.channel;
  return `${input.storeId.trim()}::${input.canonicalId.trim()}::${channel}`;
}
