'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type TabItem = {
  id: string;
  label: ReactNode;
  panel: ReactNode;
  disabled?: boolean;
};

type TabsProps = {
  items: readonly TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
};

function firstEnabledTab(items: readonly TabItem[]) {
  return items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? '';
}

function moveTab(items: readonly TabItem[], currentId: string, delta: number) {
  const enabled = items.filter((item) => !item.disabled);
  if (enabled.length === 0) return currentId;
  const currentIndex = Math.max(0, enabled.findIndex((item) => item.id === currentId));
  return enabled[(currentIndex + delta + enabled.length) % enabled.length]?.id ?? currentId;
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
  tabListClassName,
  tabClassName,
  activeTabClassName,
  panelClassName,
  ariaLabel = 'Tabs'
}: TabsProps) {
  const reactId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? firstEnabledTab(items));
  const selectedValue = value ?? internalValue;
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function selectTab(nextValue: string) {
    if (!items.some((item) => item.id === nextValue && !item.disabled)) return;
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
    window.requestAnimationFrame(() => tabRefs.current[nextValue]?.focus());
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const targetId = event.currentTarget.dataset.tabId ?? selectedValue;
    let nextValue: string | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextValue = moveTab(items, targetId, 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextValue = moveTab(items, targetId, -1);
    if (event.key === 'Home') nextValue = items.find((item) => !item.disabled)?.id ?? null;
    if (event.key === 'End') nextValue = [...items].reverse().find((item) => !item.disabled)?.id ?? null;
    if (!nextValue) return;
    event.preventDefault();
    selectTab(nextValue);
  }

  return (
    <div className={className}>
      <div aria-label={ariaLabel} className={tabListClassName} role="tablist">
        {items.map((item) => {
          const selected = item.id === selectedValue;
          const tabId = `${reactId}-tab-${item.id}`;
          const panelId = `${reactId}-panel-${item.id}`;
          return (
            <button
              aria-controls={panelId}
              aria-disabled={item.disabled ? 'true' : undefined}
              aria-selected={selected}
              className={`${tabClassName ?? ''}${selected && activeTabClassName ? ` ${activeTabClassName}` : ''}`.trim() || undefined}
              data-tab-id={item.id}
              disabled={item.disabled}
              id={tabId}
              key={item.id}
              onClick={() => selectTab(item.id)}
              onKeyDown={handleTabKeyDown}
              ref={(node) => { tabRefs.current[item.id] = node; }}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const selected = item.id === selectedValue;
        return (
          <div
            aria-labelledby={`${reactId}-tab-${item.id}`}
            className={panelClassName}
            hidden={!selected}
            id={`${reactId}-panel-${item.id}`}
            key={item.id}
            role="tabpanel"
            tabIndex={0}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}

type AccordionItem = {
  id: string;
  title: ReactNode;
  panel: ReactNode;
  defaultOpen?: boolean;
};

type AccordionProps = {
  items: readonly AccordionItem[];
  allowMultiple?: boolean;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
};

export function Accordion({ items, allowMultiple = false, className, buttonClassName, panelClassName }: AccordionProps) {
  const reactId = useId();
  const [openIds, setOpenIds] = useState(() => new Set(items.filter((item) => item.defaultOpen).map((item) => item.id)));

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = allowMultiple ? new Set(current) : new Set<string>();
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={className}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        const buttonId = `${reactId}-accordion-button-${item.id}`;
        const panelId = `${reactId}-accordion-panel-${item.id}`;
        return (
          <div key={item.id}>
            <button
              aria-controls={panelId}
              aria-expanded={open}
              className={buttonClassName}
              id={buttonId}
              onClick={() => toggle(item.id)}
              type="button"
            >
              {item.title}
            </button>
            <div aria-labelledby={buttonId} className={panelClassName} hidden={!open} id={panelId} role="region">
              {item.panel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type ModalDialogProps = {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  labelledById?: string;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function ModalDialog({ open, title, children, onClose, className, labelledById }: ModalDialogProps) {
  const generatedTitleId = useId();
  const titleId = labelledById ?? generatedTitleId;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    (focusables[0] ?? dialogRef.current)?.focus();
    return () => restoreFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={className}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
        if (focusables.length === 0) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
    </div>
  );
}
