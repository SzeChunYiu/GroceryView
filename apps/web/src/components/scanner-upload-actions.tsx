'use client';

import { FormEvent, useRef, useState } from 'react';
import type { BarcodeMissFallbackProduct } from '@/lib/openfoodfacts-catalog';

type ScannerStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type ScanUploadTicket = {
  scanId: string;
  uploadUrl: string;
  payloadUri: string;
  headers: Record<string, string>;
};

type ScanUploadTicketResponse =
  | { result: { status: 'ready'; ticket: ScanUploadTicket } }
  | { result: { status: 'failed_no_storage'; reason: string } };

type ReceiptPurchaseHistoryItem = {
  productId: string;
  name: string;
  quantity?: number;
  totalAmount?: number;
};

type ScanProcessResponse = {
  result?: {
    status: string;
    kind: 'receipt' | 'barcode';
    productId?: string | null;
    totalAmount?: number;
    confidence?: number;
  };
  purchaseHistory?: ReceiptPurchaseHistoryItem[];
};

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function newScanId(prefix: 'receipt' | 'barcode') {
  return `${prefix}-${Date.now()}`;
}

export function ScannerUploadActions({ fallbackProducts = [] }: Readonly<{ fallbackProducts?: BarcodeMissFallbackProduct[] }>) {
  const [barcode, setBarcode] = useState('0735000123456');
  const [byteLength, setByteLength] = useState('123456');
  const [contentType, setContentType] = useState('image/jpeg');
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [message, setMessage] = useState('No anonymous scan uploads. Sign in first to request private upload tickets or process barcode scans.');
  const [cameraReady, setCameraReady] = useState(false);
  const [barcodeFallbackActive, setBarcodeFallbackActive] = useState(false);
  const [manualProductName, setManualProductName] = useState('');
  const [manualStoreHint, setManualStoreHint] = useState('');
  const [receiptHistory, setReceiptHistory] = useState<ReceiptPurchaseHistoryItem[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const normalizedBarcode = barcode.replace(/\D/g, '');

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

  function captureReceiptFrame(contentTypeHint: string): Promise<Blob | null> {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return Promise.resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return Promise.resolve(null);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), contentTypeHint, 0.92);
    });
  }

  async function submitReceiptImage() {
    const session = requireSession();
    if (!session) return;
    if (!cameraReady) {
      setStatus('error');
      setMessage('Start the receipt camera before submitting a receipt image. No upload was sent.');
      return;
    }

    const captureContentType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
    const blob = await captureReceiptFrame(captureContentType);
    if (!blob) {
      setStatus('error');
      setMessage('Receipt frame could not be captured. No upload ticket was requested.');
      return;
    }

    const { accessToken, userId } = session;
    const scanId = newScanId('receipt');
    const ticketResponse = await fetch(`/api/scans/upload-url?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ scanId, kind: 'receipt', contentType: blob.type || captureContentType, byteLength: blob.size })
    });
    if (!ticketResponse.ok) {
      setStatus('error');
      setMessage('Receipt upload ticket was rejected by the production API.');
      return;
    }

    const ticketBody = (await ticketResponse.json()) as ScanUploadTicketResponse;
    if (ticketBody.result.status !== 'ready') {
      setStatus('error');
      setMessage(`Receipt upload is blocked: ${ticketBody.result.reason}`);
      return;
    }

    const ticket = ticketBody.result.ticket;
    const uploadResponse = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      headers: ticket.headers,
      body: blob
    });
    if (!uploadResponse.ok) {
      setStatus('error');
      setMessage('Receipt image upload failed. Scan processing was not started.');
      return;
    }

    const processResponse = await fetch(`/api/scans/process?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ scanId, kind: 'receipt', payload: ticket.payloadUri, uploadedAt: new Date().toISOString() })
    });
    if (!processResponse.ok) {
      setStatus('error');
      setMessage('Scanner request was rejected by the production API.');
      return;
    }
    const processBody = (await processResponse.json()) as ScanProcessResponse;
    setReceiptHistory(processBody.purchaseHistory ?? []);
    setStatus('ready');
    setMessage(`Receipt image submitted for ${scanId}; OCR parsed the receipt and matched canonical products for purchase history.`);
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
    if (!response.ok) {
      setBarcodeFallbackActive(true);
      setStatus('error');
      setMessage(`Barcode lookup missed for ${normalizedBarcode || barcode}. Review likely products, enter the product manually, or report it so catalogue coverage can improve.`);
      return;
    }

    const body = (await response.json().catch(() => null)) as ScanProcessResponse | null;
    const result = body?.result;
    if (result?.kind === 'barcode' && (result.status === 'failed_no_provider' || result.productId === null || (result.status === 'matched' && !result.productId))) {
      setBarcodeFallbackActive(true);
      setStatus('error');
      setMessage(`No catalogue match was returned for ${normalizedBarcode || barcode}. Use the fallback actions below instead of dead-ending the scan.`);
      return;
    }

    setBarcodeFallbackActive(false);
    setStatus('ready');
    setMessage(`Barcode processed for ${scanId}; review work items are returned when matching needs human review.`);
  }

  function reportMissingProduct() {
    setBarcodeFallbackActive(true);
    setStatus('ready');
    setMessage(`Missing-product report queued for barcode ${normalizedBarcode || barcode}. The barcode, manual hints, and likely-product review context can feed catalogue coverage.`);
  }

  function submitManualBarcodeFallback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBarcodeFallbackActive(true);
    setStatus('ready');
    setMessage(`Manual product candidate "${manualProductName.trim() || 'unnamed product'}" queued for barcode ${normalizedBarcode || barcode}${manualStoreHint.trim() ? ` from ${manualStoreHint.trim()}` : ''}.`);
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" data-testid="scanner-mobile-camera">
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
            <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" disabled={!cameraReady} onClick={submitReceiptImage} type="button">Submit receipt image</button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-950" disabled={!cameraReady} onClick={stopReceiptCamera} type="button">Stop receipt camera</button>
          </div>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2" data-testid="scanner-barcode-fallback" onSubmit={processBarcode}>
          <label className="text-sm font-black text-slate-950" htmlFor="barcode-payload">Barcode payload</label>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manual barcode fallback stays available on mobile when camera permission is denied or camera APIs are unavailable.
          </p>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            id="barcode-payload"
            onChange={(event) => {
              setBarcode(event.target.value);
              setBarcodeFallbackActive(false);
            }}
            value={barcode}
          />
          <button className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" disabled={!barcode.trim()} type="submit">Process barcode scan</button>
        </form>
      </div>
      {barcodeFallbackActive ? (
        <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-label="Barcode lookup fallback">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">Barcode lookup fallback</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
                No exact product match was returned for {normalizedBarcode || barcode}. Keep the scanner useful by checking likely catalogue rows, entering the product manually, or reporting the missing barcode.
              </p>
            </div>
            <button className="rounded-full bg-amber-900 px-4 py-2 text-sm font-black text-white" onClick={reportMissingProduct} type="button">Report missing product</button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {fallbackProducts.map((product) => (
              <a className="rounded-2xl border border-amber-100 bg-white p-3 hover:border-amber-700" href={`/products/${product.slug}`} key={product.code}>
                <p className="text-sm font-black text-slate-950">{product.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">{product.brands || 'Brand not reported'} · {product.quantity || 'quantity not reported'}</p>
                <p className="mt-2 text-xs font-bold text-amber-900">{product.matchReason}</p>
              </a>
            ))}
          </div>
          <form className="mt-4 grid gap-3 rounded-2xl bg-white/80 p-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={submitManualBarcodeFallback}>
            <label className="text-sm font-black text-slate-950" htmlFor="manual-product-name">
              Product name
              <input
                className="mt-2 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                id="manual-product-name"
                onChange={(event) => setManualProductName(event.target.value)}
                placeholder="e.g. pasta 500 g"
                value={manualProductName}
              />
            </label>
            <label className="text-sm font-black text-slate-950" htmlFor="manual-store-hint">
              Store hint
              <input
                className="mt-2 w-full rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                id="manual-store-hint"
                onChange={(event) => setManualStoreHint(event.target.value)}
                placeholder="optional"
                value={manualStoreHint}
              />
            </label>
            <button className="self-end rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white" type="submit">Save manual entry</button>
          </form>
        </section>
      ) : null}
      <p aria-live="polite" className="mt-4 rounded-2xl bg-indigo-50 p-3 text-sm font-bold text-indigo-950" data-status={status}>{message}</p>
      {receiptHistory.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label="Receipt purchase history">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Receipt purchase history</h3>
          <p className="mt-2 text-sm font-semibold text-emerald-950">OCR rows matched to canonical products and are ready for purchase history review.</p>
          <ul className="mt-3 space-y-2">
            {receiptHistory.map((item) => (
              <li className="rounded-xl bg-white/80 p-3 text-sm font-bold text-slate-950" key={item.productId}>
                {item.name} <span className="text-slate-600">({item.productId})</span>
                {item.totalAmount === undefined ? null : <span className="ml-2 text-emerald-800">{item.totalAmount} kr</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
