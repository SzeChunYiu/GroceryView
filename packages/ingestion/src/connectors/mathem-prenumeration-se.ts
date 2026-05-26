import { fetchMathemProducts, type FetchMathemProductsOptions, type MathemProduct } from './mathem.js';

export type MathemPrenumerationProduct = Omit<MathemProduct, 'chain' | 'mathem_tier' | 'is_subscription_price'> & {
  country: 'SE';
  currency: 'SEK';
  chain: 'mathem-prenumeration';
  mathem_tier: 'subscription';
  is_subscription_price: true;
};

export type FetchMathemPrenumerationProductsOptions = FetchMathemProductsOptions;

export function toMathemPrenumerationProduct(row: MathemProduct): MathemPrenumerationProduct | null {
  if (row.mathem_tier !== 'subscription' || !row.is_subscription_price) return null;
  return {
    ...row,
    country: 'SE',
    currency: 'SEK',
    chain: 'mathem-prenumeration',
    mathem_tier: 'subscription',
    is_subscription_price: true
  };
}

export async function fetchMathemPrenumerationProducts(
  options: FetchMathemPrenumerationProductsOptions = {}
): Promise<MathemPrenumerationProduct[]> {
  const rows = await fetchMathemProducts(options);
  return rows
    .map(toMathemPrenumerationProduct)
    .filter((row): row is MathemPrenumerationProduct => row !== null);
}
