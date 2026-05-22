export type SupportedLocale = 'sv' | 'en' | 'ar' | 'so';

export type LocaleOption = {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  currency: 'SEK';
};

export const supportedLocales: LocaleOption[] = [
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', htmlLang: 'sv-SE', dir: 'ltr', currency: 'SEK' },
  { code: 'en', label: 'English', nativeLabel: 'English', htmlLang: 'en-SE', dir: 'ltr', currency: 'SEK' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', htmlLang: 'ar-SE', dir: 'rtl', currency: 'SEK' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali', htmlLang: 'so-SE', dir: 'ltr', currency: 'SEK' }
];

export const defaultLocale: SupportedLocale = 'sv';

export const languageAccessMessages: Record<SupportedLocale, { title: string; helper: string }> = {
  sv: {
    title: 'Språk',
    helper: 'Priser, produktnamn och källbevis visas oförändrat på svenska kronor.'
  },
  en: {
    title: 'Language',
    helper: 'Prices, product names, and source evidence stay unchanged in Swedish kronor.'
  },
  ar: {
    title: 'اللغة',
    helper: 'تبقى الأسعار وأسماء المنتجات وأدلة المصدر بدون تغيير وبالكرونة السويدية.'
  },
  so: {
    title: 'Luqad',
    helper: 'Qiimaha, magacyada alaabta, iyo caddaynta ilaha lama beddelo waxayna ku jiraan karoon Iswiidhish.'
  }
};

export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  const base = value.toLowerCase().split('-')[0];
  return supportedLocales.some((locale) => locale.code === base) ? base as SupportedLocale : null;
}

export function localeFromBrowserLanguages(languages: readonly string[] | undefined): SupportedLocale {
  for (const language of languages ?? []) {
    const normalized = normalizeLocale(language);
    if (normalized) return normalized;
  }
  return defaultLocale;
}

export function localeOptionFor(code: SupportedLocale): LocaleOption {
  return supportedLocales.find((locale) => locale.code === code) ?? supportedLocales[0]!;
}
