import { NoVerifiedData, PageShell, SourceCoverage } from '@/components/data-ui';

export default function AccountProfilePage() {
  return (
    <PageShell>
      <NoVerifiedData title="Account profile is intentionally empty until authenticated records are available" />
      <div className="mt-6"><SourceCoverage /></div>
    </PageShell>
  );
}
