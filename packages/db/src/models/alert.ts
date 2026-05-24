export const PRICE_ALERT_CHANNELS = ['email', 'push'] as const;

export type PriceAlertChannel = (typeof PRICE_ALERT_CHANNELS)[number];

export type PriceAlert = {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  channel: PriceAlertChannel;
  triggered: boolean;
  createdAt: string;
};
