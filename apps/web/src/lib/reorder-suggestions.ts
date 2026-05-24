export type ReorderSuggestionStatus = 'due' | 'soon';

export type PurchaseHistoryReorderCandidate = {
  id: string;
  name: string;
  productSlug: string;
  quantity: string;
  lastPurchasedAt: string;
  purchaseCount: number;
  purchaseFrequencyDays: number;
};

export type ReorderSuggestion = PurchaseHistoryReorderCandidate & {
  daysSinceLastPurchase: number;
  dueInDays: number;
  frequencyLabel: string;
  recencyLabel: string;
  reasonLabel: string;
  status: ReorderSuggestionStatus;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REORDER_AS_OF = '2026-05-24';

const purchaseHistoryReorderCandidates: PurchaseHistoryReorderCandidate[] = [
  {
    id: 'reorder-makaroner-pasta-weekly',
    name: 'Makaroner Pasta',
    productSlug: 'makaroner-pasta-101302991-st',
    quantity: '1 package',
    lastPurchasedAt: '2026-05-15',
    purchaseCount: 6,
    purchaseFrequencyDays: 7
  },
  {
    id: 'reorder-havregryn-extra-fylliga',
    name: 'Havregryn Extra Fylliga',
    productSlug: 'havregryn-extra-fylliga-101758934-st',
    quantity: '1 bag',
    lastPurchasedAt: '2026-05-13',
    purchaseCount: 5,
    purchaseFrequencyDays: 10
  },
  {
    id: 'reorder-langkorningt-ris',
    name: 'Långkornigt Ris',
    productSlug: 'l-ngkornigt-ris-101352143-st',
    quantity: '1 bag',
    lastPurchasedAt: '2026-05-05',
    purchaseCount: 3,
    purchaseFrequencyDays: 21
  }
];

function daysBetweenDates(fromDate: string, toDate: string) {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / DAY_MS));
}

function buildReorderSuggestion(candidate: PurchaseHistoryReorderCandidate): ReorderSuggestion | null {
  const daysSinceLastPurchase = daysBetweenDates(candidate.lastPurchasedAt, REORDER_AS_OF);
  const dueInDays = candidate.purchaseFrequencyDays - daysSinceLastPurchase;
  if (dueInDays > 3) return null;
  const status: ReorderSuggestionStatus = dueInDays <= 0 ? 'due' : 'soon';
  const frequencyLabel = `Bought ${candidate.purchaseCount}x · about every ${candidate.purchaseFrequencyDays} days`;
  const recencyLabel = `Last bought ${daysSinceLastPurchase} days ago`;
  const reasonLabel = status === 'due'
    ? `${frequencyLabel}; ${recencyLabel}, so it is due to reorder.`
    : `${frequencyLabel}; ${recencyLabel}, so it is coming due in ${dueInDays} day${dueInDays === 1 ? '' : 's'}.`;

  return {
    ...candidate,
    daysSinceLastPurchase,
    dueInDays,
    frequencyLabel,
    recencyLabel,
    reasonLabel,
    status
  };
}

export const purchaseHistoryReorderSuggestions = purchaseHistoryReorderCandidates
  .map(buildReorderSuggestion)
  .filter((suggestion): suggestion is ReorderSuggestion => suggestion !== null)
  .sort((left, right) => left.dueInDays - right.dueInDays || right.purchaseCount - left.purchaseCount);

export function reorderSuggestionForProductSlug(productSlug: string) {
  return purchaseHistoryReorderSuggestions.find((suggestion) => suggestion.productSlug === productSlug) ?? null;
}
