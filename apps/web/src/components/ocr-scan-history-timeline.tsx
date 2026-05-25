'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchScannerHistory, type ScannerHistoryRow } from '@/lib/scanner-history';

const redactedFallbackRows: ScannerHistoryRow[] = [
  {
    id: 'redacted-receipt-history',
    createdAt: 'Signed-in only',
    kind: 'receipt',
    status: 'redacted fallback',
    redactedSummary: 'Previous receipt OCR rows load after sign-in; anonymous visitors only see this redacted shell.',
    storeName: 'Store redacted',
  },
  {
    id: 'redacted-barcode-history',
    createdAt: 'Signed-in only',
    kind: 'barcode',
    status: 'redacted fallback',
    redactedSummary: 'Barcode scan history stays account-bound and is fetched with the session token.',
    storeName: 'Store redacted',
    productSlug: 'barcode-match',
    compareHref: '/compare?barcode=recent',
    listHref: '/list?add=recent-scan',
    reportHref: '/price-reports?barcode=recent',
  },
];

type LoadState = 'idle' | 'loading' | 'ready' | 'missing-session' | 'error';

export function OcrScanHistoryTimeline() {
  const [rows, setRows] = useState<ScannerHistoryRow[]>(redactedFallbackRows);
  const [state, setState] = useState<LoadState>('idle');

  useEffect(() => {
    const accessToken = sessionStorage.getItem('groceryview:accessToken');
    const userId = sessionStorage.getItem('groceryview:userId');

    if (!accessToken || !userId) {
      setState('missing-session');
      setRows(redactedFallbackRows);
      return;
    }

    const controller = new AbortController();
    setState('loading');

    fetchScannerHistory({ accessToken, userId, signal: controller.signal })
      .then((historyRows) => {
        setRows(historyRows.length > 0 ? historyRows : redactedFallbackRows);
        setState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRows(redactedFallbackRows);
          setState('error');
        }
      });

    return () => controller.abort();
  }, []);

  const statusCopy = state === 'ready'
    ? 'Signed-in OCR history loaded from /api/scans/history.'
    : state === 'loading'
      ? 'Loading account-bound OCR history…'
      : state === 'error'
        ? 'Could not load signed-in OCR history; showing the redacted fallback.'
        : 'Sign in to load account-bound OCR history; anonymous visitors see only redacted rows.';

  return (
    <section className="mt-6 rounded-[2rem] border border-indigo-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">OCR history timeline</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Previous scans after sign-in</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{statusCopy}</p>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-indigo-900">{state}</span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={row.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-black text-slate-950">{row.kind} · {row.status}</p>
              <p className="text-sm font-semibold text-slate-600">{row.createdAt}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{row.redactedSummary}</p>
            <p className="mt-2 text-sm font-semibold text-indigo-900">{row.storeName} {row.itemCount ? `· ${row.itemCount} OCR items` : ''} {row.totalSek ? `· ${row.totalSek} kr` : ''}</p>
            {row.kind === 'barcode' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {row.compareHref ? <Link className="rounded-full bg-indigo-900 px-3 py-2 text-xs font-black text-white" href={row.compareHref}>Quick compare</Link> : null}
                {row.listHref ? <Link className="rounded-full border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-900" href={row.listHref}>Add to list</Link> : null}
                {row.reportHref ? <Link className="rounded-full border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-900" href={row.reportHref}>Report price</Link> : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
