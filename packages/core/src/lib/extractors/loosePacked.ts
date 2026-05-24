export type ProductPackingChannel = 'loose' | 'pre_packed' | 'mixed' | 'unknown';
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
      reason: 'No product text was provided.'
    };
  }

  const looseSignals = collectSignals(text, LOOSE_PATTERNS);
  const prePackedSignals = collectSignals(text, PRE_PACKED_PATTERNS);

  if (looseSignals.length > 0 && prePackedSignals.length > 0) {
    return {
      channel: 'mixed',
      confidence: 'medium',
      looseSignals,
      prePackedSignals,
      reason: 'Both loose-weight and pre-packed packaging signals were found; keep channel-specific observations separate.'
    };
  }

  if (looseSignals.length > 0) {
    return {
      channel: 'loose',
      confidence: looseSignals.length > 1 ? 'high' : 'medium',
      looseSignals,
      prePackedSignals,
      reason: 'Loose-weight product language was found.'
    };
  }

  if (prePackedSignals.length > 0) {
    return {
      channel: 'pre_packed',
      confidence: prePackedSignals.length > 1 ? 'high' : 'medium',
      looseSignals,
      prePackedSignals,
      reason: 'Pre-packed packaging language was found.'
    };
  }

  return {
    channel: 'unknown',
    confidence: 'low',
    looseSignals,
    prePackedSignals,
    reason: 'No loose-weight or pre-packed packaging signal was found.'
  };
}

export function buildChannelTrackingKey(input: ChannelTrackingInput): string {
  if (!input.canonicalId.trim()) throw new Error('canonicalId is required.');
  if (!input.storeId.trim()) throw new Error('storeId is required.');
  const channel = input.channel === 'mixed' ? 'unknown' : input.channel;
  return `${input.storeId.trim()}::${input.canonicalId.trim()}::${channel}`;
}
