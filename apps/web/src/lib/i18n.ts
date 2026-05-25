import { createTranslator } from 'next-intl';
import enMessages from '../../messages/en.json';
import nbMessages from '../../messages/nb.json';
import svMessages from '../../messages/sv.json';
import {
  defaultLocale as routingDefaultLocale,
  localeCookieName,
  localeReadiness,
  localeStorageKey,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  supportedLocales,
  type BlockedLocaleRoute,
  type SupportedLocale
} from './i18n-routing';
import {
  formatPer100gUnitPriceLabel,
  formatSourceUnitPriceText,
  formatUnitPriceLabel,
  normalizeUnitPriceDisplayUnit,
  unknownUnitPriceLabel,
  unitPriceDisplayUnits
} from './unit-price-formatting.js';

type GroceryMessages = typeof svMessages;
export type LanguageAccessLocale = SupportedLocale | 'ar' | 'so';
export const supportedCurrencies = ['SEK', 'NOK', 'DKK', 'EUR', 'ISK'] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];

export type LocaleOption = {
  code: LanguageAccessLocale;
  label: string;
  nativeLabel: string;
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  currency: SupportedCurrency;
  status: 'native_reviewed' | 'blocked_native_review_required';
};

export const defaultLocale = 'sv' as SupportedLocale;

const messagesByLocale: Record<SupportedLocale, GroceryMessages> = {
  sv: svMessages,
  en: enMessages,
  nb: nbMessages
};

export const languageAccessOptions: LocaleOption[] = [
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', htmlLang: 'sv-SE', dir: 'ltr', currency: 'SEK', status: 'native_reviewed' },
  { code: 'en', label: 'English', nativeLabel: 'English', htmlLang: 'en-SE', dir: 'ltr', currency: 'SEK', status: 'native_reviewed' },
  { code: 'nb', label: 'Norwegian Bokmål', nativeLabel: 'Norsk bokmål', htmlLang: 'nb-NO', dir: 'ltr', currency: 'SEK', status: 'native_reviewed' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', htmlLang: 'ar-SE', dir: 'rtl', currency: 'SEK', status: 'blocked_native_review_required' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali', htmlLang: 'so-SE', dir: 'ltr', currency: 'SEK', status: 'blocked_native_review_required' }
];

export const languageAccessMessages: Record<SupportedLocale, { title: string; helper: string }> = {
  sv: {
    title: 'Språk',
    helper: 'Priser, produktnamn och källbevis visas oförändrat i svenska kronor.'
  },
  en: {
    title: 'Language',
    helper: 'Prices, product names, and source evidence stay unchanged in Swedish kronor.'
  },
  nb: {
    title: 'Språk',
    helper: 'Priser, produktnavn og kildebevis vises uendret i svenske kroner.'
  }
};

if (defaultLocale !== routingDefaultLocale) {
  throw new Error('i18n default locale must match routing default locale');
}

export {
  localeCookieName,
  localeReadiness,
  localeStorageKey,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  supportedLocales,
  type BlockedLocaleRoute,
  type SupportedLocale
};

export function groceryTranslator(locale: string | null | undefined = defaultLocale) {
  const resolvedLocale = normalizeLocale(locale) ?? defaultLocale;
  return createTranslator({
    locale: resolvedLocale,
    messages: messagesByLocale[resolvedLocale]
  });
}

export function localeFromBrowserLanguages(languages: readonly string[] | undefined): SupportedLocale {
  for (const language of languages ?? []) {
    const normalized = normalizeLocale(language);
    if (normalized) return normalized;
  }
  return defaultLocale;
}

export function localeOptionFor(code: LanguageAccessLocale): LocaleOption {
  return languageAccessOptions.find((locale) => locale.code === code) ?? languageAccessOptions[0]!;
}

export function normalizeCurrency(value: string | null | undefined): SupportedCurrency {
  const normalized = value?.trim().toUpperCase();
  return supportedCurrencies.includes(normalized as SupportedCurrency) ? normalized as SupportedCurrency : 'SEK';
}

export function currencyFromObservation(observation: { currency?: string | null }): SupportedCurrency {
  return normalizeCurrency(observation.currency);
}

type LocalizedFormatOptions = {
  locale?: LanguageAccessLocale | null;
  currency?: string | null;
  maximumFractionDigits?: number;
};

function localeOptionForFormat(locale: LanguageAccessLocale | null | undefined) {
  return localeOptionFor(locale ?? defaultLocale);
}

export function formatLocalizedMoney(value: number | null | undefined, options: LocalizedFormatOptions = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Not reported';
  const localeOption = localeOptionForFormat(options.locale);
  return new Intl.NumberFormat(localeOption.htmlLang, {
    style: 'currency',
    currency: normalizeCurrency(options.currency ?? localeOption.currency),
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(value);
}

export function formatLocalizedDate(value: string | Date | null | undefined, options: { locale?: LanguageAccessLocale | null } = {}) {
  if (!value) return 'Not reported';
  const date = typeof value === 'string' ? new Date(value.includes('T') ? value : `${value}T00:00:00.000Z`) : value;
  if (Number.isNaN(date.getTime())) return 'Not reported';
  const localeOption = localeOptionForFormat(options.locale);
  return new Intl.DateTimeFormat(localeOption.htmlLang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function formatLocalizedUnitPrice(
  value: number | null | undefined,
  options: LocalizedFormatOptions & { unit: string | null | undefined; unknownLabel?: string }
) {
  const localeOption = localeOptionForFormat(options.locale);
  return formatUnitPriceLabel(value, options.unit, {
    locale: localeOption.htmlLang,
    currency: normalizeCurrency(options.currency ?? localeOption.currency),
    maximumFractionDigits: options.maximumFractionDigits,
    unknownLabel: options.unknownLabel
  });
}

export function formatLocalizedPer100gUnitPrice(
  valuePerKg: number | null | undefined,
  options: LocalizedFormatOptions & { unknownLabel?: string } = {}
) {
  const localeOption = localeOptionForFormat(options.locale);
  return formatPer100gUnitPriceLabel(valuePerKg, {
    locale: localeOption.htmlLang,
    currency: normalizeCurrency(options.currency ?? localeOption.currency),
    maximumFractionDigits: options.maximumFractionDigits,
    unknownLabel: options.unknownLabel
  });
}

export {
  formatSourceUnitPriceText,
  normalizeUnitPriceDisplayUnit,
  unknownUnitPriceLabel,
  unitPriceDisplayUnits
};

export const localizedShellCopy = supportedLocales.map((locale) => {
  const t = groceryTranslator(locale);
  return {
    locale,
    nav: {
      overview: t('nav.overview'),
      products: t('nav.products'),
      compare: t('nav.compare'),
      mealCost: t('nav.mealCost'),
      savings: t('nav.savings'),
      chain: t('nav.chain'),
      stores: t('nav.stores'),
      openPrices: t('nav.openPrices'),
      map: t('nav.map'),
      categories: t('nav.categories')
    },
    hero: {
      eyebrow: t('home.eyebrow'),
      headline: t('home.headline'),
      body: t('home.body')
    },
    language: {
      label: t('language.label'),
      persisted: t('language.persisted'),
      guardrail: t('language.guardrail')
    },
    evidence: 'next-intl createTranslator messages with native-reviewed sv/en/nb copy'
  };
});

export const localeTranslationGuardrails = [
  'Swedish, English, and Norwegian Bokmål shell copy is reviewed and stored in messages/{locale}.json.',
  'Prices, product names, source labels, and retailer evidence remain unchanged across languages.',
  'Arabic and Somali remain blocked until native-quality translations are reviewed; no MT copy is shipped.'
];
