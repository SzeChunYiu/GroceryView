export type ProductNameLocale = 'sv' | 'en';

export type ProductNameLocaleInput = {
  locale?: string;
  groceryViewLocale?: string;
  acceptLanguage?: string;
  cookie?: string;
};

export function resolveProductNameLocale(input: ProductNameLocaleInput): ProductNameLocale | undefined {
  return (
    normalizeLocale(input.locale)
    ?? normalizeLocale(input.groceryViewLocale)
    ?? normalizeLocale(localeFromCookie(input.cookie))
    ?? localeFromAcceptLanguage(input.acceptLanguage)
  );
}

export function localizedProductNameSql(localePlaceholder: string, tableAlias = 'products'): string {
  return `case
          when ${localePlaceholder}::text = 'en' then coalesce(nullif(${tableAlias}.name_en, ''), ${tableAlias}.canonical_name)
          when ${localePlaceholder}::text = 'sv' then coalesce(nullif(${tableAlias}.name_sv, ''), ${tableAlias}.canonical_name)
          else ${tableAlias}.canonical_name
        end`;
}

function normalizeLocale(value: string | undefined): ProductNameLocale | undefined {
  const normalized = value?.trim().toLowerCase().replace('_', '-');
  if (!normalized) return undefined;
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (normalized === 'sv' || normalized.startsWith('sv-')) return 'sv';
  return undefined;
}

function localeFromCookie(cookie: string | undefined): string | undefined {
  return cookie
    ?.split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('NEXT_LOCALE='))
    ?.slice('NEXT_LOCALE='.length);
}

function localeFromAcceptLanguage(value: string | undefined): ProductNameLocale | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((entry) => entry.trim().split(';')[0])
    .map(normalizeLocale)
    .find((locale): locale is ProductNameLocale => locale !== undefined);
}
