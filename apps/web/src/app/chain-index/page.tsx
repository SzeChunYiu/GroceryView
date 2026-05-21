import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { categorySummaries, formatPct, formatSek, matchedChainProducts } from '@/lib/verified-data';

export default function ChainIndexPage() {
  const willysWins = matchedChainProducts.filter((product) => product.lowestChain === 'willys').length;
  const hemkopWins = matchedChainProducts.filter((product) => product.lowestChain === 'hemkop').length;
  const averageSpread = matchedChainProducts.reduce((sum, product) => sum + product.spreadPct, 0) / matchedChainProducts.length;
  return (
    <PageShell>
      <Eyebrow>Chain index</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Willys/Hemköp matched-product index</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">The index is computed only from products with the same Axfood code in both chain catalogues. It does not mix unmatched SKUs or branch-location data.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm font-black text-slate-600">Matched products</p><p className="mt-2 text-4xl font-black text-emerald-800">{matchedChainProducts.length}</p></Card>
        <Card><p className="text-sm font-black text-slate-600">Average spread</p><p className="mt-2 text-4xl font-black text-emerald-800">{formatPct(averageSpread)}</p></Card>
        <Card><p className="text-sm font-black text-slate-600">Lowest-price wins</p><p className="mt-2 text-xl font-black text-slate-950">Willys {willysWins} · Hemköp {hemkopWins}</p></Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card><h2 className="text-2xl font-black">Category spread coverage</h2><div className="mt-4 space-y-3">{categorySummaries.slice(0, 12).map((category) => <Link className="grid grid-cols-[1fr_auto] rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/categories/${category.slug}`} key={category.slug}><span><strong>{category.label}</strong><br /><span className="text-sm text-slate-600">{category.chainRows} Axfood rows</span></span><span className="font-black text-emerald-800">{formatPct(category.strongestSpread)}</span></Link>)}</div></Card>
        <Card><h2 className="text-2xl font-black">Largest matched spreads</h2><div className="mt-4 space-y-3">{matchedChainProducts.slice(0, 12).map((product) => <Link className="grid grid-cols-[1fr_auto] rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><span><strong>{product.name}</strong><br /><span className="text-sm text-slate-600">Lowest {product.lowestChain}: {formatSek(product.lowestPrice)}</span></span><span className="font-black text-emerald-800">{formatPct(product.spreadPct)}</span></Link>)}</div></Card>
      </div>
      <div className="mt-6"><SourceCoverage /></div>
    </PageShell>
  );
}
