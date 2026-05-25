import Link from 'next/link';
import { Card, PageShell } from '@/components/data-ui';
import { ScannerUploadActions } from '@/components/scanner-upload-actions';
import { barcodeMissFallbackProducts } from '@/lib/openfoodfacts-catalog';

type ReceiptUploadPageProps = {
  params: Promise<{ country: string }>;
};

export const dynamic = 'force-dynamic';

export default async function CountryReceiptUploadPage({ params }: ReceiptUploadPageProps) {
  const { country } = await params;
  const countryLabel = country.toUpperCase();

  return (
    <PageShell>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">{countryLabel} receipts</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Upload a grocery receipt</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Signed-in shoppers can capture a receipt photo, request a private upload ticket, run OCR, match line items to canonical products, and append the parsed spend rows to purchase_history.
      </p>
      <Card className="mt-8 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">OCR → spend history</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Receipt image processing</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
              The protected scanner API extracts chain, store, date, line items, prices, and confidence; matched rows are returned as purchase history entries for the signed-in account.
            </p>
          </div>
          <Link className="rounded-full bg-indigo-900 px-5 py-3 text-sm font-black text-white" href="/scanner#scan">
            Open full scanner
          </Link>
        </div>
      </Card>
      <div className="mt-6" id="receipt-upload">
        <ScannerUploadActions fallbackProducts={barcodeMissFallbackProducts} />
      </div>
    </PageShell>
  );
}
