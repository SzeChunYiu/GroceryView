import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgeCheck, ExternalLink, Pill, Sparkles, Tablets } from 'lucide-react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import {
  apohemEanMatches,
  apohemProducts,
  apohemSource,
  type ApohemIngestedProduct,
  type PharmacyProductCategory
} from '@/lib/ingested/apohem';
import { formatSek, multiVerticalDomainFoundation, pharmacyOtcEvidenceBoard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export const dynamic = 'force-static';

export function generateMetadata() {
  return routeMetadata('/pharmacy');
}

const categoryLabels: Record<PharmacyProductCategory, string> = {
  otc: 'OTC',
  supplement: 'Supplements',
  beauty: 'Beauty'
};

const categoryIcons: Record<PharmacyProductCategory, ReactNode> = {
  otc: <Pill size={18} />,
  supplement: <Tablets size={18} />,
  beauty: <Sparkles size={18} />
};

const chainLabels: Record<ApohemIngestedProduct['chain'], string> = {
  apohem: 'Apohem',
  'apotek-hjartat': 'Apotek Hjärtat'
};

const categories: PharmacyProductCategory[] = ['otc', 'supplement', 'beauty'];
const sourceHostnames = apohemSource.sourceUrls.map((sourceUrl) => new URL(sourceUrl).hostname);
const uniqueSourceHostnames = [...new Set(sourceHostnames)];

type ActiveIngredientRule = {
  ingredient: 'paracetamol' | 'ibuprofen';
  brandedBrands: string[];
  genericName: string;
};

type GenericSavingsMatch = {
  ingredient: string;
  branded: ApohemIngestedProduct;
  generic: ApohemIngestedProduct;
  averageBrandedPrice: number;
  averageGenericPrice: number;
  averageSavings: number;
};

const activeIngredientRules: ActiveIngredientRule[] = [
  { ingredient: 'paracetamol', brandedBrands: ['Alvedon', 'Panodil'], genericName: 'paracetamol' },
  { ingredient: 'ibuprofen', brandedBrands: ['Ipren'], genericName: 'ibuprofen' }
];

function productText(product: ApohemIngestedProduct) {
  return `${product.name} ${product.brand}`.toLocaleLowerCase('sv-SE');
}

function hasActiveIngredient(product: ApohemIngestedProduct, ingredient: ActiveIngredientRule['ingredient']) {
  return product.category === 'otc' && productText(product).includes(ingredient);
}

function isBrandedMedication(product: ApohemIngestedProduct, rule: ActiveIngredientRule) {
  return rule.brandedBrands.some((brand) => product.brand.toLocaleLowerCase('sv-SE') === brand.toLocaleLowerCase('sv-SE'));
}

function averagePrice(rows: ApohemIngestedProduct[]) {
  if (rows.length === 0) return 0;
  return Math.round((rows.reduce((sum, row) => sum + row.price, 0) / rows.length) * 100) / 100;
}

function genericSavingsMatches() {
  return activeIngredientRules.flatMap<GenericSavingsMatch>((rule) => {
    const ingredientRows = apohemProducts.filter((product) => hasActiveIngredient(product, rule.ingredient));
    const brandedRows = ingredientRows.filter((product) => isBrandedMedication(product, rule));
    const genericRows = ingredientRows.filter((product) => !isBrandedMedication(product, rule));
    if (brandedRows.length === 0 || genericRows.length === 0) return [];

    const averageBrandedPrice = averagePrice(brandedRows);
    const averageGenericPrice = averagePrice(genericRows);
    const averageSavings = Math.max(0, Math.round((averageBrandedPrice - averageGenericPrice) * 100) / 100);

    return rule.brandedBrands.flatMap((brand) => {
      const branded = brandedRows.find((product) => product.brand === brand);
      const generic = genericRows.find((product) => productText(product).includes(rule.genericName));
      return branded && generic ? [{ ingredient: rule.ingredient, branded, generic, averageBrandedPrice, averageGenericPrice, averageSavings }] : [];
    });
  });
}

const genericSavings = genericSavingsMatches();

function countBy<T extends string>(rows: readonly ApohemIngestedProduct[], key: (row: ApohemIngestedProduct) => T) {
  return rows.reduce<Record<T, number>>((counts, row) => {
    counts[key(row)] = (counts[key(row)] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

const countsByCategory = countBy(apohemProducts, (product) => product.category);
const countsByChain = countBy(apohemProducts, (product) => product.chain);

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function categoryRows(category: PharmacyProductCategory) {
  return apohemProducts.filter((product) => product.category === category);
}

function sourceLabel(sourceUrl: string) {
  const url = new URL(sourceUrl);
  return `${url.hostname}${url.pathname}`;
}

function DomainFoundationSummary({ domainSlug }: Readonly<{ domainSlug: 'pharmacy' }>) {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === domainSlug)!;
  return (
    <Card className="border-amber-200 bg-amber-50">
      <Eyebrow>{domain.label} foundation</Eyebrow>
      <h2 className="mt-2 text-2xl font-black text-amber-950">Pharmacy OTC price foundation</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
        No domain=pharmacy connector observations yet; this route keeps the domain model and claim boundaries visible while
        the Apohem catalog rows remain public source evidence, not normalized pharmacy observation rows.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Status</p>
          <p className="mt-2 text-lg font-black text-amber-950">No domain=pharmacy connector observations yet</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">OTC item models</p>
          <p className="mt-2 text-lg font-black text-amber-950">{domain.seedItemCount} supported EAN models</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Claim boundary</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">{domain.claimBoundary}</p>
        </div>
      </div>
    </Card>
  );
}

export default function PharmacyPage() {
  return (
    <PageShell>
      <DomainFoundationSummary domainSlug="pharmacy" />

      <header className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-market-mint">
            <BadgeCheck size={16} />
            Pharmacy catalog
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {apohemSource.rowCount} EAN-coded OTC, supplement, and beauty rows.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Apohem and Apotek Hjärtat public pages retrieved {formatDate(apohemSource.retrievedAt)}. Prescription product
            groups are excluded before the static rows are surfaced.
          </p>
        </div>

        <div className="rounded-lg border border-market-ink/10 bg-white p-5">
          <h2 className="text-lg font-black">Source tape</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <MetadataRow label="Chains" value={uniqueSourceHostnames.join(' + ')} />
            <MetadataRow label="Rows" value={apohemSource.rowCount.toLocaleString()} />
            <MetadataRow label="EAN matches" value={apohemSource.eanMatchCount.toLocaleString()} />
            <MetadataRow label="Retrieved" value={formatDate(apohemSource.retrievedAt)} />
          </dl>
        </div>
      </header>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
        OTC, supplement, and beauty rows are shown as public catalog evidence only. Prescription medicine, medical advice,
        stock availability claims, and cheapest-pharmacy claims stay excluded from this surface.
      </section>

      {genericSavings.length > 0 ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <Eyebrow>Generic medicine comparison</Eyebrow>
              <h2 className="mt-2 text-2xl font-black text-emerald-950">Branded OTC rows linked to same-ingredient generics</h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
                Matches are grouped only when the public product title names the same active ingredient. Average savings compare branded rows with generic rows in the same active-ingredient group; this is price evidence, not medical advice.
              </p>
            </div>
            <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-emerald-950 shadow-sm">
              {genericSavings.length} branded OTC matches
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {genericSavings.map((match) => (
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={`${match.branded.ean}-${match.generic.ean}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{match.ingredient}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{match.branded.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Branded: {match.branded.brand} · {match.branded.priceText}</p>
                <a className="mt-3 block rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-950 hover:border-emerald-700" href={match.generic.productUrl}>
                  Generic match: {match.generic.name} · {match.generic.priceText}
                </a>
                <p className="mt-3 text-sm font-black text-emerald-950">
                  Avg savings {formatSek(match.averageSavings)} ({formatSek(match.averageBrandedPrice)} branded avg vs {formatSek(match.averageGenericPrice)} generic avg)
                </p>
                <p className="mt-2 text-xs font-semibold text-slate-600">Linked via active ingredient in title; compare dosage and package count before purchase.</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="border-indigo-200 bg-indigo-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>{pharmacyOtcEvidenceBoard.source}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-indigo-950">OTC price evidence from public observations</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              These OpenPrices + OpenBeautyFacts rows are not a pharmacy-chain comparison. They keep OTC price evidence
              visible without adding prescription medicine, medical advice, stock, or cheapest-pharmacy claims.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-indigo-950 shadow-sm">
            {pharmacyOtcEvidenceBoard.productCount} OTC candidates · {pharmacyOtcEvidenceBoard.observationCount} observations
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pharmacyOtcEvidenceBoard.rows.map((row) => (
            <Link className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm hover:border-indigo-700" data-pharmacy-otc-evidence={row.slug} href={`/products/${row.slug}`} key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{row.evidence}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · EAN {row.code}</p>
              <p className="mt-3 text-2xl font-black text-indigo-950">{formatSek(row.priceMedian)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Range {formatSek(row.priceMin)} to {formatSek(row.priceMax)} · {row.observationCount} observations</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.confidence} · last {row.lastObservedAt}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-950">
          No prescription medicine. No medical advice. Not a pharmacy-chain comparison.
        </p>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <MetricTile
            key={category}
            icon={categoryIcons[category]}
            label={categoryLabels[category]}
            value={String(countsByCategory[category] ?? 0)}
          />
        ))}
        <MetricTile label="Apohem" value={String(countsByChain.apohem ?? 0)} />
        <MetricTile label="Apotek Hjärtat" value={String(countsByChain['apotek-hjartat'] ?? 0)} />
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid gap-3 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-lg font-black">Cross-chain EAN matches</h2>
            <p className="mt-1 text-sm text-market-ink/60">
              Shared barcodes are kept as explicit match evidence across the two pharmacy sources.
            </p>
          </div>
          <span className="text-sm font-black tabular-nums text-market-mint">
            {apohemEanMatches.length.toLocaleString()} matches
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {apohemEanMatches.slice(0, 8).map((match) => (
            <div key={match.ean} className="border-b border-market-ink/10 px-4 py-3 text-sm md:border-r">
              <span className="block font-black tabular-nums">{match.ean}</span>
              <span className="mt-1 block text-market-ink/60">{match.names.join(' / ')}</span>
            </div>
          ))}
        </div>
      </section>

      {categories.map((category) => (
        <ProductSection key={category} title={categoryLabels[category]} products={categoryRows(category)} />
      ))}

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">Retrieved sources</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          {apohemSource.sourceUrls.map((sourceUrl) => (
            <a
              key={sourceUrl}
              href={sourceUrl}
              className="flex items-center justify-between gap-3 border-b border-market-ink/10 px-4 py-3 text-sm font-semibold hover:bg-market-oat/45 md:border-r"
            >
              <span className="truncate">{sourceLabel(sourceUrl)}</span>
              <ExternalLink size={16} className="shrink-0 text-market-mint" />
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ProductSection({ title, products }: { title: string; products: ApohemIngestedProduct[] }) {
  return (
    <section className="rounded-lg border border-market-ink/10 bg-white">
      <div className="grid gap-2 border-b border-market-ink/10 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="text-sm font-black tabular-nums text-market-mint">{products.length.toLocaleString()} rows</span>
      </div>
      <div className="hidden grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55 md:grid">
        <span>Product</span>
        <span>Chain</span>
        <span>EAN</span>
        <span>Price</span>
        <span>Source</span>
      </div>
      <ul className="divide-y divide-market-ink/5">
        {products.slice(0, 18).map((product) => (
          <li
            key={`${product.chain}-${product.ean}`}
            className="grid gap-3 px-4 py-3 text-sm hover:bg-market-oat/45 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_0.9fr]"
          >
            <a href={product.productUrl} className="min-w-0 font-black hover:text-market-mint">
              <span className="block truncate" title={product.name}>
                {product.name}
              </span>
              <span className="mt-1 block truncate text-xs font-semibold text-market-ink/55">
                {product.brand || product.code}
              </span>
            </a>
            <span className="font-semibold text-market-ink/70">{chainLabels[product.chain]}</span>
            <span className="font-mono text-xs text-market-ink/65">{product.ean}</span>
            <span className="font-black tabular-nums">{product.priceText}</span>
            <a href={product.sourceUrl} className="truncate text-xs font-bold text-market-mint" title={product.sourceUrl}>
              {sourceLabel(product.sourceUrl)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MetricTile({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-market-ink/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-market-ink/50">
        {icon ? <span className="text-market-mint">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 text-3xl font-black tabular-nums">{value}</div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-market-ink/10 pb-2 last:border-b-0">
      <dt className="text-market-ink/55">{label}</dt>
      <dd className="truncate font-black">{value}</dd>
    </div>
  );
}
