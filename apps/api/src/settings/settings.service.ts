import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

export const allowedPreferenceCurrencies = ['SEK', 'EUR', 'NOK', 'DKK'] as const;
export const allowedNotificationChannels = ['push', 'email', 'telegram'] as const;
export const allowedMyFlyerAlgorithmChoices = ['balanced', 'best_savings', 'best_unit_price', 'watchlist_first'] as const;

export type UserPreferencePatch = {
  currency?: (typeof allowedPreferenceCurrencies)[number];
  preferredStores?: string[];
  notificationChannels?: Array<(typeof allowedNotificationChannels)[number]>;
  algorithm_choice?: (typeof allowedMyFlyerAlgorithmChoices)[number];
};


type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  key_last4: string;
  scopes: string[] | null;
  created_at: string | Date;
  last_used_at: string | Date | null;
  revoked_at: string | Date | null;
};

function iso(value: string | Date | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapApiKey(row: ApiKeyRow) {
  return {
    id: row.id,
    name: row.name,
    prefix: row.key_prefix,
    last4: row.key_last4,
    scopes: row.scopes ?? [],
    createdAt: iso(row.created_at),
    lastUsedAt: iso(row.last_used_at),
    revokedAt: iso(row.revoked_at)
  };
}

function apiKeyHash(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

function normalizeApiKeyName(value: string | undefined): string {
  const name = value?.trim() || 'GroceryView API key';
  if (name.length > 80) throw new BadRequestException('API key name must be 80 characters or fewer.');
  return name;
}

type PreferenceRow = {
  preferred_currency: string;
  favorite_stores: string[] | null;
  notification_channels: string[] | null;
  algorithm_choice: string;
};

function normalizePreferredStores(value: string[]): string[] {
  const stores = value.map((store) => store.trim().toLowerCase());
  if (stores.length < 1 || stores.length > 5) {
    throw new BadRequestException('preferredStores must contain 1 to 5 ordered store slugs.');
  }
  if (stores.some((store) => !/^[a-z0-9][a-z0-9-]*$/.test(store))) {
    throw new BadRequestException('preferredStores must contain store slugs only.');
  }
  return [...new Set(stores)];
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

    const preferredStores = patch.preferredStores === undefined ? undefined : normalizePreferredStores(patch.preferredStores);

    if (
      patch.currency !== undefined ||
      patch.notificationChannels !== undefined ||
      patch.algorithm_choice !== undefined ||
      preferredStores !== undefined
    ) {
      await this.executor.query(
        `insert into user_preferences(user_id, weekly_budget, monthly_budget, preferred_currency, notification_channels, algorithm_choice, favorite_stores)
         values ($1, 0, 0, coalesce($2::text, 'SEK'), coalesce($3::text[], array[]::text[]), coalesce($4::text, 'balanced'), coalesce($5::text[], array[]::text[]))
         on conflict (user_id) do update set
           preferred_currency = coalesce($2::text, user_preferences.preferred_currency),
           notification_channels = coalesce($3::text[], user_preferences.notification_channels),
           algorithm_choice = coalesce($4::text, user_preferences.algorithm_choice),
           favorite_stores = coalesce($5::text[], user_preferences.favorite_stores),
           updated_at = now()`,
        [userId, patch.currency ?? null, patch.notificationChannels ?? null, patch.algorithm_choice ?? null, preferredStores ?? null]
      );
    }

    return this.fetchPreferences(userId);
  }


  async listApiKeys(userId: string) {
    const rows = await this.executor.query<ApiKeyRow>(
      `select id::text, name, key_prefix, key_last4, scopes, created_at, last_used_at, revoked_at
       from api_keys
       where user_id = $1
       order by revoked_at nulls first, created_at desc`,
      [userId]
    );
    return { userId, keys: rows.map(mapApiKey), secretShownOnce: true };
  }

  async createApiKey(userId: string, name?: string) {
    await this.executor.query(
      `insert into app_users(id) values ($1)
       on conflict (id) do update set updated_at = now()`,
      [userId]
    );
    const secret = `gv_${randomBytes(24).toString('base64url')}`;
    const rows = await this.executor.query<ApiKeyRow>(
      `insert into api_keys(user_id, name, key_hash, key_prefix, key_last4, scopes)
       values ($1, $2, $3, $4, $5, array['read:prices']::text[])
       returning id::text, name, key_prefix, key_last4, scopes, created_at, last_used_at, revoked_at`,
      [userId, normalizeApiKeyName(name), apiKeyHash(secret), secret.slice(0, 7), secret.slice(-4)]
    );
    return { userId, key: mapApiKey(rows[0]!), secret, secretShownOnce: true };
  }

  async revokeApiKey(userId: string, keyId: string) {
    const rows = await this.executor.query<ApiKeyRow>(
      `update api_keys
       set revoked_at = coalesce(revoked_at, now()), updated_at = now()
       where user_id = $1 and id::text = $2
       returning id::text, name, key_prefix, key_last4, scopes, created_at, last_used_at, revoked_at`,
      [userId, keyId]
    );
    if (rows.length === 0) throw new NotFoundException('API key not found.');
    return { userId, key: mapApiKey(rows[0]!), revoked: true };
  }

  private async fetchPreferences(userId: string) {
    const preferenceRows = await this.executor.query<PreferenceRow>(
      `select preferred_currency, favorite_stores, notification_channels, algorithm_choice
       from user_preferences
       where user_id = $1`,
      [userId]
    );
    const preference = preferenceRows[0];

    return {
      userId,
      currency: preference?.preferred_currency ?? 'SEK',
      preferredStores: preference?.favorite_stores ?? [],
      notificationChannels: preference?.notification_channels ?? [],
      algorithm_choice: preference?.algorithm_choice ?? 'balanced'
    };
  }
}
