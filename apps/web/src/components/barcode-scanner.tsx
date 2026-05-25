'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type BarcodeScannerDetector = {
  detect(input: CanvasImageSource): Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeScannerDetector;

type BrowserWithBarcodeDetector = Window & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

type BarcodeLookupProduct = {
  href: string;
  name: string;
  brand: string;
  quantity: string;
  source: string;
};

type BarcodeLookupResponse = {
  status: 'matched' | 'miss';
  product: BarcodeLookupProduct | null;
};

const knownBarcodeRoutes: Record<string, string> = {
  '7350012338510': '/pharmacy',
  '7350014910547': '/pharmacy',
  '0735000123456': '/products?q=0735000123456'
};

function normalizeEan(value: string) {
  return value.replace(/\D/g, '').slice(0, 14);
}

function productLookupHref(ean: string) {
  return knownBarcodeRoutes[ean] ?? `/products?q=${encodeURIComponent(ean)}`;
}

export function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeScannerDetector | null>(null);
  const [ean, setEan] = useState('0735000123456');
  const [status, setStatus] = useState('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [resolvedProduct, setResolvedProduct] = useState<BarcodeLookupProduct | null>(null);
  const normalizedEan = normalizeEan(ean);
  const productHref = useMemo(() => resolvedProduct?.href ?? productLookupHref(normalizedEan), [normalizedEan, resolvedProduct]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!isScanning) return undefined;
    const timer = window.setInterval(async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!video || !detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      try {
        const [result] = await detector.detect(video);
        const rawValue = normalizeEan(result?.rawValue ?? '');
        if (rawValue) {
          setEan(rawValue);
          setStatus(`Detected EAN ${rawValue}. Resolving catalogue match...`);
          setIsScanning(false);
          void resolveBarcodeLookup(rawValue);
        }
      } catch {
        setStatus('Camera frame could not be decoded. Use manual EAN entry below.');
      }
    }, 700);
    return () => window.clearInterval(timer);
  }, [isScanning]);

  async function resolveBarcodeLookup(value: string) {
    const lookupEan = normalizeEan(value);
    if (lookupEan.length < 8) {
      setResolvedProduct(null);
      setStatus('Enter at least 8 barcode digits to resolve a product match.');
      return;
    }

    const response = await fetch(`/api/barcode?ean=${encodeURIComponent(lookupEan)}`);
    if (!response.ok) {
      setResolvedProduct(null);
      setStatus(`No catalogue product matched EAN ${lookupEan}. Open search fallback or report the missing barcode.`);
      return;
    }

    const body = (await response.json()) as BarcodeLookupResponse;
    setResolvedProduct(body.product);
    setStatus(body.product ? `Matched ${body.product.name} from ${body.product.source}.` : `No catalogue product matched EAN ${lookupEan}.`);
  }

  async function startCamera() {
    const browserWindow = window as BrowserWithBarcodeDetector;
    if (!browserWindow.BarcodeDetector) {
      setStatus('BarcodeDetector is not available in this browser. Use manual fallback entry.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera API is unavailable. Use manual fallback entry.');
      return;
    }
    try {
      detectorRef.current = new browserWindow.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsScanning(true);
      setStatus('Point the camera at a barcode. Frames stay local until an EAN is resolved.');
    } catch {
      setStatus('Camera permission was denied. Use manual fallback entry.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
    setStatus('Barcode camera stopped. Manual EAN lookup is still available.');
  }

  function submitManualEan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEan(normalizedEan);
    void resolveBarcodeLookup(normalizedEan);
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5" aria-label="Barcode camera lookup">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">In-store barcode lookup</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Scan an EAN barcode and jump to products</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        The browser camera uses the native BarcodeDetector API when available and keeps frames on-device. Manual EAN entry remains available when camera permission or barcode APIs are unavailable.
      </p>
      <video aria-label="Barcode camera preview" autoPlay className="mt-4 aspect-video w-full rounded-2xl bg-slate-950" muted playsInline ref={videoRef} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" onClick={startCamera} type="button">Start barcode camera</button>
        <button className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-black text-emerald-950" onClick={stopCamera} type="button">Stop camera</button>
      </div>
      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitManualEan}>
        <label className="text-sm font-black text-slate-950" htmlFor="manual-ean">
          Manual EAN fallback
          <input className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950" id="manual-ean" inputMode="numeric" onChange={(event) => { setEan(event.target.value); setResolvedProduct(null); }} pattern="[0-9]*" value={ean} />
        </label>
        <button className="self-end rounded-full bg-slate-950 px-4 py-3 text-sm font-black text-white" type="submit">Resolve EAN</button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" href={productHref}>{resolvedProduct ? 'Open matched product' : 'Open product lookup'}</Link>
        <span className="text-sm font-bold text-emerald-950">Resolved EAN: {normalizedEan || 'not set'}</span>
        {resolvedProduct ? (
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-emerald-950">
            {resolvedProduct.name} · {resolvedProduct.brand} · {resolvedProduct.quantity}
          </span>
        ) : null}
      </div>
      <p aria-live="polite" className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-emerald-950">{status}</p>
    </section>
  );
}
