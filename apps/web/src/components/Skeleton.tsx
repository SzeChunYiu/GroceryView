function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

export function HomeLaunchSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="GroceryView laddar"
      className="min-h-screen bg-[#f5f1e8] px-4 py-5 text-slate-950 sm:px-6 lg:px-8"
    >
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-emerald-950">
              GV
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">GroceryView</p>
              <p className="text-sm font-bold text-slate-300">Verified grocery intelligence</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <SkeletonBlock className="h-12 max-w-3xl bg-white/20 md:h-16" />
            <SkeletonBlock className="h-12 max-w-2xl bg-white/20 md:h-14" />
            <SkeletonBlock className="h-4 max-w-xl bg-white/15" />
            <SkeletonBlock className="h-4 max-w-lg bg-white/15" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <SkeletonBlock className="h-12 w-44 rounded-full bg-emerald-300/80" />
            <SkeletonBlock className="h-12 w-36 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <SkeletonBlock className="h-4 w-36 bg-emerald-100" />
          <SkeletonBlock className="mt-4 h-9 max-w-sm" />
          <SkeletonBlock className="mt-4 h-4 max-w-md" />
          <div className="mt-8 grid gap-3">
            {[0, 1, 2].map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item}>
                <SkeletonBlock className="h-5 w-2/3" />
                <SkeletonBlock className="mt-3 h-4 w-5/6" />
                <SkeletonBlock className="mt-3 h-5 w-28 bg-emerald-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={item}>
            <SkeletonBlock className="h-4 w-24 bg-emerald-100" />
            <SkeletonBlock className="mt-4 h-8 w-32" />
            <SkeletonBlock className="mt-3 h-4 w-full" />
          </div>
        ))}
      </section>
    </main>
  );
}
