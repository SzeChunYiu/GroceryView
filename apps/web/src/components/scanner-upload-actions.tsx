'use client';

import { FormEvent, useState } from 'react';

type ScannerStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function newScanId(prefix: 'receipt' | 'barcode') {
  return `${prefix}-${Date.now()}`;
}

export function ScannerUploadActions() {
  const [barcode, setBarcode] = useState('0735000123456');
  const [byteLength, setByteLength] = useState('123456');
  const [contentType, setContentType] = useState('image/jpeg');
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [message, setMessage] = useState('No anonymous scan uploads. Sign in first to request private upload tickets or process barcode scans.');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous scan uploads are sent to protected scanner endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function handleResponse(response: Response, successMessage: string) {
    if (!response.ok) {
      setStatus('error');
      setMessage('Scanner request was rejected by the production API.');
      return;
    }
    setStatus('ready');
    setMessage(successMessage);
  }

  async function requestReceiptUploadTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const scanId = newScanId('receipt');
    const response = await fetch(`/api/scans/upload-url?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ scanId, kind: 'receipt', contentType, byteLength: Number(byteLength) })
    });
    await handleResponse(response, `Private upload ticket requested for ${scanId}.`);
  }

  async function processBarcode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const scanId = newScanId('barcode');
    const response = await fetch(`/api/scans/process?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ scanId, kind: 'barcode', payload: barcode })
    });
    await handleResponse(response, `Barcode processed for ${scanId}; review work items are returned when matching needs human review.`);
  }

  return (
    <section className="mt-6 rounded-3xl border border-indigo-200 bg-white p-5 shadow-sm" aria-label="Scanner upload controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Signed-in scan actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Receipt upload tickets and barcode processing</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls use the sessionStorage token from the production session exchange. Receipt uploads first request a private upload ticket, while barcode scans go directly to provider-backed processing and return review work items when evidence is uncertain.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={requestReceiptUploadTicket}>
          <label className="text-sm font-black text-slate-950" htmlFor="receipt-content-type">Receipt content type</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="receipt-content-type"
            onChange={(event) => setContentType(event.target.value)}
            value={contentType}
          />
          <label className="mt-3 block text-sm font-black text-slate-950" htmlFor="receipt-byte-length">Estimated byteLength</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="receipt-byte-length"
            min="1"
            onChange={(event) => setByteLength(event.target.value)}
            type="number"
            value={byteLength}
          />
          <button className="mt-3 rounded-full bg-indigo-800 px-4 py-2 text-sm font-black text-white" disabled={!contentType.trim() || Number(byteLength) <= 0} type="submit">Request private upload ticket</button>
        </form>

        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4" onSubmit={processBarcode}>
          <label className="text-sm font-black text-slate-950" htmlFor="barcode-payload">Barcode payload</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="barcode-payload"
            onChange={(event) => setBarcode(event.target.value)}
            value={barcode}
          />
          <button className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" disabled={!barcode.trim()} type="submit">Process barcode scan</button>
        </form>
      </div>
      <p className="mt-4 rounded-2xl bg-indigo-50 p-3 text-sm font-bold text-indigo-950" data-status={status}>{message}</p>
    </section>
  );
}
