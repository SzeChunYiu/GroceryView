export function ItemListSkeleton() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="mt-4 h-10 w-3/4 rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-slate-100" />
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading item list">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm" key={index}>
            <div className="h-5 w-2/3 rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-100" />
            <div className="mt-6 h-16 rounded-2xl bg-slate-100" />
          </div>
        ))}
      </section>
    </main>
  );
}
