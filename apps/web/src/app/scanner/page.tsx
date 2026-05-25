import Link from 'next/link';
import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { OcrScanHistoryTimeline } from '@/components/ocr-scan-history-timeline';
import { ScannerUploadActions } from '@/components/scanner-upload-actions';
import { barcodeMissFallbackProducts, lookupOpenFoodFactsBarcode } from '@/lib/openfoodfacts-catalog';
import { routeMetadata } from '@/lib/seo';
import { receiptFedAliasGrowthPlan } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/scanner');
}

export const dynamic = 'force-static';

const route = 'scanner';

type ScannerSearchParams = Readonly<{ ean?: string | string[]; barcode?: string | string[]; handoff?: string | string[] }>;

const premiumOcrScanHistory = {
  tier: 'Premium OCR history',
  entitlement: 'premium',
  retainedDays: 365,
  includedTools: ['scan history timeline', 'advanced line-item corrections', 'corrected receipt row export'],
  upgradeReason: 'Frequent barcode and receipt users can revisit prior OCR runs and fix recurring retailer aliases without exposing private receipts publicly.',
  guardrails: [
    'Requires a signed-in account with an active premium entitlement before scan history is stored.',
    'Free accounts can process a scan but saved OCR history and advanced correction drafts stay locked.',
    'Static scanner pages never render private receipt images, extracted lines, or correction history.'
  ]
};

export default async function ScannerPage({ searchParams }: Readonly<{ searchParams?: Promise<ScannerSearchParams> }>) {
  const params = (await searchParams) ?? {};
  const barcodeLookup = lookupOpenFoodFactsBarcode(params.ean ?? params.barcode);
  const handoffSource = Array.isArray(params.handoff) ? params.handoff[0] : params.handoff;

  return (
    <PageShell>
      <NoVerifiedData route={route} title="Receipt scanner has no production uploads in this static snapshot" />
      <div id="barcode-scan" className="scroll-mt-24">
      <Card className="mt-6 border-sky-200 bg-sky-50/80">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-800">Barcode product lookup</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Search bar camera handoff</h1>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Camera actions can route an EAN into this scanner page as <code className="rounded bg-white px-1 py-0.5">?ean=...</code>. GroceryView only links to an OpenFoodFacts product when the barcode is an exact catalogue code.
            </p>
          </div>
          <Link className="rounded-full bg-sky-900 px-5 py-3 text-sm font-black text-white" href="/products">
            Browse products
          </Link>
        </div>
        {barcodeLookup ? (
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-sm font-black text-slate-950">{barcodeLookup.lookupLabel}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {handoffSource ? `handoff ${handoffSource} · ` : ''}EAN {barcodeLookup.barcode}
            </p>
            {barcodeLookup.product ? (
              <Link className="mt-3 inline-flex rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" href={`/products/${barcodeLookup.product.slug}`}>
                Open {barcodeLookup.product.name}
              </Link>
            ) : (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">Use receipt upload or manual search below; unmatched barcodes are not guessed from partial digits.</p>
            )}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
            No barcode supplied yet. Start from the SearchBar camera action or add an EAN manually to the URL for product lookup.
          </p>
        )}
      </Card>
      </div>
      <Card className="mt-6 border-indigo-200 bg-indigo-50/80">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Receipt OCR alias growth</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Receipt-fed commodity alias growth</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Scanner rows can propose loose-item aliases only when they carry {receiptFedAliasGrowthPlan.evidenceRequirement} (chain label + kr + weight): the chain label, observed SEK total, and weight/unit evidence from receipt OCR.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-indigo-950">
              No private receipt images are shown here. Alias candidates stay in human review until a reviewer accepts {receiptFedAliasGrowthPlan.reviewAction}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Candidate rows</p>
              <p className="mt-2 text-4xl font-black text-indigo-950">{receiptFedAliasGrowthPlan.candidates.length}</p>
              <p className="mt-2 text-sm font-semibold text-indigo-900">{receiptFedAliasGrowthPlan.status}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Review action</p>
              <p className="mt-2 break-all text-lg font-black text-indigo-950">{receiptFedAliasGrowthPlan.reviewAction}</p>
              <p className="mt-2 text-sm font-semibold text-indigo-900">{receiptFedAliasGrowthPlan.reviewQueue} · {receiptFedAliasGrowthPlan.trustTable}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {receiptFedAliasGrowthPlan.candidates.map((candidate) => (
            <div className="rounded-2xl bg-white/80 p-4" key={candidate.id}>
              <p className="text-sm font-black text-slate-950">{candidate.normalizedAlias}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.chainLabel} · {candidate.itemTotal} kr · {candidate.quantity} {candidate.comparableUnit}</p>
              <p className="mt-2 text-2xl font-black text-indigo-950">{candidate.unitPrice} kr/{candidate.comparableUnit}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Priority {candidate.priority}; confidence {Math.round(candidate.confidence * 100)}%; reporter trust {Math.round(candidate.sourceTrust * 100)}%
                {candidate.reporterId ? `; reporter ${candidate.reporterId}` : ''}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Evidence text: {candidate.evidenceText}. Private image evidence is {candidate.evidenceImageUri ? 'attached to the review item' : 'not available'} and not rendered publicly.
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white/80 p-4">
          <p className="text-sm font-black text-slate-950">Guardrails</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {receiptFedAliasGrowthPlan.guardrails.map((guardrail) => (
              <li key={guardrail}>• {guardrail}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-bold text-indigo-950">Next runtime step: {receiptFedAliasGrowthPlan.nextRuntimeStep}</p>
        </div>
      </Card>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Premium scan tools</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">OCR scan history and advanced corrections</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {premiumOcrScanHistory.upgradeReason} Premium keeps {premiumOcrScanHistory.retainedDays} days of account-bound scan history for {premiumOcrScanHistory.includedTools.join(', ')}.
            </p>
          </div>
          <Link className="rounded-full bg-emerald-900 px-5 py-3 text-center text-sm font-black text-white shadow-sm" href="/pricing">
            Compare premium plans
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {premiumOcrScanHistory.includedTools.map((tool) => (
            <p className="rounded-2xl bg-white/80 p-3 text-sm font-black capitalize text-emerald-950" key={tool}>{tool}</p>
          ))}
        </div>
        <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-emerald-950">
          {premiumOcrScanHistory.guardrails.map((guardrail) => <li key={guardrail}>• {guardrail}</li>)}
        </ul>
      </Card>
      <Card className="mt-6 border-indigo-200 bg-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Mobile scanner shortcut</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Bottom nav keeps in-store workflows one tap away</h2>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          The mobile bottom navigation now promotes Scan, the current shopping list, nearby deals, and the watchlist so grocery trips can jump between receipt capture, aisle tasks, and price checks without opening menus. Installed PWA launches use a dedicated scanner URL so analytics can distinguish app-mode scans from browser taps.
        </p>
        <div className="mt-4 grid gap-2 text-sm font-bold text-indigo-950 sm:grid-cols-2">
          <p className="rounded-2xl bg-indigo-50 p-3">Browser shortcut: /scanner?launch=bottom-nav-browser#scan</p>
          <p className="rounded-2xl bg-indigo-50 p-3">Installed shortcut: /scanner?launch=bottom-nav-pwa#scan</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white" href="#scan">Scan receipt</Link>
          <Link className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-black text-indigo-900" href="#scan-history">Recent scans</Link>
          <Link className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-black text-indigo-900" href="/list">Current list</Link>
          <Link className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-black text-indigo-900" href="/screener">Nearby deals</Link>
          <Link className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-black text-indigo-900" href="/watchlist">Watchlist</Link>
        </div>
      </Card>
      <div id="scan" className="scroll-mt-24">
        <ScannerUploadActions fallbackProducts={barcodeMissFallbackProducts} />
      </div>
      <div id="scan-history" className="scroll-mt-24">
        <OcrScanHistoryTimeline />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
