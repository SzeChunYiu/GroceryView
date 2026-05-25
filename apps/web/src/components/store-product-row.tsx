"use client";

import { useId, useState } from "react";
import { getStockConfidenceIndicator, type StockConfidenceState } from "../lib/source-health";

type FreshnessVote = "fresh" | "outdated";

export type StoreProductRowProps = {
  productId: string;
  storeId: string;
  productName: string;
  storeName?: string;
  priceLabel?: string;
  shelfLifeDays?: number;
  isAvailable?: boolean | null;
  observedAt?: string | null;
  sourceRetrievedAt?: string | null;
  recentObservationCount?: number | null;
  className?: string;
};

type SubmitState = "idle" | "saving" | "saved" | "error";

export function StoreProductRow({
  productId,
  storeId,
  productName,
  storeName,
  priceLabel,
  shelfLifeDays,
  isAvailable,
  observedAt,
  sourceRetrievedAt,
  recentObservationCount,
  className,
}: StoreProductRowProps) {
  const noteId = useId();
  const [vote, setVote] = useState<FreshnessVote>("fresh");
  const [days, setDays] = useState(shelfLifeDays?.toString() ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const stockConfidence = getStockConfidenceIndicator({
    isAvailable,
    observedAt,
    sourceRetrievedAt,
    recentObservationCount,
  });

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
        <h3>{productName}</h3>
        {storeName ? <p>{storeName}</p> : null}
        {priceLabel ? <p>{priceLabel}</p> : null}
        <StockConfidenceBadge confidence={stockConfidence} />
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

function StockConfidenceBadge({
  confidence,
}: {
  confidence: ReturnType<typeof getStockConfidenceIndicator>;
}) {
  const stateClassName: Record<StockConfidenceState, string> = {
    "in-stock": "border-emerald-200 bg-emerald-50 text-emerald-950",
    uncertain: "border-amber-200 bg-amber-50 text-amber-950",
    stale: "border-rose-200 bg-rose-50 text-rose-950",
  };

  return (
    <p
      aria-label={`${confidence.label}. ${confidence.detail}`}
      className={`mt-2 rounded-full border px-3 py-1 text-xs font-bold ${stateClassName[confidence.state]}`}
      data-stock-confidence={confidence.state}
      title={confidence.detail}
    >
      {confidence.label}
    </p>
  );
}

export default StoreProductRow;
