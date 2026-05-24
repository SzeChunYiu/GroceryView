export const kosherHalalOverlapCategories = ['meat', 'poultry', 'pantry', 'frozen', 'snacks', 'beverages'] as const;
export type KosherHalalOverlapCategory = typeof kosherHalalOverlapCategories[number];

export function isKosherHalalOverlapCategory(value: string): value is KosherHalalOverlapCategory {
  return (kosherHalalOverlapCategories as readonly string[]).includes(value);
}
