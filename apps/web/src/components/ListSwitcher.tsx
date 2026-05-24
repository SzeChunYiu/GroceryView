'use client';

import { useState } from 'react';
import type { ShoppingListSummary } from '@/hooks/useList';

type ListSwitcherProps = {
  activeListId: string;
  lists: ShoppingListSummary[];
  onCreateList: (name: string) => void;
  onDeleteList: (listId: string) => void;
  onSwitchList: (listId: string) => void;
};

export function ListSwitcher({ activeListId, lists, onCreateList, onDeleteList, onSwitchList }: Readonly<ListSwitcherProps>) {
  const [newListName, setNewListName] = useState('');

  return (
    <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm" aria-label="Shopping list switcher">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Your shopping lists</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            Create named lists for each trip, switch the active basket, or delete a list you no longer need.
          </p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateList(newListName);
            setNewListName('');
          }}
        >
          <label className="sr-only" htmlFor="new-shopping-list-name">New list name</label>
          <input
            className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-slate-950"
            id="new-shopping-list-name"
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="Weekend shop"
            type="text"
            value={newListName}
          />
          <button className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white" type="submit">Create list</button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lists.map((list) => {
          const isActive = list.id === activeListId;
          return (
            <div className="flex overflow-hidden rounded-full border border-emerald-200 bg-white" key={list.id}>
              <button
                className={`px-4 py-2 text-sm font-black ${isActive ? 'bg-emerald-900 text-white' : 'text-emerald-950'}`}
                onClick={() => onSwitchList(list.id)}
                type="button"
              >
                {list.name}
              </button>
              <button
                aria-label={`Delete ${list.name}`}
                className="border-l border-emerald-100 px-3 py-2 text-sm font-black text-rose-700 disabled:text-slate-300"
                disabled={lists.length <= 1}
                onClick={() => onDeleteList(list.id)}
                type="button"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
