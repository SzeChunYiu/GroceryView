"use client";

import { useState, type FormEvent } from "react";
import {
  useList,
  type FamilyRole,
  type ListConflictPrompt,
  type SharedListItem,
} from "../lib/use-list";

export type ListItemComment = {
  id: string;
  body: string;
  role: FamilyRole;
  createdAt: string;
};

export type CommentableSharedListItem = SharedListItem & {
  comments?: ListItemComment[];
};

type ListCardProps = {
  currentRole: FamilyRole;
  items: CommentableSharedListItem[];
  onConflictPrompt?: (prompt: ListConflictPrompt) => void;
};

const roleLabels: Record<FamilyRole, string> = {
  guardian: "Guardian",
  partner: "Partner",
  teen: "Teen",
  guest: "Guest",
};

function formatCommentTime(createdAt: string) {
  return createdAt.replace("T", " ").slice(0, 16);
}

export function ListCard({ currentRole, items, onConflictPrompt }: ListCardProps) {
  const [commentsByItem, setCommentsByItem] = useState<Record<string, ListItemComment[]>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.comments ?? []])),
  );
  const { conflictPrompts, items: listItems, updateItem } = useList({
    currentRole,
    initialItems: items,
    onConflictPrompt,
  });

  function addComment(itemId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = String(formData.get("comment") ?? "").trim().slice(0, 160);

    if (!body) {
      return;
    }

    const comment: ListItemComment = {
      id: `${itemId}:${currentRole}:${Date.now()}`,
      body,
      role: currentRole,
      createdAt: new Date().toISOString(),
    };

    setCommentsByItem((current) => ({
      ...current,
      [itemId]: [...(current[itemId] ?? []), comment],
    }));
    form.reset();
  }

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
        {listItems.map((item) => {
          const comments = commentsByItem[item.id] ?? [];

          return (
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

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">Item comments</p>
                {comments.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {comments.map((comment) => (
                      <li key={comment.id} className="text-sm text-slate-700">
                        <span className="font-semibold">{roleLabels[comment.role]}</span>{" "}
                        <time dateTime={comment.createdAt}>
                          {formatCommentTime(comment.createdAt)}
                        </time>
                        : {comment.body}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
                )}
                <form className="mt-3 flex gap-2" onSubmit={(event) => addComment(item.id, event)}>
                  <input
                    aria-label={`Comment on ${item.name}`}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    maxLength={160}
                    name="comment"
                    placeholder="Add ripeness, brand, or substitution note"
                    type="text"
                  />
                  <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white" type="submit">
                    Comment
                  </button>
                </form>
              </div>
            </li>
          );
        })}
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
