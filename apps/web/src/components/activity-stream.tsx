'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getSharedListActivityEvents,
  sortSharedListActivityEvents,
  subscribeToSharedListActivity,
  type SharedListActivityEvent
} from '@/lib/activity-log';

type ActivityStreamProps = {
  listId?: string;
  initialEvents?: SharedListActivityEvent[];
};

const emptyActivityEvents: SharedListActivityEvent[] = [];

function activityLabel(event: SharedListActivityEvent): string {
  if (event.kind === 'item_added') return 'added';
  if (event.kind === 'item_checked') return 'checked';
  if (event.kind === 'item_edited') return 'edited';
  return 'removed';
}

function activityTone(event: SharedListActivityEvent): string {
  if (event.kind === 'item_removed') return 'bg-rose-50 text-rose-800';
  if (event.kind === 'item_checked') return 'bg-emerald-50 text-emerald-800';
  if (event.kind === 'item_edited') return 'bg-amber-50 text-amber-900';
  return 'bg-sky-50 text-sky-800';
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

export function ActivityStream({ listId, initialEvents = emptyActivityEvents }: ActivityStreamProps) {
  const seededEvents = useMemo(() => {
    const loggedEvents = getSharedListActivityEvents(listId);
    const deduplicatedEvents = [...loggedEvents, ...initialEvents].filter((event, index, events) => events.findIndex((candidate) => candidate.id === event.id) === index);
    return sortSharedListActivityEvents(deduplicatedEvents);
  }, [initialEvents, listId]);
  const [events, setEvents] = useState(seededEvents);

  useEffect(() => {
    setEvents(seededEvents);
  }, [seededEvents]);

  useEffect(() => {
    return subscribeToSharedListActivity((event) => {
      if (listId && event.listId !== listId) return;
      setEvents((current) => sortSharedListActivityEvents([event, ...current.filter((entry) => entry.id !== event.id)]));
    });
  }, [listId]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Shared list activity stream" aria-live="polite">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Activity stream</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Shared-list changes</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Collaborator added, checked, edited, and removed events include the actor and timestamp so asynchronous shopping-list edits stay transparent.
      </p>

      {events.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">No shared-list activity has been published yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {events.map((event) => (
            <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={event.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {event.actor.name} {activityLabel(event)} {event.itemName}
                  </p>
                  {event.detail ? <p className="mt-1 text-sm leading-6 text-slate-600">{event.detail}</p> : null}
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${activityTone(event)}`}>
                  {activityLabel(event)}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTimestamp(event.timestamp)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
