export function readLocalStorageStringArray(key: string, maxItems: number): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  } catch {
    return [];
  }
}

export function writeLocalStorageStringArray(key: string, values: string[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Keep the search box usable when localStorage is unavailable.
  }
}
