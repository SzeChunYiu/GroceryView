"use client";

import { useState } from "react";
import type { SavedSearchAlertRule, SavedSearchFilters } from "@/lib/alert-scheduler";

const storageKey = "groceryview:saved-search-alert-rules";

type SavedSearchActionProps = {
  filters: SavedSearchFilters;
  rules: SavedSearchAlertRule[];
  resultCount: number;
};

function readExistingRules() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as SavedSearchAlertRule[] : [];
  } catch {
    return [];
  }
}

export function SavedSearchAction({ filters, rules, resultCount }: SavedSearchActionProps) {
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  function saveSearch() {
    const existing = readExistingRules().filter((rule) => !rules.some((candidate) => candidate.id === rule.id));
    window.localStorage.setItem(storageKey, JSON.stringify([...rules, ...existing]));
    setStatus("saved");
  }

  return (
    <section className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" data-saved-search-action>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Saved search subscription</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">Save this search</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            Stores the current query filters and creates alert rules for new matches and price drops across {resultCount.toLocaleString("sv-SE")} matching products.
          </p>
        </div>
        <button className="rounded-full bg-violet-800 px-5 py-3 text-sm font-black text-white" onClick={saveSearch} type="button">
          Save this search
        </button>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-bold text-slate-700 md:grid-cols-2">
        {rules.map((rule) => (
          <p className="rounded-xl bg-violet-50 p-3 text-violet-950" key={rule.id}>
            {rule.type === "new_match" ? "New matches" : "Price drops"} · {rule.trigger.thresholdPercent ? `${rule.trigger.thresholdPercent}% threshold` : "any new verified match"}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-600">
        Active filters: {filters.query || filters.categories.join(", ") || filters.labels.join(", ") || filters.chain || "none"}
      </p>
      {status === "saved" ? <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-900" role="status">Saved search alert rules created on this device.</p> : null}
    </section>
  );
}

export default SavedSearchAction;
