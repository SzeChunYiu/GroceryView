'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

export type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  description?: string;
  closeLabel?: string;
  onClose: () => void;
};

function focusableElements(root: HTMLElement | null) {
  return root
    ? Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => element.offsetParent !== null || element === document.activeElement)
    : [];
}

export function Modal({ open, title, description, closeLabel = 'Close dialog', onClose, children }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = focusableElements(dialogRef.current);
    (focusables[0] ?? dialogRef.current)?.focus();
    return () => restoreFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = focusableElements(dialogRef.current);
    if (focusables.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="presentation">
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-3xl bg-white p-6 text-slate-950 shadow-2xl"
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black" id={titleId}>{title}</h2>
            {description ? <p className="mt-2 text-sm font-semibold leading-6 text-slate-600" id={descriptionId}>{description}</p> : null}
          </div>
          <button className="rounded-full border border-slate-300 px-3 py-1 text-sm font-black" onClick={onClose} type="button">
            {closeLabel}
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export type TabsProps = {
  tabs: { id: string; label: string; panel: ReactNode }[];
  ariaLabel: string;
};

export function Tabs({ tabs, ariaLabel }: TabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabListId = useId();

  function moveSelection(nextIndex: number) {
    const wrappedIndex = (nextIndex + tabs.length) % tabs.length;
    setSelectedIndex(wrappedIndex);
    tabRefs.current[wrappedIndex]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveSelection(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveSelection(tabs.length - 1);
    }
  }

  if (tabs.length === 0) return null;
  const selectedTab = tabs[selectedIndex]!;

  return (
    <div>
      <div aria-label={ariaLabel} className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${tabListId}-panel-${tab.id}`}
            aria-selected={index === selectedIndex}
            className={index === selectedIndex ? 'rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white' : 'rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800'}
            id={`${tabListId}-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setSelectedIndex(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            ref={(element) => { tabRefs.current[index] = element; }}
            role="tab"
            tabIndex={index === selectedIndex ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div aria-labelledby={`${tabListId}-tab-${selectedTab.id}`} className="mt-4" id={`${tabListId}-panel-${selectedTab.id}`} role="tabpanel">
        {selectedTab.panel}
      </div>
    </div>
  );
}

export type AccordionProps = {
  items: { id: string; title: string; content: ReactNode }[];
};

export function Accordion({ items }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const accordionId = useId();

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const panelId = `${accordionId}-panel-${item.id}`;
        const buttonId = `${accordionId}-button-${item.id}`;
        return (
          <section className="rounded-2xl border border-slate-200 bg-white" key={item.id}>
            <button
              aria-controls={panelId}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black text-slate-950"
              id={buttonId}
              onClick={() => setOpenIds((current) => {
                const next = new Set(current);
                if (next.has(item.id)) next.delete(item.id);
                else next.add(item.id);
                return next;
              })}
              type="button"
            >
              <span>{item.title}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            <div aria-labelledby={buttonId} hidden={!isOpen} id={panelId} role="region">
              <div className="border-t border-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">{item.content}</div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
