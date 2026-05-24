"use client";

import {
  useList,
  type FamilyRole,
  type ListConflictPrompt,
  type SharedListItem,
} from "../lib/use-list";

type ListCardProps = {
  currentRole: FamilyRole;
  items: SharedListItem[];
  onConflictPrompt?: (prompt: ListConflictPrompt) => void;
};

const roleLabels: Record<FamilyRole, string> = {
  guardian: "Guardian",
  partner: "Partner",
  teen: "Teen",
  guest: "Guest",
};

export function ListCard({ currentRole, items, onConflictPrompt }: ListCardProps) {
  const { conflictPrompts, items: listItems, updateItem } = useList({
    currentRole,
    initialItems: items,
    onConflictPrompt,
  });

  return (
    <section
      aria-labelledby="shared-list-title"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 id="shared-list-title" className="text-base font-semibold text-slate-950">
            Shared shopping list
          </h2>
          <p className="text-sm text-slate-600">
            Editing another role&apos;s item creates a checkout conflict prompt.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Acting as {roleLabels[currentRole]}
        </span>
      </div>

      <ul className="space-y-2">
        {listItems.map((item) => (
          <li key={item.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{item.name}</p>
                {item.quantity ? <p className="text-sm text-slate-600">{item.quantity}</p> : null}
              </div>
              <label className="text-sm text-slate-600">
                Owner
                <select
                  className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900"
                  value={item.ownerRole}
                  onChange={(event) =>
                    updateItem(item.id, {
                      ownerRole: event.target.value as FamilyRole,
                    })
                  }
                >
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <option key={role} value={role}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {item.updatedByRole && item.updatedByRole !== item.ownerRole ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Last edited by {roleLabels[item.updatedByRole]}; confirm ownership before checkout.
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {conflictPrompts.length > 0 ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3" role="status">
          <p className="text-sm font-semibold text-amber-900">Conflict prompts</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {conflictPrompts.map((prompt) => (
              <li key={prompt.id}>{prompt.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
