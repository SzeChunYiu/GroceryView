import { Camera, CheckCircle2, CircleAlert, ScanLine } from "lucide-react";
import { scannerQueue } from "@/components/sample-data";

export default function ScannerPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Scanner</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Receipt and barcode desk</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <ScannerStat icon={Camera} label="Captured" value="18" />
            <ScannerStat icon={CheckCircle2} label="Matched" value="15" />
            <ScannerStat icon={CircleAlert} label="Review" value="3" />
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
          <ScanLine className="h-7 w-7 text-emerald-300" aria-hidden="true" />
          <div className="mt-8 aspect-[4/3] rounded-lg border border-dashed border-white/30 bg-white/5" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950" type="button">
              Receipt
            </button>
            <button className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white" type="button">
              Barcode
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {scannerQueue.map((row) => (
          <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_0.7fr_0.5fr_0.5fr]" key={row.item}>
            <div>
              <p className="font-semibold text-zinc-950">{row.item}</p>
              <p className="text-sm text-zinc-500">Owner: {row.owner}</p>
            </div>
            <p className="font-medium text-zinc-700">{row.status}</p>
            <p className="tabular-nums text-zinc-700">{row.confidence}%</p>
            <button className="w-fit rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800" type="button">
              Review
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function ScannerStat({ icon: Icon, label, value }: { icon: typeof Camera; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-3 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
