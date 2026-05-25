"use client";

import { useId, useState } from "react";
import { getStoreStockStatus, type StoreStockStatus } from "../lib/freshness";

type FreshnessVote = "fresh" | "outdated";
type StockBadgeTone = "green" | "amber" | "red";

export type StoreProductRowProps = {
  productId: string;
  storeId: string;
  productName: string;
  storeName?: string;
  priceLabel?: string;
  shelfLifeDays?: number;
  isAvailable?: boolean | null;
  observedAt?: string | number | Date | null;
  sourceSignals?: string[];
  sourceStockStatus?: string | null;
  stockStatus?: StoreStockStatus;
  stockStatusLabel?: string;
  stockStatusReason?: string;
  stockObservedAt?: string | number | Date | null;
  className?: string;
};

type SubmitState = "idle" | "saving" | "saved" | "error";
const stockBadgeClasses: Record<StockBadgeTone, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  red: "border-rose-200 bg-rose-50 text-rose-900",
};

const stockStatusCopy: Record<StoreStockStatus, { label: string; tone: StockBadgeTone }> = {
  likely_in_stock: { label: "Likely in stock", tone: "green" },
  uncertain: { label: "Stock uncertain", tone: "amber" },
  unavailable: { label: "Unavailable", tone: "red" },
};

export function StoreProductRow({
  productId,
  storeId,
  productName,
  storeName,
  priceLabel,
  shelfLifeDays,
  isAvailable,
  observedAt,
  sourceSignals,
  sourceStockStatus,
  stockStatus,
  stockStatusLabel,
  stockStatusReason,
  stockObservedAt,
  className,
}: StoreProductRowProps) {
  const noteId = useId();
  const [vote, setVote] = useState<FreshnessVote>("fresh");
  const [days, setDays] = useState(shelfLifeDays?.toString() ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const derivedStockStatus = getStoreStockStatus({
    isAvailable,
    observedAt: observedAt ?? stockObservedAt,
    sourceSignals,
    sourceStockStatus,
  });
  const stockBadge = stockStatus ? {
    ...stockStatusCopy[stockStatus],
    label: stockStatusLabel ?? stockStatusCopy[stockStatus].label,
    ageInDays: derivedStockStatus.ageInDays,
    reason: stockStatusReason ?? derivedStockStatus.reason,
    status: stockStatus,
  } : derivedStockStatus;

  async function submitFreshness() {
    setStatus("saving");

    try {
      const response = await fetch("/api/reviews/freshness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          storeId,
          status: vote,
          shelfLifeDays: days ? Number(days) : undefined,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Freshness review was not accepted");
      }

      setStatus("saved");
      setNote("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <article className={className} data-product-id={productId} data-store-id={storeId}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3>{productName}</h3>
          <span
            aria-label={`${stockBadge.label}. ${stockBadge.reason}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${stockBadgeClasses[stockBadge.tone]}`}
            data-stock-status={stockBadge.status}
            title={stockBadge.reason}
          >
            {stockBadge.label}
          </span>
        </div>
        {storeName ? <p>{storeName}</p> : null}
        {priceLabel ? <p>{priceLabel}</p> : null}
        <p className="text-xs font-medium text-slate-600">
          {stockBadge.ageInDays === null ? "Stock observation age unknown" : `Stock observed ${stockBadge.ageInDays} days ago`}
        </p>
      </div>

      <fieldset>
        <legend>Freshness signal</legend>
        <label>
          <input
            checked={vote === "fresh"}
            name={`freshness-${productId}-${storeId}`}
            onChange={() => setVote("fresh")}
            type="radio"
            value="fresh"
          />
          Fresh stock
        </label>
        <label>
          <input
            checked={vote === "outdated"}
            name={`freshness-${productId}-${storeId}`}
            onChange={() => setVote("outdated")}
            type="radio"
            value="outdated"
          />
          Outdated stock
        </label>
      </fieldset>

      <label>
        Shelf-life days
        <input
          min="0"
          onChange={(event) => setDays(event.target.value)}
          placeholder="e.g. 3"
          type="number"
          value={days}
        />
      </label>

      <label htmlFor={noteId}>Freshness note</label>
      <textarea
        id={noteId}
        maxLength={280}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note for this store's stock"
        value={note}
      />

      <button disabled={status === "saving"} onClick={submitFreshness} type="button">
        {status === "saving" ? "Saving…" : "Share freshness"}
      </button>
      {status === "saved" ? <p role="status">Freshness signal saved.</p> : null}
      {status === "error" ? <p role="alert">Could not save freshness signal.</p> : null}
    </article>
  );
}

export default StoreProductRow;
