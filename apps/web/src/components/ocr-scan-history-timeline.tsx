'use client';

import { useMemo, useState } from 'react';
import { correctionStatusFilterChips, countOcrScanHistoryByCorrectionStatus, filterOcrScanHistoryByCorrectionStatus, premiumOcrScanHistory, type OcrCorrectionStatus, type OcrScanHistoryItem } from '@/lib/scanner-history';

type OcrScanHistoryTimelineProps = {
  scans?: OcrScanHistoryItem[];
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatScanDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function statusLabel(status: OcrCorrectionStatus) {
  return correctionStatusFilterChips.find((chip) => chip.status === status)?.label ?? status.replaceAll('_', ' ');
}

export function OcrScanHistoryTimeline({ scans = premiumOcrScanHistory }: OcrScanHistoryTimelineProps) {
  const [activeStatus, setActiveStatus] = useState<OcrCorrectionStatus | 'all'>('all');
  const counts = useMemo(() => countOcrScanHistoryByCorrectionStatus(scans), [scans]);
  const visibleScans = useMemo(() => filterOcrScanHistoryByCorrectionStatus(scans, activeStatus), [activeStatus, scans]);

  return (
    <section aria-labelledby="ocr-history-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Premium OCR scan history</p>
          <h2 id="ocr-history-heading" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Correction-status timeline</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700">Filter previous receipt scans by corrections pending, corrected, or export ready status so large histories surface the work that needs attention first.</p>
        </div>
        <p aria-live="polite" className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-950">{visibleScans.length} shown</p>
      </div>

      <div aria-label="Filter OCR scan history by correction status" className="mt-4 flex flex-wrap gap-2" role="list">
        {correctionStatusFilterChips.map((chip) => (
          <button aria-label={`${chip.label}: ${chip.description}`} aria-pressed={activeStatus === chip.status} className={`rounded-full border px-4 py-2 text-sm font-black transition ${activeStatus === chip.status ? 'border-indigo-800 bg-indigo-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-500'}`} key={chip.status} onClick={() => setActiveStatus(chip.status)} type="button">
            {chip.label} <span className="ml-1 text-xs">{counts[chip.status]}</span>
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-3">
        {visibleScans.map((scan) => (
          <li className="rounded-2xl border border-slate-200 p-4" key={scan.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-950">{scan.merchantName}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{formatScanDate(scan.scannedAt)} · {scan.lineItemCount} OCR line items</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase text-indigo-950">{statusLabel(scan.correctionStatus)}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Receipt total {formatSek(scan.totalSek)} · status {scan.correctionStatus.replaceAll('_', ' ')}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
