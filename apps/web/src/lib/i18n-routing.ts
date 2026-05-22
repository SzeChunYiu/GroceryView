export const supportedLocales = ['sv', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = 'sv';
export const localeCookieName = 'NEXT_LOCALE';
export const localeStorageKey = 'groceryview:locale';

export const localeReadiness = [
  {
    locale: 'sv',
    label: 'Svenska',
    status: 'native_reviewed',
    routeMode: 'current-route preference'
  },
  {
    locale: 'en',
    label: 'English',
    status: 'native_reviewed',
    routeMode: 'current-route preference'
  },
  {
    locale: 'ar',
    label: 'العربية',
    status: 'blocked_native_review_required',
    routeMode: 'blocked until reviewed'
  },
  {
    locale: 'so',
    label: 'Soomaali',
    status: 'blocked_native_review_required',
    routeMode: 'blocked until reviewed'
  }
] as const;

export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const normalized = value.toLowerCase().split('-')[0];
  return supportedLocales.includes(normalized as SupportedLocale) ? normalized as SupportedLocale : null;
}

export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): SupportedLocale {
  if (!header?.trim()) return defaultLocale;

  const requested = header
    .split(',')
    .map((part) => {
      const [rawLocale, rawQuality] = part.trim().split(';q=');
      const quality = rawQuality === undefined ? 1 : Number(rawQuality);
      return {
        locale: normalizeLocale(rawLocale),
        quality: Number.isFinite(quality) ? quality : 0
      };
    })
    .filter((entry): entry is { locale: SupportedLocale; quality: number } => entry.locale !== null)
    .sort((left, right) => right.quality - left.quality);

  return requested[0]?.locale ?? defaultLocale;
}
