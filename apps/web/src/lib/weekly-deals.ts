import { weeklyDeals as seedWeeklyDeals, type WeeklyDeal } from './demo-data';

type WeeklyDealsResponse = Readonly<{
  deals?: readonly WeeklyDeal[];
}>;

const apiBaseUrl = process.env.GROCERYVIEW_API_BASE_URL?.trim() ?? '';

function normalizeWeeklyDeals(value: unknown): WeeklyDeal[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is WeeklyDeal => {
      const typed = entry as Partial<WeeklyDeal>;
      return (
        typeof typed.id === 'string' &&
        typeof typed.productId === 'string' &&
        typeof typed.slug === 'string' &&
        typeof typed.productName === 'string' &&
        typeof typed.category === 'string' &&
        typeof typed.store === 'string' &&
        typeof typed.currentPrice === 'number' &&
        typeof typed.regularPrice === 'number' &&
        typeof typed.discountPercent === 'number' &&
        typeof typed.discountAmount === 'number' &&
        typeof typed.expiresAt === 'string'
      );
    })
    .map((entry) => ({
      ...entry,
      category: entry.category,
      store: entry.store,
      discountAmount: Number(entry.discountAmount.toFixed(2))
    }));
}

export async function getWeeklyDealsFromApi(): Promise<readonly WeeklyDeal[]> {
  if (!apiBaseUrl) {
    return seedWeeklyDeals;
  }

  try {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/deals/weekly`, {
      cache: 'no-store',
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return seedWeeklyDeals;
    const payload = (await response.json()) as WeeklyDealsResponse;
    const source = normalizeWeeklyDeals(payload?.deals);
    if (!source.length) return seedWeeklyDeals;
    return source;
  } catch {
    return seedWeeklyDeals;
  }
}
