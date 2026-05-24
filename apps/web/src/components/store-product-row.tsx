/**
 * StoreProductRow renders a product/store freshness feedback row so shoppers can
 * review whether a specific store's stock is fresh, outdated, or accompanied by
 * optional shelf-life context.
 *
 * @example
 * ```tsx
 * <StoreProductRow
 *   productId="milk-1l"
 *   storeId="willys-stockholm"
 *   productName="Milk 1L"
 *   storeName="Willys Stockholm"
 *   priceLabel="12.90 kr"
 *   shelfLifeDays={3}
 * />
 * ```
 *
 * @param productId Stable product identifier submitted with the freshness vote.
 * @param storeId Stable store identifier submitted with the freshness vote.
 * @param productName Human-readable product name rendered as the row heading.
 * @param storeName Optional store label shown below the product name.
 * @param priceLabel Optional current price text shown with the row details.
 * @param shelfLifeDays Optional initial shelf-life value, in days, for the input.
 * @param className Optional CSS class applied to the outer article element.
 */
"use client";

import { useId, useState } from "react";

type FreshnessVote = "fresh" | "outdated";

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
