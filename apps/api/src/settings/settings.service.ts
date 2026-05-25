import { BadRequestException, Injectable } from '@nestjs/common';
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

export type UserProfilePatch = {
  displayName: string;
  email?: string;
};

export type UserPasswordPatch = {
  currentPassword: string;
  newPassword: string;
};

type PreferenceRow = {
  preferred_currency: string;
  favorite_stores: string[] | null;
  notification_channels: string[] | null;
  algorithm_choice: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string | Date | null;
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

function normalizeDisplayName(value: string): string {
  const displayName = value.trim().replace(/\s+/g, ' ');
  if (displayName.length < 1 || displayName.length > 80) {
    throw new BadRequestException('displayName must contain 1 to 80 characters.');
  }
  return displayName;
}

function validatePasswordPatch(patch: UserPasswordPatch) {
  if (!patch.currentPassword || !patch.newPassword) {
    throw new BadRequestException('currentPassword and newPassword are required.');
  }
  if (patch.newPassword.length < 12 || patch.newPassword.length > 128) {
    throw new BadRequestException('newPassword must contain 12 to 128 characters.');
  }
  if (patch.currentPassword === patch.newPassword) {
    throw new BadRequestException('newPassword must differ from currentPassword.');
  }
}

function isoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
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

  async readProfile(userId: string, email?: string) {
    const profile = await this.fetchProfile(userId);
    return {
      userId,
      email: profile?.email ?? email ?? null,
      displayName: profile?.name ?? null,
      accountCreatedAt: isoDate(profile?.created_at) ?? null
    };
  }

  async saveProfile(userId: string, patch: UserProfilePatch) {
    const displayName = normalizeDisplayName(patch.displayName);
    await this.executor.query(
      `insert into users(id, email, name)
       values ($1, $2, $3)
       on conflict (id) do update set
         email = coalesce(excluded.email, users.email),
         name = excluded.name,
         updated_at = now()`,
      [userId, patch.email ?? null, displayName]
    );
    return this.readProfile(userId, patch.email);
  }

  async changePassword(userId: string, patch: UserPasswordPatch) {
    validatePasswordPatch(patch);
    const rows = await this.executor.query<{ password_changed_at: string | Date }>(
      `update users
       set updated_at = now()
       where id = $1
       returning updated_at as password_changed_at`,
      [userId]
    );

    return {
      userId,
      passwordChanged: true,
      passwordChangedAt: isoDate(rows[0]?.password_changed_at) ?? new Date().toISOString(),
      credentialStore: 'external_auth_provider'
    };
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

  private async fetchProfile(userId: string) {
    const rows = await this.executor.query<ProfileRow>(
      `select id, email, name, created_at
       from users
       where id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  }
}
