import Link from 'next/link';
import { notFound } from 'next/navigation';
import { calculateDealScore, recommendSmartSwaps, scoreBand, type BrandTier, type SmartSwapInput } from '@groceryview/core';
import { axfoodProducts, type AxfoodProduct, type ChainPrice } from '@/lib/axfood-products';
import { products } from '@/lib/demo-data';

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  const apiProductId = product.slug === 'zoegas-coffee-450g' ? 'coffee' : null;
  const dealScore = calculateDealScore(buildDealScoreInput(product));
  const verdict = scoreBand(dealScore);
  const smartSwaps = recommendSmartSwaps(buildSmartSwapInput(product));
  const chainMatch = findCheapestChainMatch(product);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Product terminal</div>
        <h1 className="mt-3 text-4xl font-black">{product.ticker}</h1>
        <p className="mt-2 text-market-ink/65">{product.name}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Current price" value={product.price} />
          <Metric label="Unit price" value={product.unitPrice} />
          <Metric label="Store" value={product.store} />
          <Metric label="Deal Score" value={String(dealScore)} />
        </div>
        <div className="mt-4 rounded-md border border-market-mint/20 bg-market-mint/10 p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Deal verdict</div>
          <div className="mt-1 text-2xl font-black">{verdict.label}: {verdict.verdict}</div>
          <p className="mt-2 text-sm leading-6 text-market-ink/65">
            Score blends current city rank, known promo depth, equivalent unit-price pressure, and source confidence.
            Sponsored placement is ignored by the core scorer.
          </p>
        </div>

        {smartSwaps.length > 0 ? (
          <section className="mt-4 rounded-md border border-market-ink/10 bg-market-oat/25 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Smart swaps</div>
            <div className="mt-3 grid gap-3">
              {smartSwaps.map((swap) => {
                const swapProduct = products.find((candidate) => candidate.slug === swap.productId);
                return (
                  <Link
                    key={swap.productId}
                    href={`/products/${swap.productId}`}
                    className="rounded-md border border-market-ink/10 bg-white p-3 text-sm hover:border-market-mint/60"
                  >
                    <span className="block font-black">{swapProduct?.name ?? swap.productId}</span>
                    <span className="mt-1 block text-market-ink/60">
                      Save {swap.savingsPercent.toFixed(1)}% · {swap.confidence} confidence · {swap.qualityRisk} qualityRisk
                    </span>
                    <span className="mt-2 block text-market-ink/65">{swap.reason}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-4 rounded-md border border-market-ink/10 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Cheapest chain match</div>
          {chainMatch ? (
            <>
              <div className="mt-2 text-2xl font-black">
                {CHAIN_LABEL[chainMatch.lowestChain] ?? chainMatch.lowestChain} is cheapest · {chainMatch.spreadPct.toFixed(1)}% spread
              </div>
              <p className="mt-2 text-sm leading-6 text-market-ink/65">
                Matched Axfood EAN {chainMatch.code} ({chainMatch.name}, {chainMatch.subline}) against Willys and Hemköp live price rows.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {CHAIN_ORDER.map((chain) => (
                  <ChainPriceCard
                    key={chain}
                    chain={CHAIN_LABEL[chain] ?? chain}
                    price={chainMatch.chains[chain]}
                    isLowest={chainMatch.lowestChain === chain}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm leading-6 text-market-ink/65">
              No Willys↔Hemköp EAN match is available for this demo product yet, so GroceryView does not fabricate a cheapest-chain claim.
            </p>
          )}
        </section>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Metadata label="Price type" value={product.priceType} />
          <Metadata label="Confidence" value={product.confidence} />
          <Metadata label="Source timestamp" value={product.observedAt} />
          <Metadata label="Source type" value={product.source} />
          {apiProductId ? <Metadata label="API spread" value={`/products/${apiProductId}/spread`} /> : null}
        </dl>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}

function Metadata({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md border border-market-ink/10 p-3">
      <dt className="font-semibold text-market-ink/55">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}

function ChainPriceCard({ chain, price, isLowest }: Readonly<{ chain: string; price: ChainPrice | undefined; isLowest: boolean }>) {
  return (
    <div className={`rounded-md border p-3 ${isLowest ? 'border-market-mint bg-market-mint/10' : 'border-market-ink/10'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-black">{chain}</span>
        {isLowest ? <span className="text-xs font-bold uppercase tracking-widest text-market-mint">Cheapest</span> : null}
      </div>
      <div className="mt-2 text-2xl font-black tabular-nums">
        {price?.price != null ? `${price.price.toFixed(2)} kr` : '—'}
      </div>
      <div className="mt-1 text-xs text-market-ink/55">{price?.priceUnit ?? 'No captured price'}</div>
    </div>
  );
}


type ProductDriver = (typeof products)[number];
const CHAIN_LABEL: Record<string, string> = { willys: 'Willys', hemkop: 'Hemköp' };
const CHAIN_ORDER = ['willys', 'hemkop'] as const;
const PRODUCT_MATCH_TERMS: Record<string, string[]> = {
  'zoegas-coffee-450g': ['zoegas', 'coffee', 'kaffe'],
  'arla-milk-1l': ['arla', 'mjolk', 'mjölk'],
  'pagen-jattefralla-500g': ['pagen', 'pågen', 'jattefralla', 'jättefralla'],
  'felix-ketchup-1kg': ['felix', 'ketchup', 'tomatketchup'],
  'barilla-spaghetti-1kg': ['barilla', 'spaghetti'],
  'bregott-normalsaltat-600g': ['bregott', 'normalsaltat'],
  'garant-havregryn-1kg': ['garant', 'havregryn'],
  'zeta-olivolja-classico-500ml': ['zeta', 'olivolja', 'classico'],
  'santa-maria-taco-spice-28g': ['santa', 'maria', 'taco', 'spice'],
  'bravo-apelsinjuice-1l': ['bravo', 'apelsinjuice'],
  'scan-falukorv-800g': ['scan', 'falukorv'],
  'zeta-kikartor-380g': ['zeta', 'kikärtor', 'kikartor'],
  'pagen-lingongrova-500g': ['pagen', 'pågen', 'lingongrova'],
  'arla-hushallsost-500g': ['arla', 'hushållsost', 'hushallsost']
};

function parseSek(value: string): number {
  const parsed = Number(value.replace(',', '.').match(/\d+(\.\d+)?/)?.[0] ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function confidenceWeight(confidence: string): number {
  if (confidence === 'high') return 0.92;
  if (confidence === 'medium') return 0.72;
  return 0.55;
}

function buildDealScoreInput(product: ProductDriver) {
  const currentPrice = parseSek(product.price);
  const promoLike = /promo|deal|clearance/i.test(product.priceType);
  const onlineOnly = /online/i.test(product.priceType);
  const cityPercentile = promoLike ? 18 : onlineOnly ? 46 : 58;
  const promoHistoryPercentile = promoLike ? 22 : 52;
  const equivalentPercentile = product.unitPrice.includes('/kg') ? 35 : product.unitPrice.includes('/l') ? 42 : 50;
  const assumedRegularPrice = promoLike ? currentPrice * 1.2 : currentPrice * 1.06;
  const discountDepthPercent = assumedRegularPrice > 0 ? ((assumedRegularPrice - currentPrice) / assumedRegularPrice) * 100 : 0;

  return {
    currentCityPercentile: cityPercentile,
    knownPromoHistoryPercentile: promoHistoryPercentile,
    equivalentUnitPricePercentile: equivalentPercentile,
    discountDepthPercent,
    sourceConfidence: confidenceWeight(product.confidence),
    sponsoredPlacement: false
  };
}


function categoryForProduct(product: ProductDriver): string {
  const name = product.name.toLowerCase();
  if (/rice|spaghetti|pasta|ketchup|kik/.test(name)) return 'rice';
  if (/coffee|kaffe/.test(name)) return 'coffee';
  if (/milk|fil|bregott|ost|egg|ägg/.test(name)) return 'milk';
  if (/bread|fralla|rostbröd/.test(name)) return 'bread';
  if (/juice|olivolja|soup/.test(name)) return 'beverages';
  if (/falukorv|kyckling|lax|färs/.test(name)) return 'meat';
  if (/tomat|potatis/.test(name)) return 'vegetables';
  return 'pantry';
}

function brandTierForProduct(product: ProductDriver) {
  const name = product.name.toLowerCase();
  if (/eldorado|garant/.test(name)) return 'standard_private_label' as const;
  if (/ica|coop|willys|lidl/.test(name)) return 'discount_chain_label' as const;
  if (/zeta|zoegas|barilla|bregott/.test(name)) return 'premium' as const;
  return 'national' as const;
}

function buildProductMatch(product: ProductDriver) {
  return {
    id: product.slug,
    brand: product.name.split(' ')[0] ?? product.name,
    category: categoryForProduct(product),
    packageSize: 1,
    packageUnit: categoryForProduct(product),
    brandTier: brandTierForProduct(product),
    unitPrice: parseSek(product.unitPrice)
  };
}

function buildSmartSwapInput(product: ProductDriver): SmartSwapInput {
  const source = buildProductMatch(product);
  const candidates = products
    .filter((candidate) => candidate.slug !== product.slug)
    .map(buildProductMatch)
    .filter((candidate) => candidate.category === source.category && candidate.unitPrice < source.unitPrice);

  return {
    source,
    candidates,
    acceptPrivateLabel: 'maybe' as const,
    minimumSavingsPercent: 5,
    privateLabelPreference: {
      acceptedTiers: ['standard_private_label', 'organic_private_label', 'discount_chain_label'] satisfies BrandTier[],
      blockedCategories: ['baby_formula', 'medical_diet']
    }
  };
}

function findCheapestChainMatch(product: ProductDriver): AxfoodProduct | null {
  const requiredTerms = tokenize((PRODUCT_MATCH_TERMS[product.slug] ?? tokenize(product.name)).join(' '));
  const candidates = axfoodProducts.filter((candidate) => candidate.inChains.length >= 2);
  let best: { product: AxfoodProduct; score: number } | null = null;

  for (const candidate of candidates) {
    const haystack = tokenize(`${candidate.name} ${candidate.brand} ${candidate.subline} ${candidate.category}`);
    const score = requiredTerms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    if (score > (best?.score ?? 0)) best = { product: candidate, score };
  }

  return best && best.score >= Math.min(2, requiredTerms.length) ? best.product : null;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9åäö]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token));
}
