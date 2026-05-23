import { readFile } from 'node:fs/promises';

const INGESTED_DIR = new URL('../../apps/web/src/lib/ingested/', import.meta.url);

const DATASETS = [
  {
    file: 'citygross.ts',
    rows: 'cityGrossProducts',
    source: 'cityGrossSource',
    key: ['sourceUrl', 'code', 'storeId', 'price']
  },
  {
    file: 'coop.ts',
    rows: 'coopProducts',
    source: 'coopSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'coop.ts',
    rows: 'coopWeeklyDiscounts',
    source: 'coopWeeklyDiscountSource',
    key: ['sourceUrl', 'code', 'storeId', 'offerPrice']
  },
  {
    file: 'hemkop.ts',
    rows: 'hemkopProducts',
    source: 'hemkopSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'hemkop.ts',
    rows: 'hemkopWeeklyDiscounts',
    source: 'hemkopWeeklyDiscountSource',
    key: ['sourceUrl', 'code', 'storeId', 'price']
  },
  {
    file: 'ica-reklamblad.ts',
    rows: 'icaReklambladOffers',
    source: 'icaReklambladSource',
    key: ['sourceUrl', 'code', 'storeId', 'priceText']
  },
  {
    file: 'ica.ts',
    rows: 'icaProducts',
    source: 'icaSources',
    sourceRowCount: 'sum',
    key: ['sourceUrl', 'productId', 'storeAccountId', 'price']
  },
  {
    file: 'lidl.ts',
    rows: 'lidlStoreOffers',
    source: 'lidlSource',
    key: ['sourceUrl', 'code', 'storeId', 'price']
  },
  {
    file: 'mathem.ts',
    rows: 'mathemProducts',
    source: 'mathemSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'matpriskollen.ts',
    rows: 'matpriskollenOffers',
    source: 'matpriskollenSource',
    key: ['sourceUrl', 'code', 'storeKey', 'price']
  },
  {
    file: 'matspar.ts',
    rows: 'matsparProducts',
    source: 'matsparSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'openfoodfacts.ts',
    rows: 'openFoodFactsProducts',
    source: 'openFoodFactsSource',
    key: ['sourceUrl', 'barcode']
  },
  {
    file: 'overpass.ts',
    rows: 'overpassStores',
    source: 'overpassSource',
    key: ['sourceUrl', 'osmType', 'osmId']
  },
  {
    file: 'willys.ts',
    rows: 'willysProducts',
    source: 'willysSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'willys.ts',
    rows: 'willysWeeklyDiscounts',
    source: 'willysWeeklyDiscountSource',
    key: ['sourceUrl', 'code', 'storeId', 'price']
  }
];

const summaries = [];
const failures = [];
const icaSourceSummary = await readIcaSourceSummary();

for (const dataset of DATASETS) {
  const text = await readFile(new URL(dataset.file, INGESTED_DIR), 'utf8');
  const rows = extractJsonExport(text, dataset.rows);
  const source = extractJsonExport(text, dataset.source);
  const sourceRowCount = rowCount(source, dataset.sourceRowCount);
  const label = `${dataset.file}:${dataset.rows}`;
  const duplicateKeys = countDuplicates(rows.map((row) => rowKey(row, dataset.key)));
  const missingSourceUrl = rows.filter((row) => !hasText(row.sourceUrl)).length;
  const missingRetrievedAt = rows.filter((row) => !hasText(row.retrievedAt)).length;
  const missingSourceMetadata = sourceUrls(source).length === 0;

  if (sourceRowCount !== rows.length) {
    failures.push(`${label} rowCount mismatch: source metadata=${sourceRowCount}, rows=${rows.length}`);
  }
  if (missingSourceUrl > 0) {
    failures.push(`${label} has ${missingSourceUrl} rows without sourceUrl`);
  }
  if (missingRetrievedAt > 0) {
    failures.push(`${label} has ${missingRetrievedAt} rows without retrievedAt`);
  }
  if (duplicateKeys > 0) {
    failures.push(`${label} has ${duplicateKeys} duplicate provenance/content keys`);
  }
  if (missingSourceMetadata) {
    failures.push(`${label} source metadata does not cite a source URL`);
  }

  summaries.push({
    dataset: label,
    rows: rows.length,
    sourceRowCount,
    missingSourceUrl,
    missingRetrievedAt,
    duplicateKeys,
    sourceMetadataUrlCount: sourceUrls(source).length
  });

  if (dataset.file === 'ica.ts' && dataset.source === 'icaSources') {
    verifyIcaSourceSummary({ source, sourceRowCount, summary: icaSourceSummary });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'fail', failures, summaries }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', summaries }, null, 2));
}

function extractJsonExport(text, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Missing export ${exportName}`);
  }

  const assignmentIndex = text.indexOf('=', markerIndex);
  const start = firstJsonStart(text, assignmentIndex);
  if (start < 0) {
    throw new Error(`Missing JSON value for export ${exportName}`);
  }
  return JSON.parse(text.slice(start, matchingJsonEnd(text, start) + 1));
}

function firstJsonStart(text, fromIndex) {
  const objectStart = text.indexOf('{', fromIndex);
  const arrayStart = text.indexOf('[', fromIndex);
  if (objectStart < 0) return arrayStart;
  if (arrayStart < 0) return objectStart;
  return Math.min(objectStart, arrayStart);
}

function matchingJsonEnd(text, start) {
  const stack = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
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
    } else if (char === '[' || char === '{') {
      stack.push(char);
    } else if (char === ']' || char === '}') {
      const open = stack.pop();
      if ((char === ']' && open !== '[') || (char === '}' && open !== '{')) {
        throw new Error('Invalid JSON-like export shape');
      }
      if (stack.length === 0) {
        return index;
      }
    }
  }

  throw new Error('Could not find JSON export end');
}

function rowCount(source, mode) {
  if (mode === 'sum') {
    return source.reduce((total, item) => total + Number(item.rowCount ?? 0), 0);
  }
  return Number(source.rowCount);
}

function sourceUrls(source) {
  const values = Array.isArray(source) ? source : [source];
  return values.flatMap((item) => [
    item.sourceUrl,
    item.sourceUrlPattern,
    item.storeSourceUrl,
    item.productSearchUrl,
    item.flyerUrl,
    ...(Array.isArray(item.sourceUrls) ? item.sourceUrls : []),
    ...(Array.isArray(item.flyerUrls) ? item.flyerUrls : []),
    ...(Array.isArray(item.flyerPdfUrls) ? item.flyerPdfUrls : []),
    ...(Array.isArray(item.stores) ? sourceUrls(item.stores) : [])
  ]).filter(hasText);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function rowKey(row, fields) {
  return fields.map((field) => String(row[field] ?? '')).join('\u001f');
}

function countDuplicates(keys) {
  const seen = new Set();
  let duplicates = 0;
  for (const key of keys) {
    if (seen.has(key)) {
      duplicates += 1;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}

async function readIcaSourceSummary() {
  const text = await readFile(new URL('ica-source-summary.ts', INGESTED_DIR), 'utf8');
  return {
    totalRowCount: Number(requiredMatch(text, /totalRowCount:\s*(\d+)/, 'ICA source summary totalRowCount')),
    storeEndpointCount: Number(requiredMatch(text, /storeEndpointCount:\s*(\d+)/, 'ICA source summary storeEndpointCount')),
    latestStores: [...text.matchAll(/\{\s*retrievedAt:\s*'([^']+)',\s*rowCount:\s*(\d+),[\s\S]*?sourceUrl:\s*'([^']+)'\s*\}/g)].map((match) => ({
      retrievedAt: match[1],
      rowCount: Number(match[2]),
      sourceUrl: match[3]
    }))
  };
}

function verifyIcaSourceSummary({ source, sourceRowCount, summary }) {
  const label = 'ica-source-summary.ts:icaStorePromotionSourceSummary';

  if (summary.totalRowCount !== sourceRowCount) {
    failures.push(`${label} totalRowCount mismatch: summary=${summary.totalRowCount}, icaSources=${sourceRowCount}`);
  }
  if (summary.storeEndpointCount !== source.length) {
    failures.push(`${label} storeEndpointCount mismatch: summary=${summary.storeEndpointCount}, icaSources=${source.length}`);
  }
  if (summary.latestStores.length === 0) {
    failures.push(`${label} latestStores is empty`);
  }

  const latestSources = source.slice(0, summary.latestStores.length);
  for (const [index, latestStore] of summary.latestStores.entries()) {
    const expected = latestSources[index];
    if (!expected) {
      failures.push(`${label} latestStores[${index}] has no matching icaSources entry`);
      continue;
    }
    for (const field of ['retrievedAt', 'rowCount', 'sourceUrl']) {
      if (latestStore[field] !== expected[field]) {
        failures.push(`${label} latestStores[${index}].${field} mismatch: summary=${latestStore[field]}, icaSources=${expected[field]}`);
      }
    }
  }

  summaries.push({
    dataset: label,
    totalRowCount: summary.totalRowCount,
    storeEndpointCount: summary.storeEndpointCount,
    latestStoreCount: summary.latestStores.length
  });
}

function requiredMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label}`);
  }
  return match[1];
}
