"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { PublicSharePreview } from "../lib/social";
import { getStoreLayoutDepartment, sortItemsByStoreLayout, type StoreLayoutChain } from "../lib/trip-planner";
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
  publicShareHref?: string;
  selectedChain?: StoreLayoutChain;
};

const roleLabels: Record<FamilyRole, string> = {
  guardian: "Guardian",
  partner: "Partner",
  teen: "Teen",
  guest: "Guest",
};

type InvitationRole = "viewer" | "editor" | "owner";

const invitationRoles: Record<InvitationRole, { label: string; helper: string }> = {
  viewer: {
    label: "Viewer",
    helper: "Can open the list and compare prices without changing items.",
  },
  editor: {
    label: "Editor",
    helper: "Can add notes, update quantities, and check off items while shopping.",
  },
  owner: {
    label: "Owner",
    helper: "Can manage collaborators, edit the list, and revoke shared access.",
  },
};

function formatCommentTime(createdAt: string) {
  return createdAt.replace("T", " ").slice(0, 16);
}

export function PublicSharePreviewCard({
  preview,
}: Readonly<{ preview: PublicSharePreview }>) {
  return (
    <section
      aria-labelledby="public-share-preview-title"
      className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-800">
            Public read-only preview
          </p>
          <h2
            id="public-share-preview-title"
            className="mt-1 text-base font-semibold text-slate-950"
          >
            Share-safe basket snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-600">{preview.privacyNote}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
          {preview.estimatedTotalLabel}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {preview.items.map((item) => (
          <li key={`${item.name}:${item.quantity}`} className="rounded-xl border border-slate-100 p-3">
            <p className="font-medium text-slate-950">{item.name}</p>
            <p className="text-sm text-slate-600">{item.quantity}</p>
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
              {item.estimateLabel} · {item.privacySafeStoreRange}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ListCard({ currentRole, items, onConflictPrompt, publicShareHref, selectedChain = "ica" }: ListCardProps) {
  const [commentsByItem, setCommentsByItem] = useState<Record<string, ListItemComment[]>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.comments ?? []])),
  );
  const [invitationRole, setInvitationRole] = useState<InvitationRole>("viewer");
  const { conflictPrompts, items: listItems, updateItem } = useList({
    currentRole,
    initialItems: items,
    onConflictPrompt,
  });
  const storeOrderedItems = sortItemsByStoreLayout(listItems, selectedChain);

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
            Editing another role&apos;s item creates a checkout conflict prompt. Items are ordered by the selected store layout.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Acting as {roleLabels[currentRole]}
          </span>
          {publicShareHref ? (
            <Link className="rounded-full bg-sky-800 px-3 py-1 text-xs font-black text-white" href={publicShareHref}>
              Public read-only share
            </Link>
          ) : null}
        </div>
      </div>
      {publicShareHref ? (
        <p className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-sm font-bold text-sky-950">
          Public viewers can open a tokenized read-only URL with item details, matched price badges, and cheapest-store comparison without account access or edit controls.
        </p>
      ) : null}
      <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">
              Invite collaborator
            </p>
            <h3 className="mt-1 text-sm font-black text-slate-950">
              Role-based list access
            </h3>
            <p className="mt-1 text-sm text-slate-700">
              Send viewer, editor, or owner invitations so each household helper gets only the access they need.
            </p>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Invitation role
            <select
              className="mt-1 block w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-slate-900"
              value={invitationRole}
              onChange={(event) => setInvitationRole(event.target.value as InvitationRole)}
            >
              {Object.entries(invitationRoles).map(([role, config]) => (
                <option key={role} value={role}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-950">
          {invitationRoles[invitationRole].label}: {invitationRoles[invitationRole].helper}
        </p>
      </div>

      <ul className="space-y-2">
        {storeOrderedItems.map((item) => {
          const comments = commentsByItem[item.id] ?? [];

          return (
            <li key={item.id} className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {getStoreLayoutDepartment(item.name, selectedChain).label}
              </p>
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
                <p className="text-sm font-semibold text-slate-800">Item comments for substitutions, quantities, or store notes</p>
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
