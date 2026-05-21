import { NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';

export const dynamic = 'force-static';

export default function AccountProfilePage() {
  return (
    <PageShell>
      <NoVerifiedData route="account-profile" title="Account profile has no authenticated production record in this static snapshot" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
