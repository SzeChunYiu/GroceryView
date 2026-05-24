'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AnnouncementPayload = {
  id: string;
  enabled: boolean;
  message: string | null;
  actionLabel: string | null;
  actionHref: string | null;
};

const DEFAULT_ENDPOINT = '/admin/announcement';

function getApiEndpoint(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_ENDPOINT;
  }

  return `${configured.replace(/\/$/, '')}/admin/announcement`;
}

function dismissedStorageKey(id: string) {
  return `gv-announcement-dismissed-${id}`;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementPayload | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const endpoint = useMemo(getApiEndpoint, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const response = await fetch(endpoint, {
          headers: { accept: 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          setAnnouncement(null);
          return;
        }

        const payload = (await response.json()) as AnnouncementPayload;
        const enabled = Boolean(payload?.enabled);
        const message = typeof payload?.message === 'string' ? payload.message.trim() : null;

        if (!enabled || !message) {
          setAnnouncement(null);
          return;
        }

        const withMessage = { ...payload, message };
        const dismissed = localStorage.getItem(dismissedStorageKey(withMessage.id));

        if (!cancelled) {
          setAnnouncement(withMessage);
          setIsDismissed(Boolean(dismissed));
        }
      } catch {
        if (!cancelled) {
          setAnnouncement(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAnnouncement();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (isLoading || isDismissed || !announcement) {
    return null;
  }

  return (
    <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
        <div className="min-w-0 flex-1 text-sm leading-5">
          <p className="font-semibold">{announcement.message}</p>
          {announcement.actionHref && announcement.actionLabel ? (
            <a
              href={announcement.actionHref}
              className="mt-1 inline-flex text-sm font-semibold text-emerald-900 underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {announcement.actionLabel}
            </a>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-lg border border-emerald-200 bg-white/70 p-1.5 font-medium hover:bg-white"
          aria-label="Dismiss announcement"
          onClick={() => {
            localStorage.setItem(dismissedStorageKey(announcement.id), '1');
            setIsDismissed(true);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
