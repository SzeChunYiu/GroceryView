const reviewFields = [
  'sourceRunId',
  'connectorId',
  'parserVersion',
  'errorClass',
  'retryable',
  'samplePayloadPointer',
  'samplePayloadHash'
];

export default function AdminSourceDeadLettersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Source reliability</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">Ingestion dead-letter review</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Parser failures are persisted as raw_records with record_type parser_failure so malformed products can be inspected and replayed without blocking the rest of a connector run.
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Dead-letter replay workflow">
        <h2 className="text-xl font-bold text-slate-950">Replay path</h2>
        <ol className="mt-4 grid gap-3 text-sm font-semibold text-slate-700">
          <li>1. Filter by sourceRunId and samplePayloadPointer from the raw record provenance.</li>
          <li>2. Inspect errorClass, parserVersion, retryable, and the stored sample payload pointer.</li>
          <li>3. Patch the parser or source mapping, then replay the rawSnapshotRef through the same connector parserVersion.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-label="Required dead-letter fields">
        <h2 className="text-lg font-bold text-slate-950">Required review fields</h2>
        <ul className="mt-4 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
          {reviewFields.map((field) => <li key={field}>{field}</li>)}
        </ul>
      </section>
    </main>
  );
}
