export const SAVED_VIEWS_STORAGE_KEY = 'groceryview:saved-views:v1';
export const SAVED_VIEW_SURFACES = ['map', 'deals', 'screener', 'categories', 'compare'] as const;

export type SavedViewSurface = typeof SAVED_VIEW_SURFACES[number];
