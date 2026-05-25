import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDownRight, BadgePercent, LineChart, ShieldCheck, Shuffle, Store } from 'lucide-react';
import { calculatePersonalGroceryInflation } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { personalGroceryInflation } from '@/lib/demo-data';
import { formatPct, formatSek, topChainSpreads } from '@/lib/verified-data';

type InflationHedgePageProps = Readonly<{ params: Promise<{ country: string }> }>;

type HedgeCandidate = {
  id: string;
  action: string;
  chainLabel: string;
  productName: string;
  brand: string;
  sourcePrice: number;
  hedgePrice: number;
  savings: number;
  spreadPct: number;
  reliefPct: number;
  evidence: string;
};

const officialCpiReference = {
  label: 'Official food CPI reference',
  authority: 'SCB',
  table: 'KPI2020COICOPM',
  category: 'Food and non-alcoholic beverages',
  inflationPercent: 3.4,
  updatedAt: '2026-05-13',
  caveat: 'Static build reference only; refresh from SCB PxWeb before presenting this as the latest official CPI print.'
};

function titleCaseSegment(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return 'Not reported';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatSignedSek(value: number) {
  if (!Number.isFinite(value)) return 'Not reported';
  return `${value >= 0 ? '+' : '-'}${formatSek(Math.abs(value))}`;
}

function buildHedgeCandidates(baseSpend: number): HedgeCandidate[] {
  return topChainSpreads
    .filter((product) => product.lowestPrice > 0 && product.highestPrice > product.lowestPrice)
    .slice(0, 7)
    .map((product) => {
      const savings = Math.round((product.highestPrice - product.lowestPrice) * 100) / 100;
      const reliefPct = baseSpend > 0 ? Math.round((savings / baseSpend) * 1000) / 10 : 0;
      const chainLabel = product.lowestChain.charAt(0).toUpperCase() + product.lowestChain.slice(1);
      return {
        id: product.slug,
        action: `Move this line to ${chainLabel} or choose the ${product.brand} equivalent`,
        chainLabel,
        productName: product.name,
        brand: product.brand || 'Brand not reported',
        sourcePrice: product.highestPrice,
        hedgePrice: product.lowestPrice,
        savings,
        spreadPct: product.spreadPct,
        reliefPct,
        evidence: `${product.inChains.join(' vs ')} matched Axfood product ${product.code}`
      };
    });
}

function buildHedgedInflationSummary(candidates: readonly HedgeCandidate[]) {
  const totalRelief = candidates.slice(0, 4).reduce((sum, candidate) => sum + candidate.savings, 0);
  const currentSpendAfterSwitches = Math.max(0, personalGroceryInflation.currentSpend - totalRelief);
  const scale = personalGroceryInflation.currentSpend > 0
    ? currentSpendAfterSwitches / personalGroceryInflation.currentSpend
    : 1;

  return calculatePersonalGroceryInflation({
    baseDate: personalGroceryInflation.baseDate,
    currentDate: `${personalGroceryInflation.currentDate} after switch plan`,
    missingProductIds: personalGroceryInflation.missingProductIds,
    items: personalGroceryInflation.itemContributions.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      quantity: 1,
      baseUnitPrice: personalGroceryInflation.baseSpend * item.weight,
      currentUnitPrice: (personalGroceryInflation.baseSpend * item.weight + item.changeAmount) * scale,
      confidence: item.confidence
    }))
  });
}

export async function generateMetadata({ params }: InflationHedgePageProps): Promise<Metadata> {
  const { country } = await params;
  const market = titleCaseSegment(country || 'sweden');
  return {
    title: `${market} personal inflation hedge calculator | GroceryView`,
    description: 'Compare your GroceryView basket inflation against an official CPI reference and rank store or brand switches that can reduce personal grocery inflation.'
  };
}

export default async function InflationHedgePage({ params }: InflationHedgePageProps) {
  const { country } = await params;
  const market = titleCaseSegment(country || 'sweden');
  const hedgeCandidates = buildHedgeCandidates(personalGroceryInflation.baseSpend);
  const totalSwitchSavings = hedgeCandidates.slice(0, 4).reduce((sum, candidate) => sum + candidate.savings, 0);
  const hedgedSummary = buildHedgedInflationSummary(hedgeCandidates);
  const personalVsOfficialGap = personalGroceryInflation.inflationPercent - officialCpiReference.inflationPercent;
  const hedgedVsOfficialGap = hedgedSummary.inflationPercent - officialCpiReference.inflationPercent;
  const bestInflationDrivers = [...personalGroceryInflation.itemContributions]
    .sort((left, right) => right.changeAmount - left.changeAmount)
    .slice(0, 4);

  return (
    <PageShell>
      <section className="overflow-hidden rounded-[2.25rem] border border-emerald-950/10 bg-[#111f1a] p-6 text-white shadow-2xl shadow-emerald-950/20 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-lime-100">
              {market} inflation hedge desk
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-7xl">
              Is your basket outrunning official food CPI?
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-emerald-50/80">
              GroceryView compares the visible weekly basket against an official CPI reference, then turns verified store and brand spreads into a switch list that can push personal grocery inflation back toward the public index.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-lime-950/20" href="/weekly-basket">
                Update basket lines
              </Link>
              <Link className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white" href="/data-sources">
                Audit CPI + price sources
              </Link>
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-lime-300/20 blur-3xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 text-slate-950">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Your basket</p>
                <p className="mt-2 text-5xl font-black tracking-[-0.06em] text-emerald-950">{formatSignedPercent(personalGroceryInflation.inflationPercent)}</p>
                <p className="mt-3 text-sm font-bold text-slate-600">{formatSek(personalGroceryInflation.baseSpend)} baseline → {formatSek(personalGroceryInflation.currentSpend)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-emerald-950/80 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">Official CPI</p>
                <p className="mt-2 text-5xl font-black tracking-[-0.06em]">{formatSignedPercent(officialCpiReference.inflationPercent)}</p>
                <p className="mt-3 text-sm font-bold text-emerald-50/70">{officialCpiReference.authority} {officialCpiReference.table}</p>
              </div>
            </div>
            <div className="mt-3 rounded-3xl bg-lime-300 p-5 text-emerald-950">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Hedged result after top switches</p>
              <p className="mt-2 text-5xl font-black tracking-[-0.06em]">{formatSignedPercent(hedgedSummary.inflationPercent)}</p>
              <p className="mt-3 text-sm font-black">Gap to official CPI moves from {formatSignedPercent(personalVsOfficialGap)} to {formatSignedPercent(hedgedVsOfficialGap)}.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50">
          <LineChart className="h-6 w-6 text-emerald-800" aria-hidden="true" />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Personal gap</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">{formatSignedPercent(personalVsOfficialGap)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">Above official CPI before switches.</p>
        </Card>
        <Card className="border-lime-200 bg-lime-50">
          <BadgePercent className="h-6 w-6 text-lime-800" aria-hidden="true" />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-lime-800">Switch savings</p>
          <p className="mt-2 text-4xl font-black text-lime-950">{formatSek(totalSwitchSavings)}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-lime-950">From top four verified store or brand switches.</p>
        </Card>
        <Card>
          <ShieldCheck className="h-6 w-6 text-slate-800" aria-hidden="true" />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{personalGroceryInflation.itemContributions.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Priced basket lines, with missing rows listed rather than estimated.</p>
        </Card>
        <Card>
          <Shuffle className="h-6 w-6 text-slate-800" aria-hidden="true" />
          <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500">Hedge candidates</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{hedgeCandidates.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Matched Axfood rows with verified cross-chain spreads.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <Card className="bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Eyebrow>Switch plan</Eyebrow>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Store and brand moves ranked by inflation relief</h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Each row is a candidate hedge: move the matching line to the cheapest observed chain, or choose the lower-priced equivalent when the basket accepts a brand swap.
              </p>
            </div>
            <ConfidenceBadge level={personalGroceryInflation.confidence} label={`${personalGroceryInflation.confidence} basket confidence`} sampleSize={personalGroceryInflation.itemContributions.length} />
          </div>
          <div className="mt-5 space-y-3">
            {hedgeCandidates.map((candidate, index) => (
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4" key={candidate.id}>
                <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-900 text-lg font-black text-white">{index + 1}</div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{candidate.productName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.brand} · {candidate.action}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{candidate.evidence}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-sm font-black text-emerald-800">Save {formatSek(candidate.savings)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-600">{formatSek(candidate.sourcePrice)} → {formatSek(candidate.hedgePrice)}</p>
                    <p className="mt-2 inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-950">-{formatPct(candidate.reliefPct)} basket inflation relief</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-amber-200 bg-amber-50">
            <Eyebrow>Official comparator</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-amber-950">{officialCpiReference.label}</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-950">
              {officialCpiReference.authority} {officialCpiReference.table} · {officialCpiReference.category} · reference update {officialCpiReference.updatedAt}.
            </p>
            <p className="mt-3 rounded-2xl bg-white/70 p-4 text-sm font-semibold leading-6 text-amber-950">{officialCpiReference.caveat}</p>
          </Card>
          <Card>
            <Eyebrow>Basket drivers</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Items pushing your inflation</h2>
            <div className="mt-4 space-y-3">
              {bestInflationDrivers.map((item) => (
                <div className="rounded-2xl border border-slate-200 p-4" key={item.productId}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{item.productName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{item.category} · basket weight {(item.weight * 100).toFixed(0)}%</p>
                    </div>
                    <p className="rounded-full bg-rose-50 px-3 py-1 text-sm font-black text-rose-950">{formatSignedPercent(item.changePercent)}</p>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">Contribution {formatSignedSek(item.changeAmount)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6 border-slate-900 bg-slate-950 text-white">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-200">How to read this</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">No magic deflator, just sourced substitutions.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              The hedge plan never rewrites observed prices. It keeps the current basket inflation calculation intact, then separately shows what would happen if you accepted the listed chain or brand switches.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Compare your basket inflation with the official CPI reference.'],
              ['2', 'Sort verified cross-chain spreads by how much they reduce your basket total.'],
              ['3', 'Apply only switches you actually accept; missing prices remain missing.']
            ].map(([step, copy]) => (
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4" key={step}>
                <p className="text-3xl font-black text-lime-200">{step}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">{copy}</p>
              </div>
            ))}
          </div>
        </div>
        {personalGroceryInflation.missingProductIds.length > 0 ? (
          <p className="mt-5 rounded-2xl bg-rose-400/10 p-4 text-sm font-bold text-rose-100">
            Missing basket rows withheld from hedge math: {personalGroceryInflation.missingProductIds.join(', ')}.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950" href="/chain-index">
            <Store className="h-4 w-4" aria-hidden="true" /> Review chain index
          </Link>
          <Link className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-black text-white" href="/savings-dashboard">
            <ArrowDownRight className="h-4 w-4" aria-hidden="true" /> Back to savings dashboard
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
