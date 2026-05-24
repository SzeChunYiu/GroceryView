import type { DeliveryNotification } from '@groceryview/notifications';

export type WatchlistAlertUser = {
  userId: string;
  email?: string;
  pushToken?: string;
};

export type WatchlistAlertItem = {
  userId: string;
  productId: string;
  productName: string;
  alertTarget: number;
};

export type WatchlistPriceRow = {
  productId: string;
  storeName: string;
  effectiveUnitPrice: number;
  observedAt: string;
};

export type WatchlistAlertRepository = {
  listUsersWithWatchlistAlerts(): Promise<WatchlistAlertUser[]>;
  listWatchlistAlertItems(userId: string): Promise<WatchlistAlertItem[]>;
  listCurrentWatchlistPrices(productIds: string[]): Promise<WatchlistPriceRow[]>;
};

export type RunWatchlistAlertJobInput = {
  repository: WatchlistAlertRepository;
  now: string;
};

export type RunWatchlistAlertJobResult = {
  checkedItemCount: number;
  triggeredItemCount: number;
  notifications: DeliveryNotification[];
};

export async function runWatchlistAlertJob(input: RunWatchlistAlertJobInput): Promise<RunWatchlistAlertJobResult> {
  const users = await input.repository.listUsersWithWatchlistAlerts();
  const notifications: DeliveryNotification[] = [];
  let checkedItemCount = 0;
  let triggeredItemCount = 0;

  for (const user of users) {
    const items = await input.repository.listWatchlistAlertItems(user.userId);
    checkedItemCount += items.length;
    const prices = await input.repository.listCurrentWatchlistPrices([...new Set(items.map((item) => item.productId))]);
    const cheapestByProduct = new Map<string, WatchlistPriceRow>();

    for (const price of prices) {
      const current = cheapestByProduct.get(price.productId);
      if (!current || price.effectiveUnitPrice < current.effectiveUnitPrice) cheapestByProduct.set(price.productId, price);
    }

    for (const item of items) {
      const price = cheapestByProduct.get(item.productId);
      if (!price || price.effectiveUnitPrice > item.alertTarget) continue;
      triggeredItemCount += 1;
      const title = `${item.productName} hit your target`;
      const body = `${price.storeName}: ${price.effectiveUnitPrice} is at or below your ${item.alertTarget} target.`;
      if (user.email) notifications.push({ channel: 'email', type: 'watchlist_price_drop', title, body, priority: 'high', sendAt: input.now, recipient: user.email });
      if (user.pushToken) notifications.push({ channel: 'push', type: 'watchlist_price_drop', title, body, priority: 'high', sendAt: input.now, recipient: user.pushToken });
    }
  }

  return { checkedItemCount, triggeredItemCount, notifications };
}
