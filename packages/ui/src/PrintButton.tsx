'use client';

type PrintButtonProps = {
  fileName?: string;
  label?: string;
};

export function PrintButton({ fileName, label = 'Print A4 list' }: PrintButtonProps) {
  function handlePrint() {
    const previousTitle = document.title;
    if (fileName) document.title = fileName.replace(/\.pdf$/i, '');
    window.print();
    if (fileName) document.title = previousTitle;
  }

  return (
    <button
      className="print:hidden inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900"
      onClick={handlePrint}
      type="button"
    >
      {label}
    </button>
  );
}
