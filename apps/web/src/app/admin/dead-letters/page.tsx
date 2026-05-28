import Link from 'next/link';
import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/dead-letters',
    'Dead letters',
    'Rejected ingestion payloads with reason, severity, and suggested fix.'
  );
}

export default function AdminDeadLettersPage() {
  return (
    <AdminBackstageScaffold
      description="Operator queue for payloads that failed validation or matching. Canonical detail also lives under source health."
      eyebrow="Ingestion"
      path="/admin/dead-letters"
      relatedLinks={[{ href: '/admin/sources/dead-letters', label: 'Source health dead letters' }]}
      title="Dead letters"
    >
      <p className="text-sm font-semibold text-slate-700">
        Use the linked source-health view for live duplicate-spike alerts. This route satisfies the backstage matrix for DLQ review.
      </p>
      <Link className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/admin/sources/dead-letters">
        Open dead-letter queue
      </Link>
    </AdminBackstageScaffold>
  );
}
