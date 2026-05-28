import Link from 'next/link';
import { Card, Eyebrow } from './data-ui';
import { featurePlacementRoadmap } from '@/lib/verified-data';

type FeaturePlacementMapProps = {
  compact?: boolean;
  focus?: 'home' | 'products' | 'deals' | 'basket' | 'stores' | 'account';
};

const focusTitles = {
  home: 'What belongs where',
  products: 'Product intelligence placements',
  deals: 'Deal decision placements',
  basket: 'Basket planning placements',
  stores: 'Store and map placements',
  account: 'Personal workflow placements'
} as const;

export function FeaturePlacementMap({ compact = false, focus = 'home' }: FeaturePlacementMapProps) {
  const placements = featurePlacementRoadmap
    .filter((item) => focus === 'home' || item.pageCluster === focus)
    .slice(0, compact ? 6 : featurePlacementRoadmap.length);

  return (
    <Card className="gv-feature-map border-emerald-900/10 bg-[#101f1a] text-white shadow-2xl shadow-emerald-950/15">
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <div>
          <Eyebrow>{compact ? 'Frontend coverage' : 'Figma-ready feature map'}</Eyebrow>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-white">
            {focusTitles[focus]}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50/80">
            Planned features are assigned to the page where they improve the shopper decision, with fail-closed copy until real data and account state exist.
          </p>
          <Link className="mt-5 inline-flex rounded-full bg-lime-300 px-5 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-lime-950/20" href="/feature-roadmap">
            Open placement roadmap
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {placements.map((item) => (
            <Link className="group rounded-[1.4rem] border border-white/10 bg-white/[0.08] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.13]" href={item.targetRoute} key={item.feature}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-lime-100">{item.pageLabel}</span>
                <span className="rounded-full bg-lime-300/15 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] text-lime-100">{item.status}</span>
              </div>
              <h3 className="mt-3 text-lg font-black tracking-tight text-white">{item.feature}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50/75">{item.reason}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-lime-200 group-hover:text-lime-100">{item.nextFrontendStep}</p>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
