"use client";

import { useId, useState } from "react";

import { communityReviewSummaryForProduct } from "@/lib/community-reviews";
import { sourceDiscrepancyReportOptions } from "@/lib/verified-data";

type FreshnessVote = "fresh" | "outdated";
type SourceDiscrepancyType = typeof sourceDiscrepancyReportOptions[number]["id"];

export type StoreProductRowProps = {
  productId: string;
  storeId: string;
  productName: string;
  storeName?: string;
  priceLabel?: string;
  shelfLifeDays?: number;
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
  className,
}: StoreProductRowProps) {
  const noteId = useId();
  const [vote, setVote] = useState<FreshnessVote>("fresh");
  const [days, setDays] = useState(shelfLifeDays?.toString() ?? "");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [discrepancyType, setDiscrepancyType] = useState<SourceDiscrepancyType>("wrong_price");
  const [discrepancyStatus, setDiscrepancyStatus] = useState<SubmitState>("idle");
  const reviewSummary = communityReviewSummaryForProduct(productName);

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

  async function submitDiscrepancy() {
    setDiscrepancyStatus("saving");

    try {
      const response = await fetch("/api/source-discrepancies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          storeId,
          productName,
          storeName,
          priceLabel,
          discrepancyType,
          note: note.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Source discrepancy report was not accepted");
      }

      setDiscrepancyStatus("saved");
    } catch {
      setDiscrepancyStatus("error");
    }
  }

  return (
    <article className={className} data-product-id={productId} data-store-id={storeId}>
      <div>
        <h3>{productName}</h3>
        {storeName ? <p>{storeName}</p> : null}
        {priceLabel ? <p>{priceLabel}</p> : null}
      </div>

      {reviewSummary ? (
        <section aria-label={`${productName} community review summary`}>
          <p>{reviewSummary.averageRatingLabel}</p>
          <p>{reviewSummary.reviewCount} community reviews</p>
          <p>{reviewSummary.topFreshnessComplaint}</p>
        </section>
      ) : null}

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

      <fieldset>
        <legend>Report source discrepancy</legend>
        {sourceDiscrepancyReportOptions.map((option) => (
          <label key={option.id} title={option.reviewerHint}>
            <input
              checked={discrepancyType === option.id}
              name={`discrepancy--`}
              onChange={() => setDiscrepancyType(option.id)}
              type="radio"
              value={option.id}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <button disabled={status === "saving"} onClick={submitFreshness} type="button">
        {status === "saving" ? "Saving…" : "Share freshness"}
      </button>
      {status === "saved" ? <p role="status">Freshness signal saved.</p> : null}
      {status === "error" ? <p role="alert">Could not save freshness signal.</p> : null}

      <button disabled={discrepancyStatus === "saving"} onClick={submitDiscrepancy} type="button">
        {discrepancyStatus === "saving" ? "Reporting…" : "Report row issue"}
      </button>
      {discrepancyStatus === "saved" ? <p role="status">Source discrepancy report saved for review.</p> : null}
      {discrepancyStatus === "error" ? <p role="alert">Could not save source discrepancy report.</p> : null}
    </article>
  );
}

export default StoreProductRow;
