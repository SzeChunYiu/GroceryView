import Image from 'next/image';
import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ProductPriceCards } from '@/components/product-price-cards';
import { adaptiveProductCards, facetedProductSearch, formatSek, immigrantFamiliarBrandSearch, immigrantImageFirstBrowsing, openFoodFactsCatalogPreview, openFoodFactsCatalogSummary, topChainSpreads, freshestOpenPrices } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { seoLandingProducts } from '@/lib/seo-landing-pages';

export function generateMetadata() {
  return routeMetadata('/products');
}

export default function ProductsPage() {
  const { categoryFacets, labelFacets, chainFacets, priceRange, inStockOnly, resultCards } = facetedProductSearch;

  return (
    <PageShell>
      <Eyebrow>Products</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified product catalogue</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Products are shown only when present in the Axfood chain snapshot or OpenPrices SEK observations. No synthetic prices or filler products are rendered.</p>
      <Card className="mt-8 border-violet-200 bg-violet-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-800">Product search</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Instant faceted search</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              This preview calls buildFacetedProductSearch over facetedSearchRows generated from real product, latest_prices, chains, and stores-shaped Axfood rows.
              Shoppers can narrow by category, label/dietary evidence, kr/kg or kr/l range, chain, and the inStockOnly priced-row gate without synthetic product or price filler.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-950 shadow-sm">
            {inStockOnly.productCount.toLocaleString('sv-SE')} priced products · {inStockOnly.latestPriceCount.toLocaleString('sv-SE')} latest_prices rows
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Category facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryFacets.map((facet) => (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-900" key={facet.value}>{facet.value} · {facet.count}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Label / dietary facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {labelFacets.map((facet) => (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900" key={facet.value}>{facet.label} · {facet.count}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Chain facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chainFacets.map((facet) => (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-900" key={facet.value}>{facet.label} · {facet.count}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Price range + stock</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{formatSek(priceRange.min)} – {formatSek(priceRange.max)}</p>
            <p className="mt-2 text-xs font-bold text-slate-600">Comparable unit filters cover kr/kg, kr/l, and per-unit rows. {inStockOnly.label} keeps unpriced catalog rows out of instant results.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {resultCards.map((product) => (
            <Link className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
              <div className="flex gap-3">
                {product.imageUrl ? (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
                    <Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
                  </div>
                ) : null}
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
                <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
                <p>{product.chainLabel}</p>
                <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-8 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">SEO landing pages</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Crawlable cheapest-price and prisjämförelse pages</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Landing pages are generated only from verified matched chain spreads. Each page links back to the product ticker and compare surface, and every claim keeps a no-synthetic-price caveat.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900 shadow-sm">{seoLandingProducts.length} verified landing products</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {seoLandingProducts.slice(0, 6).map((landing) => (
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm" key={landing.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{landing.cheapestChainLabel} lowest · {landing.spreadPctLabel} spread</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{landing.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{landing.cheapestPriceLabel} · {landing.evidenceLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <Link className="rounded-full bg-indigo-700 px-3 py-2 text-white" href={`/billigaste/${landing.slug}`}>Billigaste page</Link>
                <Link className="rounded-full bg-slate-950 px-3 py-2 text-white" href={`/prisjamforelse/${landing.slug}`}>Prisjämförelse</Link>
                <Link className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200" href={`/stockholm/billigaste/${landing.slug}`}>Stockholm</Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-8 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">OpenFoodFacts metadata catalog</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Swedish product metadata-only catalog</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              OpenFoodFacts rows widen the browseable product dimension with names, brands, package sizes, category tags, labels, and images.
              No synthetic prices are shown here; GroceryView still requires Axfood, OpenPrices, or retailer observations before a price appears.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-950 shadow-sm">
            {openFoodFactsCatalogSummary.products.toLocaleString('sv-SE')} metadata-only products · {openFoodFactsCatalogSummary.brands.toLocaleString('sv-SE')} brands
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {openFoodFactsCatalogPreview.map((product) => (
            <a className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={product.productUrl} key={product.code}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{product.brands || 'Brand not reported'}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{product.quantity || 'Quantity not reported'} · {product.nutriscoreGrade}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">{product.categories.slice(0, 3).join(' · ') || 'Category tags not reported'}</p>
              <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">metadata-only · No synthetic prices</p>
            </a>
          ))}
        </div>
      </Card>

      <Card className="mt-8 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Immigrant / familiar products</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Familiar-brand search</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Find reported brands exactly as they appear in verified product rows, then jump to the product page.
              Search tokens combine reportedBrand, product name, and category so non-native speakers can match familiar packaging without invented translations.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900 shadow-sm">{immigrantFamiliarBrandSearch.length} verified brand entries</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {immigrantFamiliarBrandSearch.map((brand) => (
            <Link className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-700" href={`/products/${brand.verifiedProductSlug}`} key={`${brand.reportedBrand}-${brand.verifiedProductSlug}`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{brand.reportedBrand}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{brand.productName}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{brand.categoryLabel}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">searchTokens: {brand.searchTokens}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>{formatSek(brand.verifiedPrice)}</span>
                <span>{brand.evidenceLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">Visual grocery discovery</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Image-first browsing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              New shoppers can scan verified package photos first, then open the exact product page.
              Every imageUrl comes from Axfood or OpenPrices product rows; missing images are excluded instead of replaced with fake packaging.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900 shadow-sm">{immigrantImageFirstBrowsing.length} verified images</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {immigrantImageFirstBrowsing.map((item) => (
            <Link className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-700" href={`/products/${item.verifiedProductSlug}`} key={item.verifiedProductSlug}>
              <div className="flex aspect-square items-center justify-center bg-white p-3">
                <Image alt={item.visualAlt} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={160} sizes="(min-width: 768px) 20vw, 50vw" src={item.imageUrl} width={160} />
              </div>
              <div className="border-t border-amber-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{item.reportedBrand}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{item.productName}</h3>
                <p className="mt-1 text-[0.7rem] font-semibold text-slate-500">{item.categoryLabel}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[0.7rem] font-black text-slate-700">
                  <span>{formatSek(item.verifiedPrice)}</span>
                  <span>{item.evidenceLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <div className="mt-6">
        <ProductPriceCards
          cards={adaptiveProductCards}
          eyebrow="Product-card display"
          title="Adaptive total ⇄ per-unit price cards"
          intro="Branded products lead with the actual pack price, commodity-like produce leads with comparable unit price, and the toggle flips the sort key across every card."
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain matches rendered</h2><p className="mt-2 text-slate-600">{topChainSpreads.length} high-spread matched rows are highlighted from the generated Axfood module.</p></Card>
        <Card><h2 className="text-2xl font-black">Fresh OpenPrices rows</h2><p className="mt-2 text-slate-600">{freshestOpenPrices.length} recent community SEK observations are included with their observation dates.</p></Card>
      </div>
    </PageShell>
  );
}
