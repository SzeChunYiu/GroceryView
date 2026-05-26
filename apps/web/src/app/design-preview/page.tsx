/**
 * /design-preview — living showcase of the v3 editorial-terminal design system
 * rendering inside the real Next.js app. Proves tokens, atoms, charts, and the
 * shell render correctly; serves as the template for per-page conversion.
 */
import { PageShell } from '@/components/ds/shell';
import { Card, KPI, Pill, StatRow, StoreChip, SavingsBanner, ProductTile, ExplainChip, type TileProduct } from '@/components/ds/atoms';
import { PriceChart, MultiLineChart, BarChart, Donut, Gauge, ScoreBar, Sparkline, type PricePoint } from '@/components/ds/charts';

export const dynamic = 'force-static';
export function generateMetadata() {
  return { title: 'Design preview · GroceryView', robots: { index: false } };
}

const priceHistory: PricePoint[] = Array.from({ length: 90 }, (_, i) => ({
  date: `2026-${String(3 + Math.floor(i / 30)).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
  price: 24 + Math.sin(i / 9) * 3 + (i > 70 ? -3 : 0) + (i % 7 === 0 ? 1.2 : 0),
}));

const products: TileProduct[] = [
  { slug: 'milk', name: 'Arla Mellanmjölk 1.5%', brand: 'Arla', size: '1 L', emoji: '🥛', price: 14.9, regular: 17.5, unitPrice: '14.90 kr/L', badge: '-15%', verdict: 'Good price', cheapestChain: { name: 'Willys', color: 'oklch(55% 0.15 145)' } },
  { slug: 'bread', name: 'Pågen Lingongrova', brand: 'Pågen', size: '700 g', emoji: '🍞', price: 27.9, unitPrice: '39.86 kr/kg', verdict: 'Typical', cheapestChain: { name: 'ICA', color: 'oklch(55% 0.18 25)' } },
  { slug: 'coffee', name: 'Gevalia Mellanrost', brand: 'Gevalia', size: '450 g', emoji: '☕', price: 49.0, regular: 65.0, unitPrice: '108.9 kr/kg', badge: '-25%', verdict: 'Good price', cheapestChain: { name: 'Lidl', color: 'oklch(55% 0.16 250)' } },
  { slug: 'eggs', name: 'Kronägg Frigående 12-p', brand: 'Kronägg', size: '12 st', emoji: '🥚', price: 36.9, unitPrice: '3.08 kr/st', verdict: 'Typical', cheapestChain: { name: 'Hemköp', color: 'oklch(55% 0.14 60)' } },
];

const chainIndex = [
  { name: 'Willys', values: [100, 99, 98, 97, 96, 95], color: 'oklch(50% 0.15 145)' },
  { name: 'ICA', values: [100, 101, 102, 103, 104, 105], color: 'oklch(50% 0.18 25)' },
  { name: 'Lidl', values: [100, 98, 97, 96, 94, 93], color: 'oklch(50% 0.16 250)' },
];

export default function DesignPreview() {
  return (
    <PageShell activeHref="/" sector="groceries">
      <div className="col gap-8" style={{ paddingBottom: 48 }}>
        <header className="col gap-2">
          <span className="eyebrow">Design system · v3 editorial terminal</span>
          <h1 className="page-title">Save on groceries, <em>fuel &amp; pharmacy</em></h1>
          <p className="page-sub">Live Nordic price intelligence — verified prices, plain-language verdicts, and charts anyone can read.</p>
        </header>

        <SavingsBanner
          headline={<>Split-shop your basket across <em>3 stores</em> and save this week.</>}
          detail="Based on your last basket vs the cheapest single store."
          value="−218 kr" valueLabel="weekly savings" />

        <div className="grid grid-4">
          <KPI label="Basket index" value="98.2" sub="↓ 1.8% vs last month" hint="Average price of a standard 40-item basket, indexed to 100 at the start of the year." />
          <KPI label="Cheapest chain" value="Willys" sub="−6% vs market" hint="The chain with the lowest basket cost in your area right now." />
          <KPI label="Deals live" value="1,204" sub="↑ 320 today" hint="Products currently discounted vs their usual price." />
          <KPI label="Coverage" value="4,240" sub="products tracked" hint="How many products we have recent verified prices for." />
        </div>

        <section className="col gap-4">
          <div className="row between center">
            <h2 className="section-title">Top deals</h2>
            <Pill tone="hot">Updated 4 min ago</Pill>
          </div>
          <div className="grid grid-4">
            {products.map((p) => <ProductTile key={p.slug} product={p} href={`/products/${p.slug}`} />)}
          </div>
        </section>

        <section className="grid grid-2 gap-6">
          <Card>
            <div className="row between center" style={{ marginBottom: 12 }}>
              <h3 className="section-title" style={{ fontSize: 20 }}>Milk price · 90 days</h3>
              <ExplainChip hint="The shaded bands show whether today's price is a good deal or expensive compared to the last 90 days.">Bands</ExplainChip>
            </div>
            <PriceChart data={priceHistory} w={520} h={240} currentMark={priceHistory[priceHistory.length - 1].price} title="Milk price over 90 days" />
          </Card>
          <Card>
            <h3 className="section-title" style={{ fontSize: 20, marginBottom: 12 }}>Chain price index · 6 months</h3>
            <MultiLineChart series={chainIndex} w={520} h={240} baseline={100}
              xLabels={[0, 1, 2, 3, 4, 5].map((i) => ({ idx: i, label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i] }))} />
          </Card>
        </section>

        <section className="grid grid-3 gap-6">
          <Card className="col gap-3">
            <h3 className="section-title" style={{ fontSize: 18 }}>Savings by store</h3>
            <BarChart rows={[
              { label: 'Willys', value: 218, bold: true },
              { label: 'Lidl', value: 190 },
              { label: 'ICA', value: 96 },
              { label: 'Hemköp', value: 54 },
            ]} w={300} valueColor="savings" format={(v) => `${v} kr`} />
          </Card>
          <Card className="col gap-3 center">
            <h3 className="section-title" style={{ fontSize: 18 }}>Basket mix</h3>
            <Donut data={[
              { value: 34, color: 'var(--brand)' },
              { value: 26, color: 'var(--up)' },
              { value: 22, color: 'var(--info)' },
              { value: 18, color: 'var(--warn)' },
            ]} />
          </Card>
          <Card className="col gap-4 center">
            <h3 className="section-title" style={{ fontSize: 18 }}>Deal score</h3>
            <Gauge value={82} label="this basket" />
            <ScoreBar value={82} label="Savings opportunity" />
          </Card>
        </section>

        <section className="col gap-3">
          <h2 className="section-title">Atoms</h2>
          <div className="row gap-3 wrap center">
            <Pill>default</Pill><Pill tone="save">good price</Pill><Pill tone="hot">−25%</Pill>
            <Pill tone="brand">verified</Pill><Pill tone="info">new</Pill><Pill tone="warn">low stock</Pill>
            <StoreChip name="Willys" color="oklch(50% 0.15 145)" initials="W" />
            <StoreChip name="ICA" color="oklch(50% 0.18 25)" initials="IC" />
            <ExplainChip hint="Unit price lets you compare value across pack sizes.">unit price</ExplainChip>
            <Sparkline values={[20, 19, 21, 18, 17, 16, 15]} w={120} h={32} />
          </div>
          <div className="row gap-6 wrap">
            <StatRow label="52w low" value="13.90 kr" hint="Lowest price we've seen in the last year." />
            <StatRow label="52w high" value="22.50 kr" hint="Highest price in the last year." />
            <StatRow label="Today" value="14.90 kr" big color="var(--brand)" hint="The best verified price available now." />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
