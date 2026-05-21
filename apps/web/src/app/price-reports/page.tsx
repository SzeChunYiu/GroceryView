import Link from 'next/link';
import { ClipboardCheck, FileText, Gauge, Send } from 'lucide-react';
import { priceReportCenter } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function PriceReportsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/savings-dashboard">Savings</Link>
          <Link href="/meal-planner">Meals</Link>
          <Link href="/categories/pantry">Pantry</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Price reports</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            {priceReportCenter.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">{priceReportCenter.headline}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<FileText size={20} />} label="Reports" value={String(priceReportCenter.reports.length)} />
          <Metric icon={<Send size={20} />} label="Ready" value={String(priceReportCenter.readyCount)} />
          <Metric icon={<Gauge size={20} />} label="Review" value={String(priceReportCenter.reviewCount)} />
          <Metric icon={<ClipboardCheck size={20} />} label="Freshness" value={priceReportCenter.freshnessWindow} />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">{priceReportCenter.checklistTitle}</h2>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {priceReportCenter.checklist.map((item) => (
            <div key={item.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="block text-xs font-bold uppercase text-market-ink/50">{item.label}</span>
              <span className="mt-2 block leading-6 text-market-ink/65">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Report</span>
          <span>Status</span>
          <span className="text-right">Confidence</span>
        </div>
        {priceReportCenter.reports.map((report) => (
          <Link
            key={report.title}
            href={report.href}
            className="grid gap-3 border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0 hover:bg-market-oat/45 md:grid-cols-[1fr_auto_auto]"
          >
            <span>
              <span className="block font-black">{report.title}</span>
              <span className="mt-1 block text-market-ink/60">
                {report.owner} · {report.audience} · {report.source}
              </span>
              <span className="mt-2 block font-black text-market-mint">{report.metric}</span>
            </span>
            <span className="font-black uppercase text-market-ink/65">{report.status}</span>
            <span className="text-right font-black tabular-nums">{report.confidence}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-market-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-market-mint">
        {icon}
        <span className="text-xs font-bold uppercase text-market-ink/45">{label}</span>
      </div>
      <strong className="mt-4 block text-2xl font-black">{value}</strong>
    </div>
  );
}
