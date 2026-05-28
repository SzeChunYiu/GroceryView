import { apohemProducts, apohemSource, type ApohemIngestedProduct, type PharmacyChain } from '@/lib/ingested/apohem';
import { formatSek } from '@/lib/verified-data';

export type PharmacyDomainSearchParams = Record<string, string | string[] | undefined>;

const chainLabels: Record<PharmacyChain, string> = {
  apohem: 'Apohem',
  'apotek-hjartat': 'Apotek Hjärtat'
};

function firstValue(params: PharmacyDomainSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function sourceLabel(row: ApohemIngestedProduct) {
  const url = new URL(row.sourceUrl);
  return `${url.hostname}${url.pathname}`;
}

function comparableRows(ean: string) {
  return apohemProducts
    .filter((row) => row.ean === ean && row.isOtc && Number.isFinite(row.price) && row.price > 0)
    .sort((left, right) => left.price - right.price || chainLabels[left.chain].localeCompare(chainLabels[right.chain], 'sv'));
}

function rowMatchesQuery(row: ApohemIngestedProduct, query: string) {
  if (!query) return true;
  return [row.name, row.brand, row.ean, row.code, row.category, chainLabels[row.chain]]
    .join(' ')
    .toLocaleLowerCase('sv-SE')
    .includes(query);
}

export function buildPharmacyDomainSearchView(params: PharmacyDomainSearchParams = {}) {
  const query = normalize(firstValue(params, 'q'));
  const requestedEan = normalize(firstValue(params, 'ean'));
  const seen = new Set<string>();
  const cards = apohemProducts
    .filter((row) => row.isOtc)
    .filter((row) => (!requestedEan || row.ean === requestedEan || row.code === requestedEan) && rowMatchesQuery(row, query))
    .filter((row) => {
      if (seen.has(row.ean)) return false;
      seen.add(row.ean);
      return true;
    })
    .slice(0, 8)
    .map((row) => {
      const rows = comparableRows(row.ean);
      const cheapest = rows[0] ?? row;
      const chainCount = new Set(rows.map((candidate) => candidate.chain)).size;
      return {
        ean: row.ean,
        name: row.name,
        brand: row.brand || row.code,
        category: row.category,
        chain: cheapest.chain,
        chainLabel: chainLabels[cheapest.chain],
        priceLabel: formatSek(cheapest.price),
        retrievedAt: cheapest.retrievedAt.slice(0, 10),
        sourceLabel: sourceLabel(cheapest),
        comparisonCount: rows.length,
        chainCount,
        href: `/pharmacy/${row.ean}`,
        mapHref: `/map?domain=pharmacy&pharmacy=${cheapest.chain}`,
        alertHref: `/watchlist?domain=pharmacy&ean=${row.ean}`,
        limitation: 'OTC public catalog only; exact EAN comparison; no prescription or medical advice; no stock claim.'
      };
    });

  return {
    domain: 'pharmacy' as const,
    query,
    resultCount: cards.length,
    cards,
    evidenceSummary: `${cards.length} exact-EAN OTC cards · ${apohemSource.rowCount} public catalog rows · source freshness ${apohemSource.retrievedAt.slice(0, 10)}`,
    emptyState: 'No OTC public catalog card matched this query. Try alvedon, ipren, allergy, vitamin, or an exact EAN.'
  };
}

export function buildPharmacyProductDetail(product: string) {
  const raw = decodeURIComponent(product);
  const rows = comparableRows(raw);
  const fallback = rows.length ? rows[0] : apohemProducts.find((row) => row.ean === raw || row.code === raw);
  if (!fallback || !fallback.isOtc) return null;
  const exactRows = rows.length ? rows : comparableRows(fallback.ean);
  const cheapest = exactRows[0] ?? fallback;
  const highest = exactRows.at(-1) ?? fallback;

  return {
    ean: fallback.ean,
    name: fallback.name,
    brand: fallback.brand || fallback.code,
    category: fallback.category,
    cheapest,
    highest,
    priceSpread: Math.max(0, (highest.price ?? 0) - (cheapest.price ?? 0)),
    rows: exactRows.map((row) => ({
      chain: row.chain,
      chainLabel: chainLabels[row.chain],
      price: row.price,
      priceLabel: formatSek(row.price),
      retrievedAt: row.retrievedAt.slice(0, 10),
      productUrl: row.productUrl,
      sourceLabel: sourceLabel(row),
      stockBoundary: 'No stock claim unless the source explicitly provides stock evidence.'
    })),
    safetyBoundary: [
      'OTC public catalog only.',
      'Exact EAN comparison.',
      'No prescription medicine.',
      'No medical advice.',
      'No suitability recommendation.',
      'No stock claim unless source exists.'
    ]
  };
}

export function buildPharmacySelectedDetail(pharmacy: string | string[] | undefined) {
  const raw = Array.isArray(pharmacy) ? pharmacy[0] : pharmacy;
  const chain = raw === 'apotek-hjartat' ? 'apotek-hjartat' : raw === 'apohem' ? 'apohem' : 'apohem';
  const rows = apohemProducts.filter((row) => row.chain === chain && row.isOtc).slice(0, 5);

  return {
    chain,
    chainLabel: chainLabels[chain],
    title: `${chainLabels[chain]} OTC source coverage`,
    retrievedAt: apohemSource.retrievedAt.slice(0, 10),
    rowCount: apohemProducts.filter((row) => row.chain === chain).length,
    sampleRows: rows.map((row) => ({ ean: row.ean, name: row.name, priceLabel: formatSek(row.price), href: `/pharmacy/${row.ean}` })),
    sourceLabel: apohemSource.source,
    detailHref: `/search?domain=pharmacy&pharmacy=${chain}`,
    guardrail: 'OTC coverage/source freshness only. No stock or prescription claim, no medical advice, and no pharmacy-location inventory claim.'
  };
}
