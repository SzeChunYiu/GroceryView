export * from './lib/i18n';

const siteUrl = 'https://grocery-web-mu.vercel.app';

export const hreflangLocaleAlternates = [
  { hrefLang: 'sv-SE', locale: 'sv' },
  { hrefLang: 'en-SE', locale: 'en' }
] as const;

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function hreflangAlternateUrls(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const localePath = normalizedPath === '/' ? { sv: '/sv', en: '/en' } : { sv: normalizedPath, en: normalizedPath };

  return {
    'sv-SE': absoluteUrl(localePath.sv),
    'en-SE': absoluteUrl(localePath.en),
    'x-default': absoluteUrl(normalizedPath)
  };
}
