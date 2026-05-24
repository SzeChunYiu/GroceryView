import { canonicalizeBrand } from '@groceryview/db';

export function normalizeBrand(rawBrand: string | undefined): string | undefined {
  return canonicalizeBrand(rawBrand);
}
