export type RetailerStoreInput = {
  chain: string;
  city?: string | null;
  countryCode?: string | null;
  country?: string | null;
};

export type RetailerPriceSample = {
  chain: string;
  category: string;
  price: number;
};

export type RetailerChainOverview = {
  chain: string;
  chainSlug: string;
  logoText: string;
  logoColor: string;
  locationsInSweden: number;
  averagePriceRank: number | null;
  categoriesObserved: number;
};

const retailerPalette = [
  '#0f766e',
  '#0ea5e9',
  '#8b5cf6',
  '#f97316',
  '#f43f5e',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#64748b'
] as const;

function toLower(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeChainName(rawChain: string): string {
  const chain = toLower(rawChain);
  if (!chain) return 'Independent';

  if (/ica\s*n[aä]ra|ica\s*kvantum|ica\s*supermarket|\bica\b|ica\-nara/.test(chain)) return 'ICA';
  if (/hemk[oö]p/.test(chain)) return 'Hemköp';
  if (/city\s*gross/.test(chain)) return 'City Gross';
  if (/willys/.test(chain)) return 'Willys';
  if (/coop/.test(chain)) return 'Coop';
  if (/lidl/.test(chain)) return 'Lidl';
  if (/tempo/.test(chain)) return 'Tempo';
  if (/\b7-?eleven\b/.test(chain)) return '7-Eleven';

  return rawChain.trim();
}

export function normalizeRetailerChain(rawChain: string): string {
  return normalizeChainName(rawChain);
}

export function makeRetailerSlug(chain: string): string {
  const normalized = chain.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '');
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stableColor(chain: string): string {
  let hash = 0;
  for (let index = 0; index < chain.length; index += 1) {
    hash = (hash * 31 + chain.charCodeAt(index)) % retailerPalette.length;
  }
  return retailerPalette[hash];
}

function chainLogoText(chain: string): string {
  if (chain === 'ICA') return 'ICA';
  const words = chain
    .replace(/[^a-zåäö0-9 ]/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return chain.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]!.slice(0, 1)}${words.at(-1)?.slice(0, 1)}`.toUpperCase();
}

function isSwedenStore(store: { countryCode?: string | null; country?: string | null }): boolean {
  if (!store.countryCode && !store.country) return true;
  const countryText = `${store.countryCode ?? ''} ${store.country ?? ''}`.toLowerCase();
  return countryText.includes('se') || countryText.includes('sweden') || countryText.includes('sverige');
}

export function buildRetailerPriceRanks(samples: readonly RetailerPriceSample[]): Array<{ chain: string; category: string; rank: number }> {
  const samplesByCategory = new Map<string, Array<RetailerPriceSample>>();
  for (const sample of samples) {
    const category = sample.category.trim().toLowerCase() || 'uncategorized';
    const chain = normalizeChainName(sample.chain);
    if (!Number.isFinite(sample.price) || sample.price <= 0) continue;

    const bucket = samplesByCategory.get(category) ?? [];
    bucket.push({ ...sample, chain, category });
    samplesByCategory.set(category, bucket);
  }

  const ranked: Array<{ chain: string; category: string; rank: number }> = [];

  for (const [category, categorySamples] of samplesByCategory) {
    const sorted = [...categorySamples].sort((left, right) => left.price - right.price || left.chain.localeCompare(right.chain));
    for (let index = 0; index < sorted.length; index += 1) {
      ranked.push({ chain: sorted[index]!.chain, category, rank: index + 1 });
    }
  }

  return ranked;
}

export function summarizeRetailerChains(input: {
  stores: readonly RetailerStoreInput[];
  priceSamples?: readonly RetailerPriceSample[];
}): RetailerChainOverview[] {
  const locationBuckets = new Map<string, { chain: string; locations: number }>();

  for (const store of input.stores) {
    const chain = normalizeChainName(store.chain);
    if (!chain) continue;
    const bucket = locationBuckets.get(chain) ?? { chain, locations: 0 };
    if (isSwedenStore(store)) bucket.locations += 1;
    locationBuckets.set(chain, bucket);
  }

  const rankRows = buildRetailerPriceRanks(input.priceSamples ?? []);
  const rankTotals = new Map<string, { sum: number; count: number; categories: Set<string> }>();

  for (const row of rankRows) {
    const bucket = rankTotals.get(row.chain) ?? { sum: 0, count: 0, categories: new Set<string>() };
    bucket.sum += row.rank;
    bucket.count += 1;
    bucket.categories.add(row.category);
    rankTotals.set(row.chain, bucket);
  }

  const output: RetailerChainOverview[] = [];
  for (const { chain, locations } of locationBuckets.values()) {
    const rankBucket = rankTotals.get(chain);
    const averagePriceRank =
      !rankBucket || rankBucket.count === 0
        ? null
        : Number((rankBucket.sum / rankBucket.count).toFixed(1));

    output.push({
      chain,
      chainSlug: makeRetailerSlug(chain),
      logoText: chainLogoText(chain),
      logoColor: stableColor(chain),
      locationsInSweden: locations,
      averagePriceRank,
      categoriesObserved: rankBucket ? rankBucket.categories.size : 0
    });
  }

  return output.sort((a, b) => {
    const byLocation = b.locationsInSweden - a.locationsInSweden;
    if (byLocation !== 0) return byLocation;
    return a.chain.localeCompare(b.chain);
  });
}
