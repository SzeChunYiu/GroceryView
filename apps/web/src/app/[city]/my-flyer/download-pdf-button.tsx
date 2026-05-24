'use client';

import { useCallback, useState } from 'react';

type DownloadPdfButtonProps = Readonly<{
  city: string;
}>;

export function DownloadPdfButton({ city }: DownloadPdfButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownload = useCallback(() => {
    setIsPrinting(true);
    const reset = window.setTimeout(() => setIsPrinting(false), 1200);
    window.print();
    window.setTimeout(() => window.clearTimeout(reset), 1300);
  }, []);

  const pdfHref = `/api/my-flyer/pdf?city=${encodeURIComponent(city)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        aria-label="Download MyFlyer as PDF using the browser print dialog"
        className="rounded-full bg-slate-950 px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-white disabled:cursor-wait disabled:opacity-70"
        disabled={isPrinting}
        onClick={handleDownload}
        type="button"
      >
        {isPrinting ? 'Opening PDF…' : 'Download PDF'}
      </button>
      <a
        className="rounded-full border border-slate-950 px-5 py-2 text-sm font-black uppercase tracking-[0.14em] text-slate-950"
        href={pdfHref}
        rel="nofollow"
      >
        Server PDF
      </a>
    </div>
  );
}
