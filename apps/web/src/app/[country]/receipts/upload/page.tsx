'use client';

import { ChangeEvent, FormEvent, use, useState } from 'react';

type UploadState = 'idle' | 'blocked' | 'uploading' | 'processing' | 'ready' | 'error';
type Session = { accessToken: string; userId: string };

type ProcessResponse = {
  scanId: string;
  result: {
    status: string;
    totalAmount?: number;
    confidence?: number;
    lowConfidenceRows?: string[];
    reason?: string;
  };
  reviewWorkItems: Array<{ id: string; reason: string; evidence: string[] }>;
};

function readSession(): Session | null {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return accessToken && userId ? { accessToken, userId } : null;
}

function newReceiptScanId(country: string) {
  return `receipt-${country.toLowerCase()}-${Date.now()}`;
}

export default function ReceiptUploadPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country: countryParam } = use(params);
  const country = countryParam.toUpperCase();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadState>('idle');
  const [message, setMessage] = useState('Choose a grocery receipt photo. Uploads require an authenticated GroceryView session.');
  const [result, setResult] = useState<ProcessResponse | null>(null);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setStatus('idle');
    setMessage(event.target.files?.[0]
      ? 'Receipt photo selected. Submit to run OCR and append matched rows to purchase history.'
      : 'Choose a grocery receipt photo.');
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = readSession();
    if (!session) {
      setStatus('blocked');
      setMessage('Sign in first. Receipt OCR and purchase_history updates are account-bound.');
      return;
    }
    if (!file) {
      setStatus('error');
      setMessage('Select a receipt image before submitting.');
      return;
    }

    const scanId = newReceiptScanId(country);
    setStatus('uploading');
    setMessage(`Requesting private upload ticket for ${scanId}.`);

    const ticketResponse = await fetch(`/api/scans/upload-url?userId=${encodeURIComponent(session.userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ scanId, kind: 'receipt', contentType: file.type || 'image/jpeg', byteLength: file.size })
    });
    if (!ticketResponse.ok) {
      setStatus('error');
      setMessage('Upload ticket request failed; no receipt image was stored.');
      return;
    }

    const ticketBody = await ticketResponse.json() as {
      result: { status: 'ready'; ticket: { uploadUrl: string; payloadUri: string; headers: Record<string, string> } } | { status: 'failed_no_storage'; reason: string };
    };
    if (ticketBody.result.status !== 'ready') {
      setStatus('blocked');
      setMessage(ticketBody.result.reason);
      return;
    }

    const upload = await fetch(ticketBody.result.ticket.uploadUrl, {
      method: 'PUT',
      headers: ticketBody.result.ticket.headers,
      body: file
    });
    if (!upload.ok) {
      setStatus('error');
      setMessage('Receipt image upload failed; OCR was not started.');
      return;
    }

    setStatus('processing');
    setMessage('Receipt uploaded. Running OCR, line matching, and purchase_history append.');
    const processResponse = await fetch(`/api/scans/process?userId=${encodeURIComponent(session.userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ scanId, kind: 'receipt', payload: ticketBody.result.ticket.payloadUri, uploadedAt: new Date().toISOString() })
    });
    if (!processResponse.ok) {
      setStatus('error');
      setMessage('OCR processing failed. No purchase_history rows were appended.');
      return;
    }

    const parsed = await processResponse.json() as ProcessResponse;
    setResult(parsed);
    setStatus('ready');
    setMessage(parsed.result.status === 'parsed'
      ? 'OCR completed. Matched receipt lines are appended to user.purchase_history; low-confidence rows stay in review.'
      : parsed.result.reason ?? 'Receipt processing completed.');
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">{country} receipt scanner</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight">Upload a grocery receipt</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
        Receipt photos are uploaded through a private scan ticket, OCR extracts chain, store, date, line items and prices, and matched rows are written to <code className="rounded bg-slate-100 px-1 py-0.5">user.purchase_history</code>. Unmatched rows remain review work items.
      </p>

      <form className="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm" onSubmit={submitReceipt}>
        <label className="block text-sm font-black text-slate-950" htmlFor="receipt-photo">Receipt photo</label>
        <input
          accept="image/*"
          className="mt-3 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
          id="receipt-photo"
          onChange={onFileChange}
          type="file"
        />
        <button className="mt-5 rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-slate-300" disabled={!file || status === 'uploading' || status === 'processing'} type="submit">
          Upload and scan receipt
        </button>
        <p aria-live="polite" className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-950" data-status={status}>{message}</p>
      </form>

      {result ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">OCR result</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Status</p>
              <p className="mt-2 text-xl font-black">{result.result.status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Total</p>
              <p className="mt-2 text-xl font-black">{result.result.totalAmount ?? '—'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Review items</p>
              <p className="mt-2 text-xl font-black">{result.reviewWorkItems.length}</p>
            </div>
          </div>
          {result.result.lowConfidenceRows && result.result.lowConfidenceRows.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-black text-amber-950">Low-confidence OCR rows</p>
              <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-amber-950">
                {result.result.lowConfidenceRows.map((row) => <li key={row}>{row}</li>)}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
