"use client"

import { useMemo, useState } from "react"

import {
  findDuplicateProducts,
  type DuplicateCandidate,
  type ProductRecord,
} from "../../../lib/deduplicate-products"

const products: ProductRecord[] = [
  {
    id: "p-1001",
    name: "Organic Whole Milk 1 gal",
    brand: "Green Valley",
    category: "Dairy",
    size: "1 gal",
    upc: "000111222333",
  },
  {
    id: "p-1002",
    name: "Green Valley Organic Whole Milk Gallon",
    brand: "Green Valley",
    category: "Dairy",
    size: "1 gal",
    upc: "000111222333",
  },
  {
    id: "p-2030",
    name: "Honey Oat Granola 12 oz",
    brand: "Morning Mill",
    category: "Breakfast",
    size: "12 oz",
  },
  {
    id: "p-2031",
    name: "Morning Mill Honey & Oat Granola",
    brand: "Morning Mill",
    category: "Breakfast",
    size: "12 oz",
  },
  {
    id: "p-4100",
    name: "Sparkling Lemon Water 8 pack",
    brand: "Clear Spring",
    category: "Beverages",
    size: "8 pack",
  },
]

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) {
    return "High"
  }

  if (confidence >= 0.7) {
    return "Medium"
  }

  return "Needs review"
}

function ProductSummary({ product }: { product: ProductRecord }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.id}</div>
      <div className="mt-1 text-base font-semibold text-slate-950">{product.name}</div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
        <div>
          <dt className="font-medium text-slate-500">Brand</dt>
          <dd>{product.brand || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Size</dt>
          <dd>{product.size || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Category</dt>
          <dd>{product.category || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">UPC</dt>
          <dd>{product.upc || "—"}</dd>
        </div>
      </dl>
    </div>
  )
}

function CandidateCard({
  candidate,
  onKeepSeparate,
  onMerge,
}: {
  candidate: DuplicateCandidate
  onKeepSeparate: (id: string) => void
  onMerge: (candidate: DuplicateCandidate) => void
}) {
  const confidencePercent = Math.round(candidate.confidence * 100)

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Possible duplicate pair</h2>
          <p className="mt-1 text-sm text-slate-600">
            {candidate.signals.length > 0 ? candidate.signals.join(" · ") : "Name similarity match"}
          </p>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
          {confidenceLabel(candidate.confidence)} · {confidencePercent}%
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ProductSummary product={candidate.source} />
        <ProductSummary product={candidate.match} />
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4">
        <div className="text-sm font-semibold text-slate-950">Merge preview</div>
        <p className="mt-1 text-sm text-slate-600">
          Keep <span className="font-medium text-slate-900">{candidate.preview.name}</span> as the catalog record
          and preserve the strongest brand, size, category, and UPC values.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={() => onMerge(candidate)}
          type="button"
        >
          Merge products
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          onClick={() => onKeepSeparate(candidate.id)}
          type="button"
        >
          Keep separate
        </button>
      </div>
    </article>
  )
}

export default function DuplicateReviewPage() {
  const candidates = useMemo(() => findDuplicateProducts(products), [])
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [mergedProducts, setMergedProducts] = useState<ProductRecord[]>([])
  const pendingCandidates = candidates.filter((candidate) => !reviewedIds.includes(candidate.id))

  function markReviewed(id: string) {
    setReviewedIds((current) => [...current, id])
  }

  function mergeCandidate(candidate: DuplicateCandidate) {
    setMergedProducts((current) => [...current, candidate.preview])
    markReviewed(candidate.id)
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-slate-950 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Admin review</p>
          <h1 className="mt-2 text-3xl font-bold">Duplicate product review</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Review likely duplicate products, compare the confidence signals, and merge matching records into a
            cleaner catalog entry.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-2xl font-bold">{candidates.length}</div>
              <div className="text-sm text-slate-300">flagged pairs</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-2xl font-bold">{pendingCandidates.length}</div>
              <div className="text-sm text-slate-300">pending review</div>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <div className="text-2xl font-bold">{mergedProducts.length}</div>
              <div className="text-sm text-slate-300">merged this session</div>
            </div>
          </div>
        </div>

        <section className="mt-8 space-y-5">
          {pendingCandidates.length > 0 ? (
            pendingCandidates.map((candidate) => (
              <CandidateCard
                candidate={candidate}
                key={candidate.id}
                onKeepSeparate={markReviewed}
                onMerge={mergeCandidate}
              />
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold">Duplicate queue cleared</h2>
              <p className="mt-2 text-slate-600">All candidate pairs have been reviewed.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
