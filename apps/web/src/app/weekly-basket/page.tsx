import { NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';

const route = 'weekly-basket';

export default function WeeklyBasketPage() {
  return (
    <PageShell>
      <NoVerifiedData route={route} title="Weekly basket still has no private production records in this static snapshot" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
