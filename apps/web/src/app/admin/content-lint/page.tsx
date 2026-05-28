import { AdminBackstageScaffold, adminBackstageMetadata } from '@/lib/admin-backstage-scaffold';

const BLOCKED_PUBLIC_PHRASES = [
  'Server-side cursor pagination',
  'raw_record_id',
  'source_run_id',
  'COPY staging',
  'pgbouncer'
];

export function generateMetadata() {
  return adminBackstageMetadata(
    '/admin/content-lint',
    'Content lint',
    'Blocked backstage phrases on public routes — enforced by content-copy-audit.test.mjs.'
  );
}

export default function AdminContentLintPage() {
  return (
    <AdminBackstageScaffold
      description="CI scans public App Router sources for operator-only jargon. Failures must be fixed or moved to /admin or /data-sources."
      eyebrow="Content"
      path="/admin/content-lint"
      title="Content lint rules"
    >
      <ul className="list-disc space-y-2 pl-5 text-sm font-semibold text-slate-700">
        {BLOCKED_PUBLIC_PHRASES.map((phrase) => (
          <li key={phrase}>
            <code className="rounded bg-slate-100 px-1">{phrase}</code>
          </li>
        ))}
      </ul>
    </AdminBackstageScaffold>
  );
}
