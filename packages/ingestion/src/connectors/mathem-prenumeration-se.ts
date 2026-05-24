import { fetchMathemProducts, type FetchMathemProductsOptions, type MathemProduct } from './mathem.js';

export type MathemPrenumerationProduct = MathemProduct & {
  chain: 'mathem-prenumeration';
  mathem_tier: 'subscription';
};

export type FetchMathemPrenumerationProductsOptions = Omit<FetchMathemProductsOptions, 'tier'>;

export async function fetchMathemPrenumerationProducts(
  options: FetchMathemPrenumerationProductsOptions = {}
): Promise<MathemPrenumerationProduct[]> {
  const rows = await fetchMathemProducts({ ...options, tier: 'subscription' });
  return rows.map((row) => ({
    ...row,
    country: 'SE',
    currency: 'SEK',
    chain: 'mathem-prenumeration',
    mathem_tier: 'subscription'
  }));
}
