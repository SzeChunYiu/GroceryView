import type { PantryItemRecord } from '@groceryview/db';
import type { PantryDeal } from '@groceryview/core';

export type PantryStockStatus = 'healthy' | 'low' | 'depleted';

export type PantryExpiryUrgency = 'expired' | 'use-soon' | 'planned' | 'unknown';

export type PantryExpiryReminder = {
  daysUntilExpiry: number | null;
  label: string;
  urgency: PantryExpiryUrgency;
};

export type PantryMarkdownSuggestion = {
  label: string;
  detail: string;
  percentOff: number;
  shouldPromote: boolean;
};

export type PantryStockItem = {
  productId: string;
  name: string;
  unit: string;
  ownedQuantity: number;
  minimumQuantity: number;
  estimatedDailyUse: number;
  depletionEstimateDays: number | null;
  expiryReminder: PantryExpiryReminder;
  markdownSuggestion: PantryMarkdownSuggestion;
  status: PantryStockStatus;
};

export type PantryConsumptionEvent = {
  productId: string;
  quantity: number;
  source: 'trip' | 'manual';
  label: string;
  occurredAt: string;
};

export type PantryReplacementFilter = {
  replacementId: string;
  label: string;
  categorySlug: string;
  keywords: string[];
};

export type PantryStatusRow = {
  productId: string;
  name: string;
  unit: string;
  remainingQuantity: number;
  minimumQuantity: number;
  daysUntilExpiry?: number | null;
  expiresAt?: string | null;
};

export type PantryDealEvidence = {
  productId: string;
  storeName: string;
  price: number;
  dealScore: number | null;
  href: string;
};

const pantryReplacementFilters: Record<string, Omit<PantryReplacementFilter, 'replacementId'>> = {
  coffee: {
    label: 'Coffee',
    categorySlug: 'coffee-tea',
    keywords: ['coffee', 'kaffe']
  },
  oats: {
    label: 'Oats',
    categorySlug: 'breakfast',
    keywords: ['oats', 'havre', 'havregryn']
  },
  milk: {
    label: 'Milk or fil',
    categorySlug: 'dairy',
    keywords: ['milk', 'mjolk', 'fil', 'yoghurt']
  },
  'frozen-veg': {
    label: 'Frozen vegetables',
    categorySlug: 'frozen',
    keywords: ['frozen', 'vegetable', 'vegetables', 'gronsak', 'wokmix']
  }
};

function normalizeReplacementText(value: string) {
  return value
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function labelFromReplacementToken(token: string) {
  return token.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function buildPantryReplacementFilter(value: string | string[] | undefined): PantryReplacementFilter | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const replacementId = rawValue ? normalizeReplacementText(rawValue) : '';
  if (!replacementId) return null;

  const knownFilter = pantryReplacementFilters[replacementId];
  if (knownFilter) {
    return { replacementId, ...knownFilter };
  }

  return {
    replacementId,
    label: labelFromReplacementToken(replacementId),
    categorySlug: replacementId,
    keywords: replacementId.split('-').filter(Boolean)
  };
}

export function pantryReplacementMatches(
  filter: PantryReplacementFilter,
  row: { productName: string; productSlug: string; categoryLabel?: string; categorySlug?: string }
) {
  if (row.categorySlug === filter.categorySlug) return true;

  const searchableText = [
    row.productName,
    row.productSlug,
    row.categoryLabel,
    row.categorySlug
  ].filter(Boolean).map((part) => normalizeReplacementText(String(part))).join(' ');

  return filter.keywords.some((keyword) => searchableText.includes(normalizeReplacementText(keyword)));
}

function roundQuantity(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function estimateDailyUse(row: PantryStatusRow) {
  const buffer = Math.max(row.remainingQuantity - row.minimumQuantity, row.minimumQuantity);
  return roundQuantity(Math.max(buffer / 7, 0.25));
}

export function estimateDepletionDays(ownedQuantity: number, estimatedDailyUse: number) {
  if (ownedQuantity <= 0) return 0;
  if (estimatedDailyUse <= 0) return null;
  return Math.ceil(ownedQuantity / estimatedDailyUse);
}

export function buildExpiryReminder(row: Pick<PantryStatusRow, 'daysUntilExpiry' | 'expiresAt'>): PantryExpiryReminder {
  const daysUntilExpiry = row.expiresAt
    ? Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 86_400_000)
    : typeof row.daysUntilExpiry === 'number'
      ? Math.ceil(row.daysUntilExpiry)
      : null;

  if (daysUntilExpiry === null || !Number.isFinite(daysUntilExpiry)) {
    return { daysUntilExpiry: null, label: 'No expiry date tracked', urgency: 'unknown' };
  }

  if (daysUntilExpiry < 0) return { daysUntilExpiry, label: `Expired ${Math.abs(daysUntilExpiry)} days ago`, urgency: 'expired' };
  if (daysUntilExpiry === 0) return { daysUntilExpiry, label: 'Expires today', urgency: 'expired' };
  if (daysUntilExpiry <= 7) return { daysUntilExpiry, label: `Use within ${daysUntilExpiry} days`, urgency: 'use-soon' };
  return { daysUntilExpiry, label: `Expires in ${daysUntilExpiry} days`, urgency: 'planned' };
}

export function buildMarkdownSuggestion(reminder: PantryExpiryReminder): PantryMarkdownSuggestion {
  if (reminder.urgency === 'expired') {
    return {
      label: 'Pull from sale or compost check',
      detail: 'Do not suggest a shopper markdown once the tracked expiry date has passed.',
      percentOff: 0,
      shouldPromote: false
    };
  }

  if (reminder.urgency === 'use-soon') {
    const days = reminder.daysUntilExpiry ?? 7;
    const percentOff = days <= 1 ? 50 : days <= 3 ? 35 : 20;
    return {
      label: `${percentOff}% use-soon markdown`,
      detail: 'Suggest a short-dated markdown before adding replacement stock to the list.',
      percentOff,
      shouldPromote: true
    };
  }

  return {
    label: 'No markdown needed',
    detail: 'Expiry is not urgent enough to recommend a markdown.',
    percentOff: 0,
    shouldPromote: false
  };
}

function getStockStatus(ownedQuantity: number, minimumQuantity: number): PantryStockStatus {
  if (ownedQuantity <= 0) return 'depleted';
  if (ownedQuantity <= minimumQuantity) return 'low';
  return 'healthy';
}

export function pantryStatusRowsFromAccountInventory(items: PantryItemRecord[]): PantryStatusRow[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    unit: item.unit,
    remainingQuantity: item.quantity,
    minimumQuantity: item.minimumQuantity,
    expiresAt: item.expiresOn ?? null
  }));
}

export function buildPantryStockItems(rows: PantryStatusRow[]): PantryStockItem[] {
  return rows.map((row) => {
    const ownedQuantity = roundQuantity(row.remainingQuantity);
    const estimatedDailyUse = estimateDailyUse(row);
    const expiryReminder = buildExpiryReminder(row);

    return {
      productId: row.productId,
      name: row.name,
      unit: row.unit,
      ownedQuantity,
      minimumQuantity: row.minimumQuantity,
      estimatedDailyUse,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, estimatedDailyUse),
      expiryReminder,
      markdownSuggestion: buildMarkdownSuggestion(expiryReminder),
      status: getStockStatus(ownedQuantity, row.minimumQuantity)
    };
  });
}

export function applyPantryConsumptionEvents(items: PantryStockItem[], events: PantryConsumptionEvent[]) {
  const consumedByProduct = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.productId] = (acc[event.productId] ?? 0) + Math.max(0, event.quantity);
    return acc;
  }, {});

  return items.map((item) => {
    const ownedQuantity = roundQuantity(item.ownedQuantity - (consumedByProduct[item.productId] ?? 0));

    return {
      ...item,
      ownedQuantity,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, item.estimatedDailyUse),
      status: getStockStatus(ownedQuantity, item.minimumQuantity)
    };
  });
}

export function buildPantryDealEvidence(
  deals: readonly PantryDeal[],
  productId: string,
  href = `/deals?replace=${encodeURIComponent(productId)}`
): PantryDealEvidence | null {
  const bestDeal = deals
    .filter((deal) => deal.productId === productId && deal.storeName.trim().length > 0 && Number.isFinite(deal.price))
    .sort((left, right) => {
      const scoreDelta = (right.dealScore ?? 0) - (left.dealScore ?? 0);
      return scoreDelta === 0 ? left.price - right.price : scoreDelta;
    })[0];

  if (!bestDeal) {
    return null;
  }

  return {
    productId,
    storeName: bestDeal.storeName,
    price: bestDeal.price,
    dealScore: bestDeal.dealScore ?? null,
    href
  };
}

export function buildPantryDealEvidenceMap(
  deals: readonly PantryDeal[],
  productHrefs: Readonly<Record<string, string>>
) {
  return Object.fromEntries(
    Object.entries(productHrefs)
      .map(([productId, href]) => [productId, buildPantryDealEvidence(deals, productId, href)] as const)
      .filter((entry): entry is readonly [string, PantryDealEvidence] => entry[1] !== null)
  );
}
