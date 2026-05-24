import { z } from 'zod';

export const productsQueryParamsSchema = z.object({
  q: z.string().trim().default('')
}).strict();

export type ProductsQueryParams = z.infer<typeof productsQueryParamsSchema>;

export function parseProductsQueryParams(input: Record<string, unknown>) {
  return productsQueryParamsSchema.safeParse(input);
}

export function productsQueryValidationError(error: z.ZodError<ProductsQueryParams>) {
  return {
    error: 'invalid_products_query',
    issues: error.issues
  };
}
