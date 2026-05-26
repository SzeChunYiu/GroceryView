import { NextResponse, type NextRequest } from 'next/server';
import {
  tuneRollingAverageAlertThreshold,
  type RollingAverageThresholdTuning
} from '@/lib/alert-engine';

type AlertPreferenceCadence = 'immediate' | 'daily_digest' | 'weekly_digest' | 'paused';
type AlertPreferenceChannel = 'email' | 'push' | 'in_app_digest';
type AlertPreferenceSensitivity = 'low' | 'standard' | 'high';

type StoredAlertPreferencesProfile = {
  accountId: string;
  cadence: AlertPreferenceCadence;
  channels: AlertPreferenceChannel[];
  maxDailyAlerts: number;
  sensitivity: AlertPreferenceSensitivity;
  updatedAt: string | null;
} & RollingAverageThresholdTuning;

type AlertThresholdTuningInput = {
  rollingAverageVolatility?: number | null;
  rollingAverageVolatilityPercent?: number | null;
  rollingAverageWindowDays?: number;
  volatilityScore?: number | null;
};

declare global {
  var groceryViewAlertPreferencesProfiles: Map<string, StoredAlertPreferencesProfile> | undefined;
}

export const dynamic = 'force-dynamic';

const profiles = globalThis.groceryViewAlertPreferencesProfiles ?? new Map<string, StoredAlertPreferencesProfile>();
globalThis.groceryViewAlertPreferencesProfiles = profiles;

const cadenceOptions = new Set<AlertPreferenceCadence>(['immediate', 'daily_digest', 'weekly_digest', 'paused']);
const channelOptions = new Set<AlertPreferenceChannel>(['email', 'push', 'in_app_digest']);
const sensitivityOptions = new Set<AlertPreferenceSensitivity>(['low', 'standard', 'high']);

const defaultProfile: Pick<StoredAlertPreferencesProfile, 'cadence' | 'channels' | 'sensitivity'> = {
  cadence: 'daily_digest',
  channels: ['email', 'in_app_digest'],
  sensitivity: 'standard'
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCadence(value: unknown): AlertPreferenceCadence | null {
  const candidate = cleanText(value) as AlertPreferenceCadence;
  return cadenceOptions.has(candidate) ? candidate : null;
}

function normalizeSensitivity(value: unknown): AlertPreferenceSensitivity | null {
  const candidate = cleanText(value) as AlertPreferenceSensitivity;
  return sensitivityOptions.has(candidate) ? candidate : null;
}

function normalizeChannels(value: unknown): AlertPreferenceChannel[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const channels = values
    .map((channel) => cleanText(channel) as AlertPreferenceChannel)
    .filter((channel) => channelOptions.has(channel));
  return Array.from(new Set(channels));
}

function normalizeOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeRollingAverageWindowDays(value: unknown) {
  const numeric = normalizeOptionalNumber(value);
  return numeric === null ? undefined : Math.max(1, Math.round(numeric));
}

function deliveryLimits(
  cadence: AlertPreferenceCadence,
  sensitivity: AlertPreferenceSensitivity,
  thresholdInput: AlertThresholdTuningInput = {}
) {
  const fixedLimits = cadence === 'paused'
    ? { maxDailyAlerts: 0, baselineThreshold: 1 }
    : cadence === 'weekly_digest'
      ? { maxDailyAlerts: 1, baselineThreshold: sensitivity === 'high' ? 0.72 : 0.82 }
      : cadence === 'daily_digest'
        ? { maxDailyAlerts: sensitivity === 'high' ? 3 : 2, baselineThreshold: sensitivity === 'low' ? 0.86 : 0.76 }
        : {
          maxDailyAlerts: sensitivity === 'high' ? 8 : sensitivity === 'standard' ? 5 : 3,
          baselineThreshold: sensitivity === 'high' ? 0.64 : sensitivity === 'standard' ? 0.74 : 0.84
        };

  return {
    maxDailyAlerts: fixedLimits.maxDailyAlerts,
    ...tuneRollingAverageAlertThreshold({
      baselineThreshold: fixedLimits.baselineThreshold,
      cadence,
      sensitivity,
      ...thresholdInput
    })
  };
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }

  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return {
    accountId: form.get('accountId'),
    cadence: form.get('cadence'),
    channels: form.getAll('channels'),
    rollingAverageVolatility: form.get('rollingAverageVolatility'),
    rollingAverageVolatilityPercent: form.get('rollingAverageVolatilityPercent') ?? form.get('historicalVolatilityPercent'),
    rollingAverageWindowDays: form.get('rollingAverageWindowDays'),
    volatilityScore: form.get('volatilityScore'),
    sensitivity: form.get('sensitivity')
  };
}

export async function GET(request: NextRequest) {
  const accountId = cleanText(request.nextUrl.searchParams.get('accountId'));
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required to read alert preferences.' }, { status: 400 });
  }

  return NextResponse.json({
    profile: profiles.get(accountId) ?? {
      accountId,
      ...defaultProfile,
      ...deliveryLimits(defaultProfile.cadence, defaultProfile.sensitivity),
      updatedAt: null
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const accountId = cleanText(body.accountId);
  const cadence = normalizeCadence(body.cadence);
  const sensitivity = normalizeSensitivity(body.sensitivity);
  const channels = normalizeChannels(body.channels);
  const thresholdInput: AlertThresholdTuningInput = {
    rollingAverageVolatility: normalizeOptionalNumber(body.rollingAverageVolatility),
    rollingAverageVolatilityPercent: normalizeOptionalNumber(body.rollingAverageVolatilityPercent ?? body.historicalVolatilityPercent),
    rollingAverageWindowDays: normalizeRollingAverageWindowDays(body.rollingAverageWindowDays),
    volatilityScore: normalizeOptionalNumber(body.volatilityScore)
  };

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required to save alert preferences.' }, { status: 400 });
  }

  if (!cadence) {
    return NextResponse.json({ error: 'cadence must be immediate, daily_digest, weekly_digest, or paused.' }, { status: 400 });
  }

  if (!sensitivity) {
    return NextResponse.json({ error: 'sensitivity must be low, standard, or high.' }, { status: 400 });
  }

  if (cadence !== 'paused' && channels.length === 0) {
    return NextResponse.json({ error: 'At least one delivery channel is required unless alerts are paused.' }, { status: 400 });
  }

  const profile: StoredAlertPreferencesProfile = {
    accountId,
    cadence,
    channels: cadence === 'paused' ? [] : channels,
    sensitivity,
    ...deliveryLimits(cadence, sensitivity, thresholdInput),
    updatedAt: new Date().toISOString()
  };
  profiles.set(accountId, profile);

  return NextResponse.json({ profile, status: 'saved' }, { status: 201 });
}
