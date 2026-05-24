export const itemDetailPath = (id: string): string => `/items/${id}`;

const fallbackItemIdFromName = (value: string): string =>
  value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

export const itemDetailIdFor = (input: { code?: string | null; slug?: string | null; name?: string | null }): string => {
  if (input.code) return input.code;
  if (input.slug) return input.slug;
  return fallbackItemIdFromName(input.name ?? '');
};

export const itemDetailHref = (input: { code?: string | null; slug?: string | null; name?: string | null }): string =>
  itemDetailPath(itemDetailIdFor(input));
