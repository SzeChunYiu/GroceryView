export const overlapCategories = [
  'pierogi',
  'kielbasa',
  'kabanos',
  'barszcz',
  'bigos',
  'kasza',
  'ogorki',
  'ogórki',
  'kapusta',
  'twarog',
  'twaróg',
  'polish',
  'polska',
  'polsk',
  'eastern european',
  'östeuropeisk',
  'osteuropa',
  'ukrainian',
  'ukrainsk',
  'romanian',
  'rumänsk',
] as const;

export function overlapsWhitelistedCategory(value: string): boolean {
  const normalized = value.toLowerCase();
  return overlapCategories.some((category) => normalized.includes(category));
}
