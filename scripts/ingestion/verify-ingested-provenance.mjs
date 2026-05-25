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
    file: 'okq8-fuel-prices.ts',
    rows: 'okq8FuelPriceObservations',
    source: 'okq8FuelPriceSource',
    key: ['sourceUrl', 'productId', 'effectiveFrom', 'pricePerLitre']
  },
  {
    file: 'st1-fuel-prices.ts',
    rows: 'st1FuelPriceObservations',
    source: 'st1FuelPriceSource',
    key: ['sourceUrl', 'grade', 'validFrom', 'pricePerLitre']
  },
  {
    file: 'mathem.ts',
    rows: 'mathemProducts',
    source: 'mathemSource',
    key: ['sourceUrl', 'code', 'price']
  },
  {
    file: 'apohem.ts',
    rows: 'apohemProducts',
    source: 'apohemSource',
    key: ['sourceUrl', 'chain', 'code', 'ean', 'price']
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
    file: 'seven-eleven-se.ts',
    rows: 'sevenElevenSeProducts',
    source: 'sevenElevenSeSource',
    key: ['sourceUrl', 'pdfUrl', 'productId', 'priceText']
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

for (const dataset of DATASETS) {
  const fileUrl = new URL(dataset.file, INGESTED_DIR);
  const text = await readFile(fileUrl, 'utf8');
  const rows = await extractJsonExport(text, dataset.rows, fileUrl);
  const source = await extractJsonExport(text, dataset.source, fileUrl);
  const sourceRowCount = rowCount(source, dataset.sourceRowCount);
  const label = `${dataset.file}:${dataset.rows}`;
  const duplicateKeys = countDuplicates(rows.map((row) => rowKey(row, dataset.key)));
  const missingSourceUrl = rows.filter((row) => !hasText(row.sourceUrl)).length;
  const missingRetrievedAt = rows.filter((row) => !hasText(row.retrievedAt)).length;
  const invalidSourceUrl = rows.filter((row) => hasText(row.sourceUrl) && !isHttpUrl(row.sourceUrl)).length;
  const invalidRetrievedAt = rows.filter((row) => hasText(row.retrievedAt) && !isIsoDateTime(row.retrievedAt)).length;
  const missingSourceMetadata = sourceUrls(source).length === 0;
  const invalidSourceMetadataUrl = sourceUrls(source).filter((url) => !isHttpUrl(url)).length;
  const missingSourceRetrievedAt = sourceMetadataItems(source).filter((item) => !hasText(item.retrievedAt)).length;
  const invalidSourceRetrievedAt = sourceMetadataItems(source).filter((item) => hasText(item.retrievedAt) && !isIsoDateTime(item.retrievedAt)).length;
  const header = headerProvenance(text);
  const missingHeaderSourceUrl = header.sourceUrlCount === 0;
  const missingHeaderRetrievedAt = header.retrievedAtCount === 0;

  if (sourceRowCount !== rows.length) {
    failures.push(`${label} rowCount mismatch: source metadata=${sourceRowCount}, rows=${rows.length}`);
  }
  if (missingSourceUrl > 0) {
    failures.push(`${label} has ${missingSourceUrl} rows without sourceUrl`);
  }
  if (missingRetrievedAt > 0) {
    failures.push(`${label} has ${missingRetrievedAt} rows without retrievedAt`);
  }
  if (invalidSourceUrl > 0) {
    failures.push(`${label} has ${invalidSourceUrl} rows with non-HTTP sourceUrl`);
  }
  if (invalidRetrievedAt > 0) {
    failures.push(`${label} has ${invalidRetrievedAt} rows with non-ISO retrievedAt`);
  }
  if (duplicateKeys > 0) {
    failures.push(`${label} has ${duplicateKeys} duplicate provenance/content keys`);
  }
  if (missingSourceMetadata) {
    failures.push(`${label} source metadata does not cite a source URL`);
  }
  if (missingHeaderSourceUrl) {
    failures.push(`${label} file header does not cite a source URL`);
  }
  if (missingHeaderRetrievedAt) {
    failures.push(`${label} file header does not cite retrievedAt`);
  }
  if (invalidSourceMetadataUrl > 0) {
    failures.push(`${label} source metadata has ${invalidSourceMetadataUrl} non-HTTP URL values`);
  }
  if (missingSourceRetrievedAt > 0) {
    failures.push(`${label} source metadata has ${missingSourceRetrievedAt} item(s) without retrievedAt`);
  }
  if (invalidSourceRetrievedAt > 0) {
    failures.push(`${label} source metadata has ${invalidSourceRetrievedAt} item(s) with non-ISO retrievedAt`);
  }

  summaries.push({
    dataset: label,
    rows: rows.length,
    sourceRowCount,
    missingSourceUrl,
    missingRetrievedAt,
    invalidSourceUrl,
    invalidRetrievedAt,
    duplicateKeys,
    sourceMetadataUrlCount: sourceUrls(source).length,
    headerSourceUrlCount: header.sourceUrlCount,
    headerRetrievedAtCount: header.retrievedAtCount,
    invalidSourceMetadataUrl,
    missingSourceRetrievedAt,
    invalidSourceRetrievedAt
  });
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'fail', failures, summaries }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', summaries }, null, 2));
}

async function extractJsonExport(text, exportName, fileUrl) {
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
  const valueText = text.slice(start, matchingJsonEnd(text, start) + 1);
  try {
    return JSON.parse(valueText);
  } catch (error) {
    const spreadNames = arraySpreadNames(valueText);
    if (spreadNames.length === 0 || !fileUrl) throw error;
    const chunks = [];
    for (const spreadName of spreadNames) {
      const chunkUrl = resolveNamedImport(text, spreadName, fileUrl);
      const chunkText = await readFile(chunkUrl, 'utf8');
      chunks.push(...await extractJsonExport(chunkText, spreadName, chunkUrl));
    }
    return chunks;
  }
}

function arraySpreadNames(valueText) {
  const trimmed = valueText.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [];
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  const names = [];
  for (const part of body.split(',')) {
    const match = part.trim().match(/^\.\.\.([A-Za-z_$][\w$]*)$/);
    if (!match) return [];
    names.push(match[1]);
  }
  return names;
}

function resolveNamedImport(text, importName, fileUrl) {
  const pattern = new RegExp(`import\\s+\\{\\s*${importName}\\s*\\}\\s+from\\s+['"]([^'"]+)['"]`);
  const match = text.match(pattern);
  if (!match) throw new Error(`Missing import for spread export ${importName}`);
  const specifier = match[1].endsWith('.ts') ? match[1] : `${match[1]}.ts`;
  return new URL(specifier, fileUrl);
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
  return sourceMetadataItems(source).flatMap((item) => [
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

function sourceMetadataItems(source) {
  return Array.isArray(source) ? source : [source];
}

function headerProvenance(text) {
  const headerLines = text.split('\n').slice(0, 80).filter((line) => line.startsWith('//'));
  const sourceUrlCount = headerLines.filter((line) => /https?:\/\//u.test(line)).length;
  const retrievedAtCount = headerLines.filter((line) => (
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/u.test(line)
  )).length;
  return { sourceUrlCount, retrievedAtCount };
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isIsoDateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
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
