import { QrCode } from "@/components/QrCode";
import {
  LIST_QUERY_KEY,
  getDefaultShareListId,
  getDefaultShareListItems,
  getShareListUrl,
  normalizeShareListId
} from "@/lib/shareList";

type SearchParams = Readonly<{ [LIST_QUERY_KEY]?: string }>;

const DEFAULT_ORIGIN = "https://groceryview.app";

export default function ListPage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
  const list = searchParams?.[LIST_QUERY_KEY];
  const shareListId = normalizeShareListId(list);
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? DEFAULT_ORIGIN;
  const shareUrl = getShareListUrl(origin, shareListId);
  const items = getDefaultShareListItems();
  const hasCustomShare = shareListId !== getDefaultShareListId();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Shopping list</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Shareable list</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          Scan or copy this code so someone else can open this exact list from their device.
        </p>

        <dl className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold text-zinc-600">Share id:</dt>
            <dd className="tabular-nums text-zinc-950">{shareListId}</dd>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {hasCustomShare ? "Using a custom list identifier from the share URL." : "Using the default shareable list."}
          </p>
          <p className="mt-3 break-all rounded border border-dashed border-zinc-200 bg-white p-2 text-xs text-zinc-600">
            {shareUrl}
          </p>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Current list</h2>
          <ul className="mt-4 divide-y divide-zinc-200">
            {items.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  <p className="font-semibold text-zinc-950">{item.name}</p>
                  {item.notes ? <p className="text-xs text-zinc-500">{item.notes}</p> : null}
                </span>
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700">{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">QR code</h2>
          <div className="mt-4 inline-flex justify-center rounded-lg border border-zinc-200 p-4">
            <QrCode value={shareUrl} size={220} alt="QR code for shareable shopping list" />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Share this QR code in person or capture it from your phone camera to open the list.
          </p>
        </div>
      </section>
    </main>
  );
}
