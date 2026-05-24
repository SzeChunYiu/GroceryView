import { buildSearchAliasRejection, searchAliasRejectionReasons } from '../../../lib/search-alias-review';

const defaultRejection = buildSearchAliasRejection('pending-no-result-alias', 'insufficient_confidence');

export default function SearchAliasesAdminPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin review</p>
        <h1 className="text-3xl font-bold text-slate-950">Search alias review</h1>
        <p className="text-slate-700">
          Rejected no-result aliases now require structured feedback before they are sent back to improve
          search matching.
        </p>
      </section>

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <legend className="text-lg font-semibold text-slate-950">Rejection reason options</legend>
        {searchAliasRejectionReasons.map((reason) => (
          <label key={reason.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
            <input
              defaultChecked={reason.id === defaultRejection.rejectionReason}
              name="rejectionReason"
              type="radio"
              value={reason.id}
            />
            <span className="font-medium text-slate-950">{reason.label}</span>
          </label>
        ))}
      </fieldset>
    </main>
  );
}
