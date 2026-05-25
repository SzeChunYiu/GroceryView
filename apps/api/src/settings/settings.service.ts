import { Injectable } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export const allowedPreferenceCurrencies = ['SEK', 'EUR', 'NOK', 'DKK'] as const;
export const allowedNotificationChannels = ['push', 'email', 'telegram'] as const;
export const allowedMyFlyerCountries = ['se', 'no', 'dk', 'fi'] as const;

export type NotificationPreferencesPatch = {
  myFlyerWeeklyEmail?: boolean;
  myFlyerCountry?: (typeof allowedMyFlyerCountries)[number];
};

export type UserPreferencePatch = {
  currency?: (typeof allowedPreferenceCurrencies)[number];
  preferredStores?: string[];
  notificationChannels?: Array<(typeof allowedNotificationChannels)[number]>;
  notificationPreferences?: NotificationPreferencesPatch;
};

type PreferenceRow = {
  preferred_currency: string;
  notification_channels: string[] | null;
  notification_preferences: NotificationPreferencesPatch | null;
};

@Injectable()
export class SettingsService {
  constructor(private readonly executor: PostgresQueryExecutorService) {}

  isConfigured(): boolean {
    return this.executor.isConfigured();
  }

  async readPreferences(userId: string) {
    return this.fetchPreferences(userId);
  }

  async savePreferences(userId: string, patch: UserPreferencePatch) {
    await this.executor.query(
      `insert into app_users(id) values ($1)
       on conflict (id) do update set updated_at = now()`,
      [userId]
    );

    if (patch.currency !== undefined || patch.notificationChannels !== undefined || patch.notificationPreferences !== undefined) {
      await this.executor.query(
        `insert into user_preferences(user_id, weekly_budget, monthly_budget, preferred_currency, notification_channels, notification_preferences)
         values ($1, 0, 0, coalesce($2::text, 'SEK'), coalesce($3::text[], array[]::text[]), coalesce($4::jsonb, '{}'::jsonb))
         on conflict (user_id) do update set
           preferred_currency = coalesce($2::text, user_preferences.preferred_currency),
           notification_channels = coalesce($3::text[], user_preferences.notification_channels),
           notification_preferences = case
             when $4::jsonb is null then user_preferences.notification_preferences
             else user_preferences.notification_preferences || $4::jsonb
           end,
           updated_at = now()`,
        [userId, patch.currency ?? null, patch.notificationChannels ?? null, patch.notificationPreferences ? JSON.stringify(patch.notificationPreferences) : null]
      );
    }

    if (patch.preferredStores !== undefined) {
      await this.executor.query('delete from favorite_stores where user_id = $1', [userId]);
      for (const storeId of patch.preferredStores) {
        await this.executor.query(
          'insert into favorite_stores(user_id, store_id) values ($1, $2) on conflict (user_id, store_id) do nothing',
          [userId, storeId]
        );
      }
    }

    return this.fetchPreferences(userId);
  }

  private async fetchPreferences(userId: string) {
    const preferenceRows = await this.executor.query<PreferenceRow>(
      `select preferred_currency, notification_channels, notification_preferences
       from user_preferences
       where user_id = $1`,
      [userId]
    );
    const storeRows = await this.executor.query<{ store_id: string }>(
      'select store_id from favorite_stores where user_id = $1 order by store_id',
      [userId]
    );
    const preference = preferenceRows[0];

    return {
      userId,
      currency: preference?.preferred_currency ?? 'SEK',
      preferredStores: storeRows.map((row) => row.store_id),
      notificationChannels: preference?.notification_channels ?? [],
      notificationPreferences: preference?.notification_preferences ?? {}
    };
  }
}
