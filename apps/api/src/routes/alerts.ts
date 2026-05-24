import { z } from 'zod';

const allowedWatchlistPriceTypes = ['shelf', 'member', 'promotion', 'estimated'] as const;

export const watchlistItemSchema = z
  .object({
    productId: z.string().trim().min(1),
    targetPrice: z.coerce.number().positive().optional(),
    alertDealScoreAt: z.coerce.number().min(0).max(100).optional(),
    favoriteStoresOnly: z.boolean().optional().default(false),
    allowedPriceTypes: z.array(z.enum(allowedWatchlistPriceTypes)).optional()
  })
  .strict();

export type WatchlistItemInput = z.infer<typeof watchlistItemSchema>;

