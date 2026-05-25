export const supportedLocales = ['sv', 'en', 'nb'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const routedLocales = ['sv', 'en', 'nb'] as const;
export const blockedLocaleRoutes = ['ar', 'so'] as const;
export type BlockedLocaleRoute = (typeof blockedLocaleRoutes)[number];
export type LocaleRoute = SupportedLocale | BlockedLocaleRoute;

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
    locale: 'nb',
    label: 'Norsk bokmål',
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

export function localeRoutePrefix(locale: LocaleRoute) {
  return `/${locale}`;
}

export function localeFromPathname(pathname: string): SupportedLocale | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return routedLocales.includes(segment as SupportedLocale) ? segment as SupportedLocale : null;
}

export function blockedLocaleFromPathname(pathname: string): BlockedLocaleRoute | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return blockedLocaleRoutes.includes(segment as BlockedLocaleRoute) ? segment as BlockedLocaleRoute : null;
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
