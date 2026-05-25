export type AhlensFoodCategorySlug = 'godis' | 'kaffe-te-dryck' | 'skafferi-torrvaror';

export type GroceryCategory = 'candy' | 'coffee-tea-drinks' | 'pantry';

export interface AhlensFoodCategory {
  slug: AhlensFoodCategorySlug;
  name: string;
  groceryCategory: GroceryCategory;
  url: string;
}

const AHLENS_FOOD_BASE_URL = 'https://www.ahlens.se/inredning/skafferiet';

export const ahlensFoodCategoryMap = [
  {
    slug: 'godis',
    name: 'Godis',
    groceryCategory: 'candy',
    url: `${AHLENS_FOOD_BASE_URL}/godis`
  },
  {
    slug: 'kaffe-te-dryck',
    name: 'Kaffe, te & dryck',
    groceryCategory: 'coffee-tea-drinks',
    url: `${AHLENS_FOOD_BASE_URL}/kaffe-te-dryck`
  },
  {
    slug: 'skafferi-torrvaror',
    name: 'Skafferi & torrvaror',
    groceryCategory: 'pantry',
    url: `${AHLENS_FOOD_BASE_URL}/skafferi-torrvaror`
  }
] as const satisfies readonly AhlensFoodCategory[];

export function categoryForAhlensPath(pathOrUrl: string): AhlensFoodCategory | undefined {
  const pathname = toPathname(pathOrUrl);

  return ahlensFoodCategoryMap.find((category) =>
    pathname === `/inredning/skafferiet/${category.slug}` ||
    pathname.startsWith(`/inredning/skafferiet/${category.slug}/`)
  );
}

function toPathname(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl, 'https://www.ahlens.se').pathname.replace(/\/+$/, '');
  } catch {
    return pathOrUrl.split('?')[0]?.split('#')[0]?.replace(/\/+$/, '') ?? pathOrUrl;
  }
}
