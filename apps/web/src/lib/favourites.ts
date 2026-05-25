export const FAVOURITES_STORAGE_KEY = 'groceryview:favourite-products';
export const FAVOURITE_BRANDS_STORAGE_KEY = 'groceryview:favourite-brand-preferences';
export const FAVOURITES_UPDATED_EVENT = 'groceryview:favourite-products-updated';
export const FAVOURITE_BRAND_REMOVALS_STORAGE_KEY = 'groceryview:favourite-brand-removals';
export const FAVOURITE_BRANDS_UPDATED_EVENT = 'groceryview:favourite-brand-preferences-updated';
const maxFavouriteBrandRemovals = 20;

export type FavouriteProductInput = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  brand?: string | null;
};

export type FavouriteProductEntry = {
  slug: string;
  name: string;
  imageUrl: string | null;
  brand: string | null;
  savedAt: string;
};

export type FavouriteBrandRemovalEntry = {
  brand: string;
  slug: string;
  removedAt: string;
};

export type FavouriteBrandPreference = 'preferred' | 'avoided';

export type FavouriteBrandPreferenceEntry = {
  brand: string;
  preference: FavouriteBrandPreference;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeBrandRemovalEntry(value: unknown): FavouriteBrandRemovalEntry | null {
  if (!isRecord(value)) return null;
  const brand = typeof value.brand === 'string' ? value.brand.trim() : '';
  const slug = typeof value.slug === 'string' ? value.slug.trim() : '';
  const removedAt = typeof value.removedAt === 'string' ? value.removedAt : '';
  if (!brand || !slug) return null;
  return { brand, slug, removedAt };
}

function normalizeEntry(value: unknown): FavouriteProductEntry | null {
  if (typeof value === 'string') {
    const slug = value.trim();
    if (!slug) return null;
    return { slug, name: slug, imageUrl: null, brand: null, savedAt: '' };
  }
  if (!isRecord(value) || typeof value.slug !== 'string') return null;
  const slug = value.slug.trim();
  if (!slug) return null;
  const rawName = typeof value.name === 'string' ? value.name.trim() : '';
  const rawImage = typeof value.imageUrl === 'string' && value.imageUrl.trim() ? value.imageUrl.trim() : null;
  const rawBrand = typeof value.brand === 'string' && value.brand.trim() ? value.brand.trim() : null;
  const rawSavedAt = typeof value.savedAt === 'string' ? value.savedAt : '';
  return {
    slug,
    name: rawName || slug,
    imageUrl: rawImage,
    brand: rawBrand,
    savedAt: rawSavedAt
  };
}

function normalizeBrandPreference(value: unknown): FavouriteBrandPreferenceEntry | null {
  if (!isRecord(value) || typeof value.brand !== 'string') return null;
  const brand = value.brand.trim();
  if (!brand) return null;
  const preference = value.preference === 'avoided' ? 'avoided' : value.preference === 'preferred' ? 'preferred' : null;
  if (!preference) return null;
  return {
    brand,
    preference,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
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
    brand: entry.brand,
    savedAt: entry.savedAt
  })));
}

export function parseFavouriteBrandPreferenceEntries(raw: string | null): FavouriteBrandPreferenceEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const byBrand = new Map<string, FavouriteBrandPreferenceEntry>();
    for (const value of parsed) {
      const entry = normalizeBrandPreference(value);
      if (!entry) continue;
      byBrand.set(entry.brand.toLocaleLowerCase('sv-SE'), entry);
    }
    return [...byBrand.values()];
  } catch {
    return [];
  }
}

export function serializeFavouriteBrandPreferenceEntries(entries: readonly FavouriteBrandPreferenceEntry[]): string {
  return JSON.stringify(entries.map((entry) => ({
    brand: entry.brand,
    preference: entry.preference,
    updatedAt: entry.updatedAt
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

export function readFavouriteBrandPreferenceEntries(storage: FavouriteProductStorage = getFavouriteProductStorage()): FavouriteBrandPreferenceEntry[] {
  if (!storage) return [];
  try {
    return parseFavouriteBrandPreferenceEntries(storage.getItem(FAVOURITE_BRANDS_STORAGE_KEY));
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

export function parseFavouriteBrandRemovalEntries(raw: string | null): FavouriteBrandRemovalEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeBrandRemovalEntry)
      .filter((entry): entry is FavouriteBrandRemovalEntry => Boolean(entry))
      .slice(0, maxFavouriteBrandRemovals);
  } catch {
    return [];
  }
}

export function readFavouriteBrandRemovalEntries(storage: FavouriteProductStorage = getFavouriteProductStorage()): FavouriteBrandRemovalEntry[] {
  if (!storage) return [];
  try {
    return parseFavouriteBrandRemovalEntries(storage.getItem(FAVOURITE_BRAND_REMOVALS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function rememberFavouriteBrandRemoval(
  product: FavouriteProductInput,
  removedAt = new Date().toISOString(),
  storage: FavouriteProductStorage = getFavouriteProductStorage()
): FavouriteBrandRemovalEntry[] {
  const brand = product.brand?.trim();
  const slug = product.slug.trim();
  if (!storage || !brand || !slug) return readFavouriteBrandRemovalEntries(storage);
  const next = [
    { brand, slug, removedAt },
    ...readFavouriteBrandRemovalEntries(storage).filter(
      (entry) => entry.slug !== slug || entry.brand.toLocaleLowerCase('sv-SE') !== brand.toLocaleLowerCase('sv-SE')
    )
  ].slice(0, maxFavouriteBrandRemovals);
  try {
    storage.setItem(FAVOURITE_BRAND_REMOVALS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    return readFavouriteBrandRemovalEntries(storage);
  }
  return next;
}

export function saveFavouriteBrandPreferenceEntries(
  entries: readonly FavouriteBrandPreferenceEntry[],
  storage: FavouriteProductStorage = getFavouriteProductStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(FAVOURITE_BRANDS_STORAGE_KEY, serializeFavouriteBrandPreferenceEntries(entries));
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
        brand: product.brand?.trim() || null,
        savedAt
      },
      ...entries
    ],
    isFavourite: true
  };
}

export function setFavouriteBrandPreference(
  entries: readonly FavouriteBrandPreferenceEntry[],
  brand: string,
  preference: FavouriteBrandPreference,
  updatedAt = new Date().toISOString()
): FavouriteBrandPreferenceEntry[] {
  const normalizedBrand = brand.trim();
  if (!normalizedBrand) return [...entries];
  const withoutBrand = entries.filter((entry) => entry.brand.toLocaleLowerCase('sv-SE') !== normalizedBrand.toLocaleLowerCase('sv-SE'));
  return [{ brand: normalizedBrand, preference, updatedAt }, ...withoutBrand];
}
