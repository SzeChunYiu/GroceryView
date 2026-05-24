export const FAVOURITES_STORAGE_KEY = 'groceryview:favourite-products';
export const FAVOURITES_UPDATED_EVENT = 'groceryview:favourite-products-updated';

export type FavouriteProductInput = {
  slug: string;
  name: string;
  imageUrl?: string | null;
};

export type FavouriteProductEntry = {
  slug: string;
  name: string;
  imageUrl: string | null;
  savedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeEntry(value: unknown): FavouriteProductEntry | null {
  if (typeof value === 'string') {
    const slug = value.trim();
    if (!slug) return null;
    return { slug, name: slug, imageUrl: null, savedAt: '' };
  }
  if (!isRecord(value) || typeof value.slug !== 'string') return null;
  const slug = value.slug.trim();
  if (!slug) return null;
  const rawName = typeof value.name === 'string' ? value.name.trim() : '';
  const rawImage = typeof value.imageUrl === 'string' && value.imageUrl.trim() ? value.imageUrl.trim() : null;
  const rawSavedAt = typeof value.savedAt === 'string' ? value.savedAt : '';
  return {
    slug,
    name: rawName || slug,
    imageUrl: rawImage,
    savedAt: rawSavedAt
  };
}

export function parseFavouriteProductEntries(raw: string | null): FavouriteProductEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const bySlug = new Map<string, FavouriteProductEntry>();
    for (const value of parsed) {
      const entry = normalizeEntry(value);
      if (!entry || bySlug.has(entry.slug)) continue;
      bySlug.set(entry.slug, entry);
    }
    return [...bySlug.values()];
  } catch {
    return [];
  }
}

export function serializeFavouriteProductEntries(entries: readonly FavouriteProductEntry[]): string {
  return JSON.stringify(entries.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    imageUrl: entry.imageUrl,
    savedAt: entry.savedAt
  })));
}

type FavouriteProductStorage = Pick<Storage, 'getItem' | 'setItem'> | null | undefined;

function getFavouriteProductStorage(): FavouriteProductStorage {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readFavouriteProductEntries(storage: FavouriteProductStorage = getFavouriteProductStorage()): FavouriteProductEntry[] {
  if (!storage) return [];
  try {
    return parseFavouriteProductEntries(storage.getItem(FAVOURITES_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveFavouriteProductEntries(
  entries: readonly FavouriteProductEntry[],
  storage: FavouriteProductStorage = getFavouriteProductStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(FAVOURITES_STORAGE_KEY, serializeFavouriteProductEntries(entries));
    return true;
  } catch {
    return false;
  }
}

export function isFavouriteProduct(entries: readonly FavouriteProductEntry[], slug: string): boolean {
  return entries.some((entry) => entry.slug === slug);
}

export function toggleFavouriteProduct(
  entries: readonly FavouriteProductEntry[],
  product: FavouriteProductInput,
  savedAt = new Date().toISOString()
): { entries: FavouriteProductEntry[]; isFavourite: boolean } {
  const slug = product.slug.trim();
  if (!slug) return { entries: [...entries], isFavourite: false };
  if (isFavouriteProduct(entries, slug)) {
    return { entries: entries.filter((entry) => entry.slug !== slug), isFavourite: false };
  }

  return {
    entries: [
      {
        slug,
        name: product.name.trim() || slug,
        imageUrl: product.imageUrl ?? null,
        savedAt
      },
      ...entries
    ],
    isFavourite: true
  };
}
