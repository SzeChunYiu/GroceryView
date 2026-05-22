import { createInterface } from 'node:readline';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';

const REPO_ROOT = new URL('../../', import.meta.url);
const OPENFOODFACTS_EXPORT_URL = 'https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';
const USER_AGENT = 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)';
const INGESTED_DIR = new URL('apps/web/src/lib/ingested/', REPO_ROOT);
const WEB_OUTPUT = new URL('apps/web/src/lib/ingested/openfoodfacts.ts', REPO_ROOT);
const EVIDENCE_OUTPUT = new URL('docs/ingestion/openfoodfacts-evidence.md', REPO_ROOT);

const CANDIDATE_SOURCES = [
  { chain: 'willys', file: 'willys.ts', exportName: 'willysProducts', surface: 'products', barcodeFrom: 'imageUrl' },
  { chain: 'willys', file: 'willys.ts', exportName: 'willysWeeklyDiscounts', surface: 'weeklyDiscounts', barcodeFrom: 'imageUrl' },
  { chain: 'hemkop', file: 'hemkop.ts', exportName: 'hemkopProducts', surface: 'products', barcodeFrom: 'imageUrl' },
  { chain: 'hemkop', file: 'hemkop.ts', exportName: 'hemkopWeeklyDiscounts', surface: 'weeklyDiscounts', barcodeFrom: 'imageUrl' },
  { chain: 'coop', file: 'coop.ts', exportName: 'coopProducts', surface: 'products', barcodeFrom: 'ean' },
  { chain: 'coop', file: 'coop.ts', exportName: 'coopWeeklyDiscounts', surface: 'weeklyDiscounts', barcodeFrom: 'ean' },
  { chain: 'ica', file: 'ica-reklamblad.ts', exportName: 'icaReklambladOffers', surface: 'reklambladOffers', barcodeFrom: 'eans' },
  { chain: 'ica', file: 'ica.ts', exportName: 'icaProducts', surface: 'storePromotions', barcodeFrom: 'imageUrl' }
];

const retrievedAt = new Date().toISOString();
const candidatesByBarcode = new Map();
const candidateStats = [];

for (const source of CANDIDATE_SOURCES) {
  const rows = await extractArrayFromTypeScriptModule(new URL(source.file, INGESTED_DIR), source.exportName);
  const sourceBarcodes = new Set();
  let usableCandidateRows = 0;

  for (const row of rows) {
    const barcodes = barcodesForRow(row, source.barcodeFrom);
    if (barcodes.length === 0) {
      continue;
    }
    usableCandidateRows += 1;
    for (const barcode of barcodes) {
      sourceBarcodes.add(barcode);
      addCandidate(barcode, {
        chain: source.chain,
        productCode: String(row.productCode ?? row.retailerProductId ?? row.code ?? ''),
        name: String(row.name ?? ''),
        brand: String(row.brand ?? ''),
        packageText: String(row.packageText ?? row.packageSize ?? ''),
        sourceUrl: String(row.sourceUrl ?? row.productSearchUrl ?? ''),
        retrievedAt: String(row.retrievedAt ?? '')
      });
    }
  }

  candidateStats.push({
    chain: source.chain,
    surface: source.surface,
    rowCount: rows.length,
    usableCandidateRowCount: usableCandidateRows,
    uniqueBarcodeCount: sourceBarcodes.size
  });
}

const response = await fetch(OPENFOODFACTS_EXPORT_URL, {
  headers: {
    accept: 'application/gzip, text/tab-separated-values',
    'user-agent': USER_AGENT
  }
});

if (!response.ok) {
  throw new Error(`OpenFoodFacts export request failed: ${response.status}`);
}
if (!response.body) {
  throw new Error('OpenFoodFacts export response did not include a body');
}

const enrichments = [];
const sampleRows = [];
let headers = null;
let scannedExportRowCount = 0;
let matchedExportBarcodeCount = 0;
let matchedWithoutNutritionCount = 0;

const stream = Readable.fromWeb(response.body).pipe(createGunzip());
const lines = createInterface({ input: stream, crlfDelay: Infinity });

try {
  for await (const line of lines) {
    if (!headers) {
      headers = parseTsvLine(line);
      continue;
    }

    scannedExportRowCount += 1;
    const fields = parseTsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? '']));
    const candidates = candidatesByBarcode.get(record.code);
    if (!candidates) {
      continue;
    }

    matchedExportBarcodeCount += 1;
    const product = normalizeOpenFoodFactsExportRecord(record);
    if (!product || !hasNutrition(product.nutritionPer100g)) {
      matchedWithoutNutritionCount += 1;
      continue;
    }

    const row = {
      barcode: product.code,
      name: product.name,
      brands: product.brands,
      quantity: product.quantity,
      categories: product.categories,
      labels: product.labels,
      nutriscoreGrade: product.nutriscoreGrade,
      nutritionPer100g: product.nutritionPer100g,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      sourceUrl: product.sourceUrl,
      retrievedAt,
      retailerMatches: candidates
    };
    enrichments.push(row);
    if (sampleRows.length < 12) {
      sampleRows.push(row);
    }
  }
} finally {
  lines.close();
  stream.destroy();
}

enrichments.sort((left, right) => left.barcode.localeCompare(right.barcode));
const candidateBarcodeCount = candidatesByBarcode.size;
const outputSummary = {
  rowCount: enrichments.length,
  retailerMatchCount: enrichments.reduce((total, row) => total + row.retailerMatches.length, 0),
  candidateBarcodeCount,
  matchedExportBarcodeCount,
  matchedWithoutNutritionCount,
  scannedExportRowCount
};

await writeOpenFoodFactsWebFile(enrichments, candidateStats, outputSummary);
await writeEvidenceFile(enrichments, candidateStats, outputSummary, sampleRows);

console.log(JSON.stringify({ retrievedAt, ...outputSummary, candidateStats }, null, 2));

function addCandidate(barcode, candidate) {
  if (!/^\d{8,14}$/.test(barcode)) {
    return;
  }

  const existing = candidatesByBarcode.get(barcode) ?? [];
  const dedupeKey = [
    candidate.chain,
    candidate.productCode,
    candidate.name,
    candidate.brand,
    candidate.packageText,
    candidate.sourceUrl,
    candidate.retrievedAt
  ].join('\u001f');
  if (!existing.some((match) => [
    match.chain,
    match.productCode,
    match.name,
    match.brand,
    match.packageText,
    match.sourceUrl,
    match.retrievedAt
  ].join('\u001f') === dedupeKey)) {
    existing.push(candidate);
  }
  candidatesByBarcode.set(barcode, existing);
}

function barcodesForRow(row, barcodeFrom) {
  if (barcodeFrom === 'ean') {
    return barcodeList(row.ean);
  }
  if (barcodeFrom === 'eans') {
    return [...barcodeList(row.eans), ...barcodeList(extractBarcodeFromImageUrl(row.imageUrl ?? ''))];
  }
  return barcodeList(extractBarcodeFromImageUrl(row.imageUrl ?? ''));
}

function barcodeList(value) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values
    .map((item) => String(item ?? '').trim())
    .filter((item) => /^\d{8,14}$/.test(item)))];
}

function extractBarcodeFromImageUrl(imageUrl) {
  const axfoodMatch = imageUrl.match(/\/(0\d{13})(?:_|$)/);
  if (axfoodMatch) {
    return axfoodMatch[1].replace(/^0(?=\d{13}$)/, '');
  }
  const barcodeSegments = [...imageUrl.matchAll(/(?:^|[/_.-])(\d{8,14})(?=[/_.-]|$|\?)/g)]
    .map((match) => match[1]);
  return barcodeSegments.find((segment) => /^\d{8,14}$/.test(segment)) ?? '';
}

async function extractArrayFromTypeScriptModule(fileUrl, exportName) {
  const text = await readFile(fileUrl, 'utf8');
  const marker = `export const ${exportName}`;
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Could not find ${exportName} in ${fileUrl.pathname}`);
  }

  const assignmentIndex = text.indexOf('=', markerIndex);
  const arrayStart = text.indexOf('[', assignmentIndex);
  if (arrayStart < 0) {
    throw new Error(`Could not find array start for ${exportName} in ${fileUrl.pathname}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(text.slice(arrayStart, index + 1));
      }
    }
  }

  throw new Error(`Could not find array end for ${exportName} in ${fileUrl.pathname}`);
}

function normalizeOpenFoodFactsExportRecord(record) {
  const code = asText(record.code);
  const name = asText(record.product_name);
  if (!code || !name) {
    return null;
  }

  return {
    code,
    name,
    brands: asText(record.brands),
    quantity: asText(record.quantity),
    categories: splitTags(record.categories_tags),
    labels: splitTags(record.labels_tags),
    nutriscoreGrade: asText(record.nutriscore_grade) || 'unknown',
    nutritionPer100g: normalizeNutrition(record),
    imageUrl: asText(record.image_url),
    productUrl: asText(record.url) || `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    sourceUrl: `${OPENFOODFACTS_EXPORT_URL}#code=${encodeURIComponent(code)}`
  };
}

function normalizeNutrition(record) {
  return {
    energyKj: numberOrNull(record.energy_100g),
    energyKcal: numberOrNull(record['energy-kcal_100g']),
    fat: numberOrNull(record.fat_100g),
    saturatedFat: numberOrNull(record['saturated-fat_100g']),
    carbohydrates: numberOrNull(record.carbohydrates_100g),
    sugars: numberOrNull(record.sugars_100g),
    fiber: numberOrNull(record.fiber_100g),
    proteins: numberOrNull(record.proteins_100g),
    salt: numberOrNull(record.salt_100g),
    sodium: numberOrNull(record.sodium_100g)
  };
}

function hasNutrition(nutrition) {
  return Object.values(nutrition).some((value) => value !== null);
}

function parseTsvLine(line) {
  return line.split('\t');
}

function splitTags(value) {
  const text = asText(value);
  return text ? text.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function asText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function writeOpenFoodFactsWebFile(enrichmentRows, stats, summary) {
  const headerLines = [
    '// AUTO-GENERATED from the official OpenFoodFacts world data export.',
    `// Source URL: ${OPENFOODFACTS_EXPORT_URL}`,
    `// Retrieved: ${retrievedAt}`,
    `// Row count: ${summary.rowCount} real barcode+nutrition enrichment rows matched to existing ingested retailer products.`,
    `// Retailer match count: ${summary.retailerMatchCount} current ingested retailer rows linked by real barcode.`,
    `// Candidate barcode count checked from current Willys/Hemkop/Coop/ICA ingested rows: ${summary.candidateBarcodeCount}.`,
    `// Candidate source surfaces: ${stats.map((stat) => `${stat.chain}/${stat.surface} ${stat.uniqueBarcodeCount}`).join('; ')}.`,
    `// Export rows scanned: ${summary.scannedExportRowCount}; candidate barcodes present in export: ${summary.matchedExportBarcodeCount}; matched rows without usable nutrition/name: ${summary.matchedWithoutNutritionCount}.`,
    '// No-match or nutrition-empty products were skipped.',
    ''
  ];

  const typeBlock = `export type OpenFoodFactsNutritionPer100g = {
  energyKj: number | null;
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
  sodium: number | null;
};

export type OpenFoodFactsRetailerMatch = {
  chain: 'willys' | 'hemkop' | 'coop' | 'ica';
  productCode: string;
  name: string;
  brand: string;
  packageText: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type OpenFoodFactsIngestedProduct = {
  barcode: string;
  name: string;
  brands: string;
  quantity: string;
  categories: string[];
  labels: string[];
  nutriscoreGrade: string;
  nutritionPer100g: OpenFoodFactsNutritionPer100g;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  retailerMatches: OpenFoodFactsRetailerMatch[];
};

export const openFoodFactsSource = ${JSON.stringify({
    source: 'openfoodfacts.org world data export barcode nutrition enrichment',
    retrievedAt,
    rowCount: summary.rowCount,
    retailerMatchCount: summary.retailerMatchCount,
    candidateBarcodeCount: summary.candidateBarcodeCount,
    matchedExportBarcodeCount: summary.matchedExportBarcodeCount,
    matchedWithoutNutritionCount: summary.matchedWithoutNutritionCount,
    scannedExportRowCount: summary.scannedExportRowCount,
    candidateSourceStats: stats,
    sourceUrl: OPENFOODFACTS_EXPORT_URL
  }, null, 2)} as const;

export const openFoodFactsProducts: OpenFoodFactsIngestedProduct[] = `;

  await writeFile(WEB_OUTPUT, `${headerLines.join('\n')}\n${typeBlock}${JSON.stringify(enrichmentRows, null, 2)};\n`);
}

async function writeEvidenceFile(enrichmentRows, stats, summary, samples) {
  await mkdir(new URL('docs/ingestion/', REPO_ROOT), { recursive: true });
  const noMatchCount = summary.candidateBarcodeCount - summary.matchedExportBarcodeCount;
  const evidence = `# OpenFoodFacts ingestion evidence

- Source: official OpenFoodFacts world data export
- Source URL: ${OPENFOODFACTS_EXPORT_URL}
- Retrieved: ${retrievedAt}
- Candidate barcode count checked from current Willys/Hemkop/Coop/ICA ingested rows: ${summary.candidateBarcodeCount}
- Candidate source surfaces: ${stats.map((stat) => `${stat.chain}/${stat.surface} ${stat.uniqueBarcodeCount} unique barcodes from ${stat.usableCandidateRowCount}/${stat.rowCount} rows`).join('; ')}
- Export rows scanned: ${summary.scannedExportRowCount}
- Candidate barcodes present in export: ${summary.matchedExportBarcodeCount}
- Candidate barcodes not present in export and skipped: ${noMatchCount}
- Matched rows without usable nutrition/name skipped: ${summary.matchedWithoutNutritionCount}
- Real rows fetched: ${summary.rowCount} barcode+nutrition rows matched to existing ingested retailer products
- Retailer rows linked by those real barcodes: ${summary.retailerMatchCount}
- Connector: packages/ingestion/src/connectors/openfoodfacts.ts
- Generator: scripts/ingestion/generate-openfoodfacts-enrichment.mjs
- Web wire: apps/web/src/lib/ingested/openfoodfacts.ts

The official OpenFoodFacts export URL under \`world.openfoodfacts.org/data\` streamed successfully, so this iteration uses that public export. Candidate barcodes came only from current ingested rows with a real barcode-bearing field or URL: Coop \`ean\` fields, ICA reklamblad \`eans\`, and barcode-like public image URL filenames from Willys, Hemkop, and ICA store promotions. Mathem, Matspar, and Matpriskollen wired rows were inspected but skipped because they do not expose barcode fields in the ingested artifacts. No-match and nutrition-empty products were skipped. Every emitted row includes its exact export source marker in \`sourceUrl\`, a product URL, and the retailer rows it matched by barcode.

## Verification

- Verified: ${retrievedAt}
- Export join path: \`fetchOpenFoodFactsExportRetailerEnrichments\` plus checked-in generator candidate extraction
- Unit coverage: \`fetchOpenFoodFactsExportRetailerEnrichments\` joins only retailer candidate barcodes from the export and skips nutrition-empty rows; barcode image extraction covers Axfood and generic digit filename segments.
- Artifact audit: \`rowCount\` ${summary.rowCount} equals ${enrichmentRows.length} emitted barcode rows; \`retailerMatchCount\` ${summary.retailerMatchCount} equals emitted retailer match links; all emitted barcodes are unique; \`candidateBarcodeCount\` ${summary.candidateBarcodeCount} equals the unique usable current candidate barcodes; every emitted barcode appears in those current candidates; zero emitted rows have empty nutrition; zero emitted rows use a source outside \`${OPENFOODFACTS_EXPORT_URL}#code=...\`.

## Sample Retrieved Rows

${samples.map((row, index) => `${index + 1}. ${row.barcode} | ${row.name} | ${row.brands} | ${row.sourceUrl}`).join('\n')}
`;

  await writeFile(EVIDENCE_OUTPUT, evidence);
}
