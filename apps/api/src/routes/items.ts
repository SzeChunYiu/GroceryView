import { z } from 'zod';

export const basketItemSchema = z
  .object({
    productId: z.string().trim().min(1),
    quantity: z.coerce.number().int().min(1).max(99)
  })
  .strict();

export type BasketItemInput = z.infer<typeof basketItemSchema>;

