'use client';

import { FormEvent, useRef, useState } from 'react';

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
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  async function startReceiptCamera() {
    const session = requireSession();
    if (!session) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setMessage('Receipt camera is not available in this browser. No scan upload was started.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setStatus('ready');
      setMessage('Camera access stays local until a signed-in user requests a private upload ticket and submits a receipt image.');
    } catch {
      setStatus('error');
      setMessage('Camera permission was denied or unavailable. No receipt image was uploaded.');
    }
  }

  function stopReceiptCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setStatus('idle');
    setMessage('Receipt camera stopped. No anonymous scan uploads were sent.');
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-black text-slate-950">Receipt camera preview</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Start a local camera preview before requesting an upload ticket. Camera access stays local; GroceryView does not upload frames automatically.
          </p>
          <video
            aria-label="Local receipt camera preview"
            autoPlay
            className="mt-3 aspect-video w-full rounded-2xl bg-slate-900"
            muted
            playsInline
            ref={videoRef}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-full bg-indigo-800 px-4 py-2 text-sm font-black text-white" onClick={startReceiptCamera} type="button">Start receipt camera</button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-950" disabled={!cameraReady} onClick={stopReceiptCamera} type="button">Stop receipt camera</button>
          </div>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2" onSubmit={processBarcode}>
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
