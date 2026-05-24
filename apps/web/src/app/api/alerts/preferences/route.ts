import { NextResponse } from 'next/server';
import type { NotificationChannel, NotificationType } from '@groceryview/core';

export const dynamic = 'force-dynamic';

type AlertCadence = 'instant' | 'daily_digest' | 'weekly_digest' | 'paused';
type AlertSensitivity = 'low' | 'balanced' | 'high';

type AlertQuietHours = {
  startHour: number;
  endHour: number;
  timezone: string;
};

type AlertPreferenceProfile = {
  userId: string;
  cadence: AlertCadence;
  channels: NotificationChannel[];
  enabledTypes: NotificationType[];
  sensitivity: AlertSensitivity;
  quietHours: AlertQuietHours;
  fatigueGuard: {
    maxDailyAlerts: number;
    minHoursBetweenAlerts: number;
    overflowAction: 'send_immediately' | 'roll_into_digest' | 'pause_non_urgent';
  };
  updatedAt: string;
};

type AlertPreferencePayload = {
  userId?: unknown;
  cadence?: unknown;
  channels?: unknown;
  enabledTypes?: unknown;
  sensitivity?: unknown;
  quietHours?: unknown;
};

declare global {
  var groceryViewAlertPreferenceProfiles: Map<string, AlertPreferenceProfile> | undefined;
}

const profiles = globalThis.groceryViewAlertPreferenceProfiles ?? new Map<string, AlertPreferenceProfile>();
globalThis.groceryViewAlertPreferenceProfiles = profiles;

const alertCadences = new Set<AlertCadence>(['instant', 'daily_digest', 'weekly_digest', 'paused']);
const alertSensitivities = new Set<AlertSensitivity>(['low', 'balanced', 'high']);
const notificationChannels = new Set<NotificationChannel>(['email', 'push']);
const notificationTypes = new Set<NotificationType>([
  'target_price',
  'favorite_store_deal',
  'budget_alert',
  'weekly_report',
  'receipt_summary',
  'stock_up_opportunity'
]);

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeUserId(value: unknown): string {
  if (!nonEmptyString(value)) throw new Error('userId is required.');
  return value.trim();
}

function normalizeCadence(value: unknown): AlertCadence {
  if (value === undefined) return 'daily_digest';
  if (!nonEmptyString(value) || !alertCadences.has(value as AlertCadence)) {
    throw new Error('cadence must be instant, daily_digest, weekly_digest, or paused.');
  }
  return value as AlertCadence;
}

function normalizeSensitivity(value: unknown): AlertSensitivity {
  if (value === undefined) return 'balanced';
  if (!nonEmptyString(value) || !alertSensitivities.has(value as AlertSensitivity)) {
    throw new Error('sensitivity must be low, balanced, or high.');
  }
  return value as AlertSensitivity;
}

function normalizeStringArray<T extends string>(value: unknown, allowed: Set<T>, fieldName: string, fallback: T[]): T[] {
  if (value === undefined) return fallback;
  if (!Array.isArray(value)) throw new Error(`${fieldName} must be an array.`);

  const normalized = value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());

  if (normalized.length === 0) throw new Error(`${fieldName} must include at least one value.`);
  const unique: T[] = [];
  for (const item of normalized) {
    if (!allowed.has(item as T)) throw new Error(`${fieldName} contains an unsupported value: ${item}.`);
    if (!unique.includes(item as T)) unique.push(item as T);
  }

  return unique;
}

function hour(value: unknown, fallback: number, fieldName: string): number {
  const numeric = value === undefined ? fallback : typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 23) {
    throw new Error(`${fieldName} must be an integer hour from 0 through 23.`);
  }
  return numeric;
}

function normalizeQuietHours(value: unknown): AlertQuietHours {
  if (value === undefined || value === null) {
    return { startHour: 21, endHour: 7, timezone: 'Europe/Stockholm' };
  }
  if (typeof value !== 'object') throw new Error('quietHours must be an object.');

  const candidate = value as Record<string, unknown>;
  return {
    startHour: hour(candidate.startHour, 21, 'quietHours.startHour'),
    endHour: hour(candidate.endHour, 7, 'quietHours.endHour'),
    timezone: nonEmptyString(candidate.timezone) ? candidate.timezone.trim() : 'Europe/Stockholm'
  };
}

function fatigueGuard(cadence: AlertCadence, sensitivity: AlertSensitivity): AlertPreferenceProfile['fatigueGuard'] {
  if (cadence === 'paused') {
    return { maxDailyAlerts: 0, minHoursBetweenAlerts: 24, overflowAction: 'pause_non_urgent' };
  }

  if (cadence === 'weekly_digest') {
    return { maxDailyAlerts: 1, minHoursBetweenAlerts: 24, overflowAction: 'roll_into_digest' };
  }

  if (cadence === 'daily_digest' || sensitivity === 'low') {
    return { maxDailyAlerts: sensitivity === 'high' ? 3 : 2, minHoursBetweenAlerts: 8, overflowAction: 'roll_into_digest' };
  }

  if (sensitivity === 'high') {
    return { maxDailyAlerts: 6, minHoursBetweenAlerts: 2, overflowAction: 'send_immediately' };
  }

  return { maxDailyAlerts: 4, minHoursBetweenAlerts: 4, overflowAction: 'roll_into_digest' };
}

function defaultProfile(userId: string): AlertPreferenceProfile {
  const cadence = 'daily_digest';
  const sensitivity = 'balanced';
  return {
    userId,
    cadence,
    channels: ['email'],
    enabledTypes: ['target_price', 'favorite_store_deal', 'weekly_report'],
    sensitivity,
    quietHours: { startHour: 21, endHour: 7, timezone: 'Europe/Stockholm' },
    fatigueGuard: fatigueGuard(cadence, sensitivity),
    updatedAt: new Date(0).toISOString()
  };
}

function profileFromPayload(payload: AlertPreferencePayload): AlertPreferenceProfile {
  const userId = normalizeUserId(payload.userId);
  const cadence = normalizeCadence(payload.cadence);
  const sensitivity = normalizeSensitivity(payload.sensitivity);

  return {
    userId,
    cadence,
    channels: normalizeStringArray(payload.channels, notificationChannels, 'channels', ['email']),
    enabledTypes: normalizeStringArray(
      payload.enabledTypes,
      notificationTypes,
      'enabledTypes',
      ['target_price', 'favorite_store_deal', 'weekly_report']
    ),
    sensitivity,
    quietHours: normalizeQuietHours(payload.quietHours),
    fatigueGuard: fatigueGuard(cadence, sensitivity),
    updatedAt: new Date().toISOString()
  };
}

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeUserId(searchParams.get('userId'));
    const profile = profiles.get(userId);
    return NextResponse.json({
      profile: profile ?? defaultProfile(userId),
      source: profile ? 'stored_alert_preference_profile' : 'default_alert_preference_profile'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert preferences request.' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as AlertPreferencePayload;
    const profile = profileFromPayload(payload);
    profiles.set(profile.userId, profile);
    return NextResponse.json({ profile, source: 'stored_alert_preference_profile' }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert preferences request.' },
      { status: 400 }
    );
  }
}

export const PUT = POST;

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as AlertPreferencePayload;
    const userId = normalizeUserId(payload.userId ?? new URL(request.url).searchParams.get('userId'));
    const removed = profiles.delete(userId);
    return NextResponse.json({ removed, profile: defaultProfile(userId), source: 'default_alert_preference_profile' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert preferences request.' },
      { status: 400 }
    );
  }
}
