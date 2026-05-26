export type SavedViewSurface = 'map' | 'deals' | 'screener' | 'categories' | 'compare';

export type SavedViewState = Record<string, string | number | boolean | null | undefined>;

export type SavedViewRecord = {
  accountId: string;
  createdAt: string;
  href: string;
  id: string;
  label: string;
  source: 'account' | 'local';
  state: Record<string, string>;
  surface: SavedViewSurface;
  updatedAt: string;
};

export type SavedViewAlert = {
  accountId: string;
  createdAt: string;
  id: string;
  rule: string;
  savedViewId: string;
  surface: Extract<SavedViewSurface, 'deals' | 'screener'>;
};

export const savedViewStorageKey = 'groceryview:saved-views:v1';
export const defaultSavedViewAccountId = 'signed-in-user';

export function savedViewSurfaceLabel(surface: SavedViewSurface) {
  if (surface === 'map') return 'Map';
  if (surface === 'deals') return 'Deals';
  if (surface === 'screener') return 'Screener';
  if (surface === 'categories') return 'Categories';
  return 'Compare';
}

export function savedViewSupportsAlerts(surface: SavedViewSurface) {
  return surface === 'deals' || surface === 'screener';
}

export function normalizeSavedViewState(state: SavedViewState): Record<string, string> {
  return Object.fromEntries(
    Object.entries(state)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)] as const)
  );
}

function compactIdPart(value: string) {
  return value.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96);
}

export function savedViewId(surface: SavedViewSurface, label: string, state: SavedViewState) {
  const suffix = Object.entries(normalizeSavedViewState(state))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}-${compactIdPart(value)}`)
    .join('-')
    .slice(0, 140);
  return `${surface}-${compactIdPart(label)}${suffix ? `-${suffix}` : ''}`;
}
