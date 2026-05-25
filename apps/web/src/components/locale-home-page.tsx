import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, PageShell } from './data-ui';
import { MarketShell } from './market-shell';
import { localeOptionFor, localizedShellCopy, type BlockedLocaleRoute, type SupportedLocale } from '@/lib/i18n';
import { buildPersonalizedRecommendationRail, defaultHouseholdId } from '@/lib/personalization';
import { siteUrl } from '@/lib/seo';
import { homepageAdaptiveProductCards } from '@/lib/verified-data';

const languageHomeAlternates = {
  'sv-SE': '/sv',
  'en-SE': '/en',
  'x-default': '/'
};

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export function localeHomeMetadata(locale: SupportedLocale): Metadata {
  const option = localeOptionFor(locale);
  const copy = localizedShellCopy.find((entry) => entry.locale === locale) ?? localizedShellCopy[0];
  const title = `${copy.hero.eyebrow} | GroceryView`;
  const description = copy.hero.body;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: languageHomeAlternates
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${locale}`),
      siteName: 'GroceryView',
      locale: option.htmlLang.replace('-', '_'),
      type: 'website'
    }
  };
}

export function blockedLocaleMetadata(locale: BlockedLocaleRoute): Metadata {
  const option = localeOptionFor(locale);
  const title = `${option.label} translation review required | GroceryView`;
  const description = 'Native-quality translation review required before this language route can show GroceryView copy. No machine-translated prices or source labels are shipped.';

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}`),
      languages: languageHomeAlternates
    },
    robots: { index: false, follow: true }
  };
}

export function LocaleHomePage({ locale }: { locale: SupportedLocale }) {
  return (
    <>
      <PersonalizedRecommendationRail />
      <MarketShell locale={locale} />
    </>
  );
}

export function PersonalizedRecommendationRail() {
  const recommendations = buildPersonalizedRecommendationRail(homepageAdaptiveProductCards, {
    favoriteBrands: ['Garant', 'Änglamark', 'Kaffe'],
    recentListActivity: ['coffee', 'milk', 'bread', 'fruit'],
    limit: 4
  });

  return (
    <PageShell>
      <Card className="border-violet-200 bg-violet-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Personalized for {defaultHouseholdId}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Next likely grocery needs</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Ranked from demo household signals, favorite brands, and recent list activity. The rail only links to verified product pages.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((product) => (
            <Link className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Score {product.score}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600">{product.brand || 'Brand not reported'} · {product.totalPriceLabel ?? 'price pending'}</p>
              <p className="mt-2 text-sm font-bold text-violet-900">{product.reason}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{product.sourceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

export function BlockedLocalePage({ locale }: { locale: BlockedLocaleRoute }) {
  const option = localeOptionFor(locale);

  return (
    <PageShell>
      <Card className="border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{option.label} · {option.nativeLabel}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Native-quality translation review required</h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
          GroceryView only routes Swedish and English public copy today. Arabic and Somali remain visible as expansion routes, but they stay blocked until native reviewers approve every navigation, policy, and source-evidence string.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            'No machine-translated prices',
            'SEK amounts and source evidence stay unchanged',
            'Native-quality translations must pass review before launch'
          ].map((guardrail) => (
            <p className="rounded-2xl bg-white p-4 text-sm font-bold text-amber-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
