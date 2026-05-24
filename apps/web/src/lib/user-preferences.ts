export const hiddenRecommendationPreferenceEvent = 'groceryview:hidden-recommendation-preferences-changed';

const hiddenRecommendationProductStorageKey = 'groceryview:hidden-recommendation-product-slugs';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type ProductPreferenceTarget = Readonly<{
  productSlug?: string | null;
  slug?: string | null;
}>;

function preferenceStorage(): PreferenceStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function productPreferenceKey(target: ProductPreferenceTarget) {
  return (target.productSlug ?? target.slug ?? '').trim().toLowerCase();
}

export function parseHiddenRecommendationProductSlugs(value: string | null) {
  if (!value) return new Set<string>();

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.map((item) => String(item).trim().toLowerCase()).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

export function getHiddenRecommendationProductSlugs(storage = preferenceStorage()) {
  if (!storage) return new Set<string>();
  return parseHiddenRecommendationProductSlugs(storage.getItem(hiddenRecommendationProductStorageKey));
}

function persistHiddenRecommendationProductSlugs(slugs: Set<string>, storage = preferenceStorage()) {
  if (!storage) return;
  storage.setItem(hiddenRecommendationProductStorageKey, JSON.stringify([...slugs].sort()));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(hiddenRecommendationPreferenceEvent));
}

export function productMatchesHiddenRecommendationPreference(target: ProductPreferenceTarget, hiddenSlugs: Set<string>) {
  const key = productPreferenceKey(target);
  return key.length > 0 && hiddenSlugs.has(key);
}

export function hideRecommendationProduct(target: ProductPreferenceTarget, storage = preferenceStorage()) {
  const key = productPreferenceKey(target);
  if (!key) return;
  const hiddenSlugs = getHiddenRecommendationProductSlugs(storage);
  hiddenSlugs.add(key);
  persistHiddenRecommendationProductSlugs(hiddenSlugs, storage);
}

export function restoreRecommendationProduct(target: ProductPreferenceTarget, storage = preferenceStorage()) {
  const key = productPreferenceKey(target);
  if (!key) return;
  const hiddenSlugs = getHiddenRecommendationProductSlugs(storage);
  hiddenSlugs.delete(key);
  persistHiddenRecommendationProductSlugs(hiddenSlugs, storage);
}
