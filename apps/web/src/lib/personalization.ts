import { matchPurchaseHistoryRowToProduct, type PurchaseHistoryProductMatch } from './normalization';

export type HouseholdCategorySignal = {
  householdId: string;
  categorySlug: string;
  clicks: number;
  conversions: number;
};

export type DietaryPreferenceOption = {
  value: string;
  label: string;
  helper: string;
};

export type DietaryPreferenceOnboardingContract = {
  endpoint: '/api/account/dietary-preferences';
  fields: Array<'dietaryRestrictions' | 'avoidedIngredients' | 'certificationPreferences'>;
  dietaryRestrictions: DietaryPreferenceOption[];
  avoidedIngredients: DietaryPreferenceOption[];
  certificationPreferences: DietaryPreferenceOption[];
  personalizationSurfaces: string[];
  guardrails: string[];
};

export type PurchaseHistoryImportRow = {
  purchasedAt: string;
  productName: string;
  storeName: string;
  quantity: number;
  totalSpend: number;
  productMatch: PurchaseHistoryProductMatch | null;
};

export type PurchaseHistoryImportPreview = {
  rows: PurchaseHistoryImportRow[];
  recurringCandidates: Array<{
    productName: string;
    productId?: string;
    matchScore: number;
    purchaseCount: number;
    totalSpend: number;
    recommendationSeed: string;
    budgetSeedLabel: string;
  }>;
  totalSpend: number;
};

export type PurchaseHistoryPersonalizationSeed = {
  accountId: string;
  source: 'purchase-history-csv';
  rowCount: number;
  stapleSeeds: Array<{
    productName: string;
    productId?: string;
    purchaseCount: number;
    quantity: number;
    recommendationSeed: string;
  }>;
  favoriteProductSeeds: Array<{
    productName: string;
    productId?: string;
    score: number;
    evidenceLabel: string;
  }>;
  brandPreferenceSeeds: PreferredBrandControl[];
  budgetSeeds: Array<{
    storeName: string;
    totalSpend: number;
    rowCount: number;
    budgetSeedLabel: string;
  }>;
  guardrails: string[];
};

export const defaultHouseholdId = 'stockholm-family-demo';

const purchaseHistoryCatalog = [
  { name: 'Milk 1L', productId: 'milk-1l', aliases: ['mjolk', 'milk'] },
  { name: 'Eggs 12-pack', productId: 'eggs-12-pack', aliases: ['egg', 'eggs', 'agg'] },
  { name: 'Sourdough bread', productId: 'bread-sourdough', aliases: ['bread', 'brod', 'sourdough'] },
  { name: 'Kaffe', productId: 'kaffe', aliases: ['coffee', 'bryggkaffe'] },
  { name: 'Havregryn Extra Fylliga', productId: 'havregryn-extra-fylliga-101758934-st', aliases: ['oats', 'oatmeal', 'havregryn'] },
  { name: 'Garant Pasta', productId: 'garant-pasta', aliases: ['garant pasta', 'pasta', 'makaroner'] },
  { name: 'Änglamark Bananas', productId: 'anglamark-bananas', aliases: ['anglamark banana', 'anglamark banan', 'banan'] },
  { name: 'ICA Basic Tomatoes', productId: 'ica-basic-tomatoes', aliases: ['ica basic tomato', 'tomat'] }
];

const knownPurchaseBrands = ['Garant', 'Änglamark', 'ICA Basic', 'ICA', 'Coop', 'Willys', 'Eldorado', 'Familjefavoriter'];

const purchaseHistoryImportGuardrails = [
  'Purchase history imports seed personalization only after a signed-in shopper reviews the CSV preview.',
  'Staples, favorites, and brand preferences are inferred from imported purchase rows, not from public browsing.',
  'CSV rows never create automatic purchases, retailer orders, or health and dietary assumptions.'
];

export const householdCategorySignals: HouseholdCategorySignal[] = [
  { householdId: defaultHouseholdId, categorySlug: 'mejeri-ost-agg', clicks: 18, conversions: 7 },
  { householdId: defaultHouseholdId, categorySlug: 'frukt-gront', clicks: 16, conversions: 6 },
  { householdId: defaultHouseholdId, categorySlug: 'brod-bageri', clicks: 10, conversions: 5 },
  { householdId: 'new-arrival-demo', categorySlug: 'varldens-mat', clicks: 22, conversions: 8 },
  { householdId: 'new-arrival-demo', categorySlug: 'skafferi', clicks: 14, conversions: 6 },
  { householdId: 'new-arrival-demo', categorySlug: 'frys', clicks: 9, conversions: 3 },
];

export const dietaryPreferenceOnboardingContract: DietaryPreferenceOnboardingContract = {
  endpoint: '/api/account/dietary-preferences',
  fields: ['dietaryRestrictions', 'avoidedIngredients', 'certificationPreferences'],
  dietaryRestrictions: [
    { value: 'vegetarian', label: 'Vegetarian', helper: 'Prefer meat-free recipes, swaps, and basket ideas.' },
    { value: 'vegan', label: 'Vegan', helper: 'Require plant-based alternatives before recommendations are ranked.' },
    { value: 'gluten_free', label: 'Gluten-free', helper: 'Keep products without verified gluten-free evidence out of default matches.' },
    { value: 'lactose_free', label: 'Lactose-free', helper: 'Prefer dairy rows with explicit lactose-free evidence.' }
  ],
  avoidedIngredients: [
    { value: 'peanuts', label: 'Peanuts', helper: 'Warn before products with peanut allergen evidence are recommended.' },
    { value: 'tree_nuts', label: 'Tree nuts', helper: 'Treat nut evidence as a default exclusion for search and baskets.' },
    { value: 'shellfish', label: 'Shellfish', helper: 'Exclude shellfish evidence from meal and substitution suggestions.' },
    { value: 'pork', label: 'Pork', helper: 'Avoid pork ingredients for religious or lifestyle preferences.' }
  ],
  certificationPreferences: [
    { value: 'halal', label: 'Halal', helper: 'Prefer explicit halal certification or store-confirmation steps.' },
    { value: 'kosher', label: 'Kosher', helper: 'Prefer package-label evidence before surfacing product matches.' },
    { value: 'organic', label: 'Organic', helper: 'Promote verified organic labels when price and stock evidence are available.' },
    { value: 'keyhole', label: 'Keyhole', helper: 'Prefer verified Nordic Keyhole labels for health-oriented filters.' }
  ],
  personalizationSurfaces: [
    'search filters',
    'recommendation ranking',
    'price alerts',
    'weekly basket warnings'
  ],
  guardrails: [
    'Preferences are saved only for a signed-in account.',
    'Health, religious, and lifestyle needs are never inferred from browsing or purchase history.',
    'Certification preferences require verified product label evidence or an explicit store-confirmation step.'
  ]
};

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, '').trim());
}

function normalizePurchaseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function purchaseProductKey(row: PurchaseHistoryImportRow) {
  return row.productMatch?.productId ?? row.productName.trim().toLocaleLowerCase('sv-SE');
}

function brandForProduct(productName: string) {
  const normalized = productName.trim().toLocaleLowerCase('sv-SE');
  return knownPurchaseBrands.find((brand) => normalized.includes(brand.toLocaleLowerCase('sv-SE')));
}

export function parsePurchaseHistoryCsv(csv: string): PurchaseHistoryImportRow[] {
  const [headerLine, ...lines] = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine).map((header) => header.toLocaleLowerCase('sv-SE'));
  const indexFor = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const dateIndex = indexFor('date', 'purchased_at', 'purchasedat');
  const productIndex = indexFor('product', 'product_name', 'productname', 'item', 'description');
  const storeIndex = indexFor('store', 'store_name', 'storename', 'chain', 'retailer');
  const quantityIndex = indexFor('quantity', 'qty', 'count');
  const totalIndex = indexFor('total', 'total_spend', 'totalspend', 'amount', 'paid');

  return lines
    .map((line) => {
      const cells = parseCsvLine(line);
      const productName = cells[productIndex]?.trim();
      if (!productName) return null;
      const quantity = normalizePurchaseNumber(cells[quantityIndex], 1);
      const totalSpend = normalizePurchaseNumber(cells[totalIndex], 0);
      return {
        purchasedAt: cells[dateIndex] || 'date not provided',
        productName,
        storeName: cells[storeIndex] || 'store not provided',
        quantity: quantity > 0 ? quantity : 1,
        totalSpend: totalSpend >= 0 ? totalSpend : 0,
        productMatch: matchPurchaseHistoryRowToProduct(productName, purchaseHistoryCatalog)
      };
    })
    .filter((row): row is PurchaseHistoryImportRow => row !== null);
}

export function buildPurchaseHistoryImportPreview(rows: readonly PurchaseHistoryImportRow[]): PurchaseHistoryImportPreview {
  const grouped = new Map<string, PurchaseHistoryImportRow[]>();
  for (const row of rows) {
    const key = purchaseProductKey(row);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  const recurringCandidates = Array.from(grouped.values())
    .map((productRows) => {
      const totalSpend = productRows.reduce((sum, row) => sum + row.totalSpend, 0);
      const firstRow = productRows[0]!;
      return {
        productName: firstRow.productMatch?.productName ?? firstRow.productName,
        productId: firstRow.productMatch?.productId,
        matchScore: firstRow.productMatch?.matchScore ?? 0,
        purchaseCount: productRows.length,
        totalSpend,
        recommendationSeed: `${productRows.length} historical purchase${productRows.length === 1 ? '' : 's'} for recommendation ranking`,
        budgetSeedLabel: `${totalSpend.toFixed(2)} SEK imported budget history`
      };
    })
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.totalSpend - a.totalSpend || a.productName.localeCompare(b.productName, 'sv'))
    .slice(0, 6);

  return {
    rows: [...rows],
    recurringCandidates,
    totalSpend: rows.reduce((sum, row) => sum + row.totalSpend, 0)
  };
}

export function buildPurchaseHistoryPersonalizationSeed(
  rows: readonly PurchaseHistoryImportRow[],
  accountId = 'signed-in-user',
): PurchaseHistoryPersonalizationSeed {
  const groupedProducts = new Map<string, PurchaseHistoryImportRow[]>();
  const groupedStores = new Map<string, PurchaseHistoryImportRow[]>();
  const groupedBrands = new Map<string, PurchaseHistoryImportRow[]>();

  for (const row of rows) {
    groupedProducts.set(purchaseProductKey(row), [...(groupedProducts.get(purchaseProductKey(row)) ?? []), row]);
    groupedStores.set(row.storeName, [...(groupedStores.get(row.storeName) ?? []), row]);
    const brand = brandForProduct(row.productName);
    if (brand) groupedBrands.set(brand, [...(groupedBrands.get(brand) ?? []), row]);
  }

  const productSeedInputs = Array.from(groupedProducts.values()).map((productRows) => {
    const totalSpend = productRows.reduce((sum, row) => sum + row.totalSpend, 0);
    const quantity = productRows.reduce((sum, row) => sum + row.quantity, 0);
    const firstRow = productRows[0]!;
    const productName = firstRow.productMatch?.productName ?? firstRow.productName;
    const productId = firstRow.productMatch?.productId;
    const purchaseCount = productRows.length;
    return { productName, productId, purchaseCount, quantity, totalSpend };
  });

  const stapleSeeds = productSeedInputs
    .filter((seed) => seed.purchaseCount >= 2 || seed.quantity >= 2)
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.quantity - a.quantity || b.totalSpend - a.totalSpend)
    .slice(0, 8)
    .map((seed) => ({
      productName: seed.productName,
      productId: seed.productId,
      purchaseCount: seed.purchaseCount,
      quantity: seed.quantity,
      recommendationSeed: `${seed.purchaseCount} purchase${seed.purchaseCount === 1 ? '' : 's'} and ${seed.quantity} imported unit${seed.quantity === 1 ? '' : 's'} mark this as a staple candidate`
    }));

  const favoriteProductSeeds = productSeedInputs
    .map((seed) => ({
      productName: seed.productName,
      productId: seed.productId,
      score: Math.round(seed.purchaseCount * 20 + seed.quantity * 5 + seed.totalSpend / 10),
      evidenceLabel: `${seed.purchaseCount} purchase${seed.purchaseCount === 1 ? '' : 's'} · ${seed.totalSpend.toFixed(2)} SEK imported spend`
    }))
    .sort((a, b) => b.score - a.score || a.productName.localeCompare(b.productName, 'sv'))
    .slice(0, 8);

  const brandPreferenceSeeds = Array.from(groupedBrands.entries())
    .map(([brand, brandRows]) => ({
      brand,
      tolerance: 'favorite' as BrandTolerance,
      note: `${brandRows.length} imported purchase${brandRows.length === 1 ? '' : 's'} support ranking ${brand} first when verified alternatives exist.`
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand, 'sv'))
    .slice(0, 6);

  const budgetSeeds = Array.from(groupedStores.entries())
    .map(([storeName, storeRows]) => {
      const totalSpend = storeRows.reduce((sum, row) => sum + row.totalSpend, 0);
      return {
        storeName,
        totalSpend,
        rowCount: storeRows.length,
        budgetSeedLabel: `${totalSpend.toFixed(2)} SEK over ${storeRows.length} imported row${storeRows.length === 1 ? '' : 's'}`
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend || a.storeName.localeCompare(b.storeName, 'sv'))
    .slice(0, 6);

  return {
    accountId,
    source: 'purchase-history-csv',
    rowCount: rows.length,
    stapleSeeds,
    favoriteProductSeeds,
    brandPreferenceSeeds,
    budgetSeeds,
    guardrails: purchaseHistoryImportGuardrails
  };
}

type CategoryRankInput = {
  slug: string;
};

type LandingShortcutInput = {
  href: string;
  categorySlug?: string;
};

const conversionWeight = 4;
const demoHistoryWeights = [
  { clicks: 12, conversions: 4 },
  { clicks: 18, conversions: 7 },
  { clicks: 10, conversions: 5 },
  { clicks: 16, conversions: 6 },
  { clicks: 8, conversions: 3 },
  { clicks: 6, conversions: 2 },
  { clicks: 4, conversions: 1 },
  { clicks: 2, conversions: 1 },
];

export function buildDemoHouseholdCategorySignals<T extends CategoryRankInput>(
  categories: readonly T[],
  householdId = defaultHouseholdId,
) {
  return categories.slice(0, demoHistoryWeights.length).map((category, index) => {
    const weight = demoHistoryWeights[index] ?? { clicks: 0, conversions: 0 };
    return {
      householdId,
      categorySlug: category.slug,
      clicks: weight.clicks,
      conversions: weight.conversions,
    };
  });
}

export function getHouseholdCategoryScore(
  categorySlug: string,
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  const signal = signals.find((entry) => entry.householdId === householdId && entry.categorySlug === categorySlug);
  return signal ? signal.conversions * conversionWeight + signal.clicks : 0;
}

export function rankCategoriesByPurchaseHistory<T extends CategoryRankInput>(
  categories: readonly T[],
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  return categories
    .map((category, index) => ({ category, index, score: getHouseholdCategoryScore(category.slug, householdId, signals) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ category }) => category);
}

export function rankLandingShortcuts<T extends LandingShortcutInput>(
  shortcuts: readonly T[],
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  return shortcuts
    .map((shortcut, index) => {
      const slug = shortcut.categorySlug ?? shortcut.href.split('/').filter(Boolean).pop() ?? '';
      return { shortcut, index, score: getHouseholdCategoryScore(slug, householdId, signals) };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ shortcut }) => shortcut);
}

export type BrandTolerance = 'favorite' | 'acceptable' | 'excluded';

export type PreferredBrandControl = {
  brand: string;
  tolerance: BrandTolerance;
  note: string;
};

export const demoPreferredBrandControls: PreferredBrandControl[] = [
  { brand: 'Garant', tolerance: 'favorite', note: 'Prioritize for pantry staples and dairy swaps.' },
  { brand: 'Änglamark', tolerance: 'favorite', note: 'Prefer when organic substitutes are available.' },
  { brand: 'ICA Basic', tolerance: 'acceptable', note: 'Show when savings are meaningful and ratings stay strong.' },
  { brand: 'Unknown private label', tolerance: 'excluded', note: 'Hide from automatic substitutions until reviewed.' },
];

export function groupPreferredBrandControls(controls: readonly PreferredBrandControl[] = demoPreferredBrandControls) {
  return {
    favorite: controls.filter((control) => control.tolerance === 'favorite'),
    acceptable: controls.filter((control) => control.tolerance === 'acceptable'),
    excluded: controls.filter((control) => control.tolerance === 'excluded'),
  };
}

export function scoreBrandTolerance(brand: string | null | undefined, controls: readonly PreferredBrandControl[] = demoPreferredBrandControls) {
  const normalizedBrand = (brand ?? '').trim().toLocaleLowerCase('sv-SE');
  const match = controls.find((control) => control.brand.trim().toLocaleLowerCase('sv-SE') === normalizedBrand);
  if (!match) return { tolerance: 'acceptable' as BrandTolerance, score: 0 };
  if (match.tolerance === 'favorite') return { tolerance: match.tolerance, score: 30 };
  if (match.tolerance === 'excluded') return { tolerance: match.tolerance, score: -100 };
  return { tolerance: match.tolerance, score: 5 };
}
