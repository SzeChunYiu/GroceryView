export type AuthenticatedSavedSearchShortcut = {
  id: string;
  label: string;
  query: string;
  href: string;
  helper: string;
};

export function savedSearchHref(query: string) {
  return `/search?q=${encodeURIComponent(query)}`;
}

export const authenticatedSavedSearchShortcuts: AuthenticatedSavedSearchShortcut[] = [
  {
    id: 'weekly-milk-run',
    label: 'Weekly milk run',
    query: 'mjölk',
    href: savedSearchHref('mjölk'),
    helper: 'One-tap dairy comparison for repeat top-ups.'
  },
  {
    id: 'gluten-free-bread',
    label: 'Gluten-free bread',
    query: 'glutenfritt bröd',
    href: savedSearchHref('glutenfritt bröd'),
    helper: 'Saved dietary mission for household-safe staples.'
  },
  {
    id: 'breakfast-oats',
    label: 'Breakfast oats',
    query: 'havregryn',
    href: savedSearchHref('havregryn'),
    helper: 'Fast replay for recurring breakfast basket checks.'
  }
];
