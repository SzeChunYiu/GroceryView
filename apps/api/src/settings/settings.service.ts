import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export const allowedPreferenceCurrencies = ['SEK', 'EUR', 'NOK', 'DKK'] as const;
export const allowedNotificationChannels = ['push', 'email', 'telegram'] as const;

export type UserPreferencePatch = {
  currency?: (typeof allowedPreferenceCurrencies)[number];
  preferredStores?: string[];
  notificationChannels?: Array<(typeof allowedNotificationChannels)[number]>;
};

type PreferenceRow = {
  preferred_currency: string;
  notification_channels: string[] | null;
};

type ApiKeyRow = {
  id: string;
  label: string;
  key_prefix: string;
  created_at: Date | string;
  last_used_at: Date | string | null;
  revoked_at: Date | string | null;
};

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function presentApiKey(row: ApiKeyRow) {
  return {
    id: row.id,
    label: row.label,
    keyPrefix: row.key_prefix,
    createdAt: new Date(row.created_at).toISOString(),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null
  };
}

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

    if (patch.currency !== undefined || patch.notificationChannels !== undefined) {
      await this.executor.query(
        `insert into user_preferences(user_id, weekly_budget, monthly_budget, preferred_currency, notification_channels)
         values ($1, 0, 0, coalesce($2::text, 'SEK'), coalesce($3::text[], array[]::text[]))
         on conflict (user_id) do update set
           preferred_currency = coalesce($2::text, user_preferences.preferred_currency),
           notification_channels = coalesce($3::text[], user_preferences.notification_channels),
           updated_at = now()`,
        [userId, patch.currency ?? null, patch.notificationChannels ?? null]
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

  async listApiKeys(userId: string) {
    const rows = await this.executor.query<ApiKeyRow>(
      `select id::text, label, key_prefix, created_at, last_used_at, revoked_at
       from api_keys
       where user_id = $1 and revoked_at is null
       order by created_at desc`,
      [userId]
    );
    return { userId, apiKeys: rows.map(presentApiKey) };
  }

  async createApiKey(userId: string, label: string) {
    const key = `gv_${randomBytes(24).toString('base64url')}`;
    const keyPrefix = key.slice(0, 10);
    const keyHash = sha256(key);
    const normalizedLabel = label.trim().slice(0, 80) || 'Developer API key';

    await this.executor.query(
      `insert into app_users(id) values ($1)
       on conflict (id) do update set updated_at = now()`,
      [userId]
    );

    const rows = await this.executor.query<ApiKeyRow>(
      `insert into api_keys(user_id, label, key_prefix, key_hash)
       values ($1, $2, $3, $4)
       returning id::text, label, key_prefix, created_at, last_used_at, revoked_at`,
      [userId, normalizedLabel, keyPrefix, keyHash]
    );
    const apiKey = rows[0];
    if (!apiKey) throw new Error('API key insert did not return a row.');
    return { userId, apiKey: presentApiKey(apiKey), plainTextKey: key };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const rows = await this.executor.query<ApiKeyRow>(
      `update api_keys
       set revoked_at = now(), updated_at = now()
       where id = $2 and user_id = $1 and revoked_at is null
       returning id::text, label, key_prefix, created_at, last_used_at, revoked_at`,
      [userId, keyId]
    );
    return { userId, revoked: rows.length > 0, apiKey: rows[0] ? presentApiKey(rows[0]) : null };
  }

  private async fetchPreferences(userId: string) {
    const preferenceRows = await this.executor.query<PreferenceRow>(
      `select preferred_currency, notification_channels
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
      notificationChannels: preference?.notification_channels ?? []
    };
  }
}
