import { buildWatchlistAlerts, type WatchlistAlert, type WatchlistItem, type WatchlistProductSnapshot } from '@groceryview/core';

export type WatchlistAlertUser = {
  email?: string;
  pushSubscriptionId?: string;
  userId: string;
  favoriteStoreIds: string[];
  watchlist: WatchlistItem[];
};

export type WatchlistAlertsRepository = {
  listUsersWithWatchlistTargets(): Promise<WatchlistAlertUser[]>;
  listCurrentProductSnapshots(productIds: string[]): Promise<WatchlistProductSnapshot[]>;
  markAlertSent(userId: string, alert: WatchlistAlert, sentAt: string): Promise<void>;
};

export type WatchlistAlertNotifier = {
  sendEmail?(message: WatchlistAlertMessage): Promise<void>;
  sendPush?(message: WatchlistAlertMessage): Promise<void>;
};

export type WatchlistAlertMessage = {
  alert: WatchlistAlert;
  body: string;
  channel: 'email' | 'push';
  subject: string;
  userId: string;
  destination?: string;
};

export type WatchlistAlertsJobResult = {
  evaluatedUsers: number;
  triggeredAlerts: number;
  emailCount: number;
  pushCount: number;
};

function messageFor(user: WatchlistAlertUser, alert: WatchlistAlert, channel: 'email' | 'push'): WatchlistAlertMessage {
  return {
    alert,
    body: alert.message,
    channel,
    destination: channel === 'email' ? user.email : user.pushSubscriptionId,
    subject: `GroceryView price drop: ${alert.productName}`,
    userId: user.userId
  };
}

export async function runWatchlistAlertsJob({
  now = new Date(),
  notifier,
  repository
}: {
  now?: Date;
  notifier: WatchlistAlertNotifier;
  repository: WatchlistAlertsRepository;
}): Promise<WatchlistAlertsJobResult> {
  const users = await repository.listUsersWithWatchlistTargets();
  let triggeredAlerts = 0;
  let emailCount = 0;
  let pushCount = 0;

  for (const user of users) {
    const productIds = [...new Set(user.watchlist.map((item) => item.productId))];
    const products = await repository.listCurrentProductSnapshots(productIds);
    const alerts = buildWatchlistAlerts({ favoriteStoreIds: user.favoriteStoreIds, products, watchlist: user.watchlist });

    for (const alert of alerts) {
      triggeredAlerts += 1;
      if (user.email && notifier.sendEmail) {
        await notifier.sendEmail(messageFor(user, alert, 'email'));
        emailCount += 1;
      }
      if (user.pushSubscriptionId && notifier.sendPush) {
        await notifier.sendPush(messageFor(user, alert, 'push'));
        pushCount += 1;
      }
      await repository.markAlertSent(user.userId, alert, now.toISOString());
    }
  }

  return { evaluatedUsers: users.length, triggeredAlerts, emailCount, pushCount };
}
