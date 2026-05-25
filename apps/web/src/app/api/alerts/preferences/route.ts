import { NextResponse, type NextRequest } from 'next/server';

type AlertPreferenceCadence = 'immediate' | 'daily_digest' | 'weekly_digest' | 'paused';
type AlertPreferenceChannel = 'email' | 'push' | 'in_app_digest';
type AlertPreferenceSensitivity = 'low' | 'standard' | 'high';

type StoredAlertPreferencesProfile = {
  accountId: string;
  cadence: AlertPreferenceCadence;
  channels: AlertPreferenceChannel[];
  maxDailyAlerts: number;
  minimumConfidence: number;
  sensitivity: AlertPreferenceSensitivity;
  updatedAt: string;
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

const defaultProfile = {
  cadence: 'daily_digest' satisfies AlertPreferenceCadence,
  channels: ['email', 'in_app_digest'] satisfies AlertPreferenceChannel[],
  sensitivity: 'standard' satisfies AlertPreferenceSensitivity
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

function deliveryLimits(cadence: AlertPreferenceCadence, sensitivity: AlertPreferenceSensitivity) {
  if (cadence === 'paused') return { maxDailyAlerts: 0, minimumConfidence: 1 };
  if (cadence === 'weekly_digest') return { maxDailyAlerts: 1, minimumConfidence: sensitivity === 'high' ? 0.72 : 0.82 };
  if (cadence === 'daily_digest') return { maxDailyAlerts: sensitivity === 'high' ? 3 : 2, minimumConfidence: sensitivity === 'low' ? 0.86 : 0.76 };
  return { maxDailyAlerts: sensitivity === 'high' ? 8 : sensitivity === 'standard' ? 5 : 3, minimumConfidence: sensitivity === 'high' ? 0.64 : sensitivity === 'standard' ? 0.74 : 0.84 };
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
    ...deliveryLimits(cadence, sensitivity),
    updatedAt: new Date().toISOString()
  };
  profiles.set(accountId, profile);

  return NextResponse.json({ profile, status: 'saved' }, { status: 201 });
}
