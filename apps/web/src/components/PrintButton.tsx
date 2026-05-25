'use client';

export function PrintButton() {
  return (
    <button
      className="print:hidden inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
      onClick={() => window.print()}
      type="button"
    >
      Print A4 list
    </button>
  );
}
