export type MeatAnimal = 'beef' | 'pork' | 'chicken' | 'mixed';

export type MeatCut =
  | 'tenderloin'
  | 'ribeye'
  | 'sausage'
  | 'pork_collar'
  | 'chicken_breast'
  | 'chicken_thigh'
  | 'chicken_wing';

export type MeatPreparation = 'fillet' | 'steak' | 'sausage' | 'sliced' | 'whole';

export type CutPreparation = {
  animal: MeatAnimal;
  cut: MeatCut;
  preparation: MeatPreparation;
};

type CutRule = CutPreparation & {
  patterns: RegExp[];
  slicedPatterns?: RegExp[];
};

const fileSuffix = '(?:n|er|erna)?';
const wingSuffix = '(?:ar|e|arna)?';
const sausageSuffix = '(?:en)?';
const cutSuffix = '(?:n)?';

const cutRules: CutRule[] = [
  {
    animal: 'chicken',
    cut: 'chicken_thigh',
    preparation: 'fillet',
    patterns: [
      new RegExp(`\\bkyckling\\s*lar\\s*file${fileSuffix}\\b`),
      new RegExp(`\\bkycklinglarfile${fileSuffix}\\b`),
      new RegExp(`\\blar\\s*file${fileSuffix}\\b`),
      /\bchicken\s*thigh\s*fillets?\b/,
      /\bboneless\s*chicken\s*thighs?\b/
    ]
  },
  {
    animal: 'chicken',
    cut: 'chicken_breast',
    preparation: 'fillet',
    patterns: [
      new RegExp(`\\bkyckling\\s*file${fileSuffix}\\b`),
      new RegExp(`\\bkycklingfile${fileSuffix}\\b`),
      new RegExp(`\\bkyckling\\s*brost\\s*file${fileSuffix}\\b`),
      /\bkycklingbrost(et)?\b/,
      /\bchicken\s*(breast\s*)?fillets?\b/,
      /\bchicken\s*breasts?\b/
    ]
  },
  {
    animal: 'chicken',
    cut: 'chicken_wing',
    preparation: 'whole',
    patterns: [
      new RegExp(`\\bkyckling\\s*ving${wingSuffix}\\b`),
      new RegExp(`\\bkycklingving${wingSuffix}\\b`),
      new RegExp(`\\bving${wingSuffix}\\b`),
      /\bchicken\s*wings?\b/,
      /\bwings?\b/
    ]
  },
  {
    animal: 'beef',
    cut: 'tenderloin',
    preparation: 'fillet',
    patterns: [
      new RegExp(`\\box\\s*file${fileSuffix}\\b`),
      new RegExp(`\\boxfile${fileSuffix}\\b`),
      new RegExp(`\\bn(o|oe)t\\s*file${fileSuffix}\\b`),
      new RegExp(`\\bnotfile${fileSuffix}\\b`),
      /\bbeef\s*tenderloin\b/,
      /\bfillet\s*of\s*beef\b/
    ]
  },
  {
    animal: 'beef',
    cut: 'ribeye',
    preparation: 'steak',
    patterns: [
      /\brib\s*eye\b/,
      /\bribeye\b/,
      new RegExp(`\\bentrecote${cutSuffix}\\b`),
      new RegExp(`\\bentrecote\\s*stek${cutSuffix}\\b`),
      /\bbeef\s*ribeye\b/
    ]
  },
  {
    animal: 'pork',
    cut: 'pork_collar',
    preparation: 'steak',
    patterns: [
      new RegExp(`\\bflask\\s*karre${cutSuffix}\\b`),
      new RegExp(`\\bflaskkarre${cutSuffix}\\b`),
      new RegExp(`\\bkarre${cutSuffix}\\b`),
      new RegExp(`\\bgrillkarre${cutSuffix}\\b`),
      /\bpork\s*(collar|neck)\b/,
      /\bnakkekotelett(en)?\b/
    ],
    slicedPatterns: [/\bskivad\b/, /\bskivor\b/, /\bsliced\b/]
  },
  {
    animal: 'mixed',
    cut: 'sausage',
    preparation: 'sausage',
    patterns: [
      new RegExp(`\\bfalu\\s*korv${sausageSuffix}\\b`),
      new RegExp(`\\bfalukorv${sausageSuffix}\\b`),
      /\bfalu\s*sausage\b/,
      /\bswedish\s*sausage\b/
    ]
  }
];

export function normalizeCutInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withPreparation(rule: CutRule, normalized: string): CutPreparation {
  const preparation = rule.slicedPatterns?.some((pattern) => pattern.test(normalized)) ? 'sliced' : rule.preparation;
  return {
    animal: rule.animal,
    cut: rule.cut,
    preparation
  };
}

export function extractCutPreparation(value: string): CutPreparation | null {
  const normalized = normalizeCutInput(value);
  if (!normalized) return null;

  const rule = cutRules.find((candidate) => candidate.patterns.some((pattern) => pattern.test(normalized)));
  return rule ? withPreparation(rule, normalized) : null;
}

export const parseCutPreparation = extractCutPreparation;
export const parseMeatCut = extractCutPreparation;
export const extractMeatCut = extractCutPreparation;
