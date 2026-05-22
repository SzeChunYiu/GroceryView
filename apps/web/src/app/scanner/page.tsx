import { NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/scanner');
}

export const dynamic = 'force-static';

const route = 'scanner';

export default function ScannerPage() {
  return (
    <PageShell>
      <NoVerifiedData route={route} title="Receipt scanner has no production uploads in this static snapshot" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
