'use client';

import { type KeyboardEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

export type FilterChipOption = Readonly<{
  id: string;
  label: string;
  description?: string;
  count?: number;
  disabled?: boolean;
}>;

export type FilterChipGroup = Readonly<{
  id: string;
  label: string;
  description?: string;
  options: readonly FilterChipOption[];
}>;

export type FilterChipsProps = Readonly<{
  groups: readonly FilterChipGroup[];
  selectedIds?: readonly string[];
  defaultSelectedIds?: readonly string[];
  label?: string;
  triggerLabel?: string;
  onChange?: (selectedIds: string[]) => void;
  children?: ReactNode;
}>;

const CHIP_ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);
const FORWARD_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const BACKWARD_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

export function isFilterChipActivationKey(key: string) {
  return CHIP_ACTIVATION_KEYS.has(key);
}

export function nextRovingIndex(currentIndex: number, itemCount: number, direction: 1 | -1) {
  if (itemCount <= 0) return -1;
  return (currentIndex + direction + itemCount) % itemCount;
}

function uniqueIds(values: readonly string[]) {
  return [...new Set(values)];
}

function selectedSummary(groups: readonly FilterChipGroup[], selectedIds: readonly string[]) {
  if (selectedIds.length === 0) return 'No filters selected.';

  const labels = groups
    .flatMap((group) => group.options)
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label);

  return `${selectedIds.length} filter${selectedIds.length === 1 ? '' : 's'} selected${labels.length > 0 ? `: ${labels.join(', ')}` : ''}.`;
}

export function FilterChips({
  groups,
  selectedIds,
  defaultSelectedIds = [],
  label = 'Filter results',
  triggerLabel = 'Edit filters',
  onChange,
  children
}: FilterChipsProps) {
  const generatedId = useId();
  const isControlled = selectedIds !== undefined;
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(() => uniqueIds(defaultSelectedIds));
  const currentSelectedIds = useMemo(
    () => uniqueIds(isControlled ? selectedIds ?? [] : internalSelectedIds),
    [internalSelectedIds, isControlled, selectedIds]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set(groups.slice(0, 1).map((group) => group.id)));
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const titleId = `${generatedId}-title`;
  const summaryId = `${generatedId}-summary`;
  const activeGroup = groups[activeGroupIndex] ?? groups[0];
  const activeGroupExpanded = activeGroup ? expandedGroupIds.has(activeGroup.id) : false;

  useEffect(() => {
    if (!dialogOpen) return;

    const focusable = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [dialogOpen]);

  useEffect(() => {
    if (activeGroupIndex < groups.length) return;
    setActiveGroupIndex(Math.max(0, groups.length - 1));
  }, [activeGroupIndex, groups.length]);

  function commitSelected(nextSelectedIds: string[]) {
    const nextUniqueIds = uniqueIds(nextSelectedIds);
    if (!isControlled) {
      setInternalSelectedIds(nextUniqueIds);
    }
    onChange?.(nextUniqueIds);
  }

  function toggleSelected(optionId: string) {
    commitSelected(
      currentSelectedIds.includes(optionId)
        ? currentSelectedIds.filter((id) => id !== optionId)
        : [...currentSelectedIds, optionId]
    );
  }

  function closeDialog() {
    setDialogOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function trapDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current
      ? Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
      : [];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function selectTab(nextIndex: number, shouldFocus = true) {
    if (groups.length === 0) return;
    const normalisedIndex = (nextIndex + groups.length) % groups.length;
    setActiveGroupIndex(normalisedIndex);
    setExpandedGroupIds((previous) => new Set(previous).add(groups[normalisedIndex].id));
    if (shouldFocus) {
      window.requestAnimationFrame(() => tabRefs.current[normalisedIndex]?.focus());
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (FORWARD_KEYS.has(event.key)) {
      event.preventDefault();
      selectTab(index + 1);
    } else if (BACKWARD_KEYS.has(event.key)) {
      event.preventDefault();
      selectTab(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      selectTab(groups.length - 1);
    }
  }

  function handleChipKeyDown(event: KeyboardEvent<HTMLButtonElement>, option: FilterChipOption, index: number) {
    if (isFilterChipActivationKey(event.key)) {
      event.preventDefault();
      if (!option.disabled) toggleSelected(option.id);
      return;
    }

    if (FORWARD_KEYS.has(event.key) || BACKWARD_KEYS.has(event.key)) {
      event.preventDefault();
      const direction = FORWARD_KEYS.has(event.key) ? 1 : -1;
      const nextIndex = nextRovingIndex(index, activeGroup?.options.length ?? 0, direction);
      chipRefs.current[nextIndex]?.focus();
    }
  }

  function toggleActiveAccordion() {
    if (!activeGroup) return;
    setExpandedGroupIds((previous) => {
      const nextExpanded = new Set(previous);
      if (nextExpanded.has(activeGroup.id)) {
        nextExpanded.delete(activeGroup.id);
      } else {
        nextExpanded.add(activeGroup.id);
      }
      return nextExpanded;
    });
  }

  return (
    <section aria-labelledby={titleId} aria-describedby={summaryId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800" id={titleId}>{label}</h2>
          <p aria-live="polite" className="text-sm font-semibold text-slate-600" id={summaryId}>{selectedSummary(groups, currentSelectedIds)}</p>
        </div>
        <button
          className="rounded-full border border-emerald-700 bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
          onClick={() => setDialogOpen(true)}
          ref={triggerRef}
          type="button"
        >
          {triggerLabel}
        </button>
      </div>

      {children}

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}>
          <div
            aria-describedby={summaryId}
            aria-labelledby={`${generatedId}-dialog-title`}
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl"
            onKeyDown={trapDialogFocus}
            ref={dialogRef}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950" id={`${generatedId}-dialog-title`}>{label}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">Use Tab to move controls, Escape to close, and arrow keys inside tabs or chip rows.</p>
              </div>
              <button className="rounded-full px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-100" onClick={closeDialog} type="button">
                Close<span className="sr-only"> filter dialog</span>
              </button>
            </div>

            <div aria-label="Filter groups" className="mt-5 flex flex-wrap gap-2" role="tablist">
              {groups.map((group, index) => {
                const selected = index === activeGroupIndex;
                return (
                  <button
                    aria-controls={`${generatedId}-${group.id}-panel`}
                    aria-selected={selected}
                    className={`rounded-full px-4 py-2 text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 ${
                      selected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-800 hover:bg-emerald-50'
                    }`}
                    id={`${generatedId}-${group.id}-tab`}
                    key={group.id}
                    onClick={() => selectTab(index, false)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    role="tab"
                    tabIndex={selected ? 0 : -1}
                    type="button"
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>

            {activeGroup ? (
              <div
                aria-labelledby={`${generatedId}-${activeGroup.id}-tab`}
                className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                id={`${generatedId}-${activeGroup.id}-panel`}
                role="tabpanel"
                tabIndex={0}
              >
                <button
                  aria-controls={`${generatedId}-${activeGroup.id}-chips`}
                  aria-expanded={activeGroupExpanded}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left font-black text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
                  onClick={toggleActiveAccordion}
                  type="button"
                >
                  <span>{activeGroup.label}</span>
                  <span aria-hidden="true">{activeGroupExpanded ? '−' : '+'}</span>
                </button>
                {activeGroup.description ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{activeGroup.description}</p> : null}

                {activeGroupExpanded ? (
                  <div
                    aria-label={`${activeGroup.label} filter chips`}
                    aria-multiselectable="true"
                    className="mt-4 flex flex-wrap gap-2"
                    id={`${generatedId}-${activeGroup.id}-chips`}
                    role="listbox"
                  >
                    {activeGroup.options.map((option, index) => {
                      const selected = currentSelectedIds.includes(option.id);
                      const chipLabel = `${option.label}${typeof option.count === 'number' ? `, ${option.count} matches` : ''}`;
                      return (
                        <button
                          aria-describedby={option.description ? `${generatedId}-${activeGroup.id}-${option.id}-description` : undefined}
                          aria-disabled={option.disabled || undefined}
                          aria-label={chipLabel}
                          aria-pressed={selected}
                          aria-selected={selected}
                          className={`rounded-full border px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 ${
                            selected ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-700'
                          } ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                          disabled={option.disabled}
                          key={option.id}
                          onClick={() => toggleSelected(option.id)}
                          onKeyDown={(event) => handleChipKeyDown(event, option, index)}
                          ref={(node) => {
                            chipRefs.current[index] = node;
                          }}
                          role="option"
                          tabIndex={index === 0 ? 0 : -1}
                          type="button"
                        >
                          {option.label}
                          {typeof option.count === 'number' ? <span className="ml-2 text-xs opacity-80">{option.count}</span> : null}
                          {option.description ? <span className="sr-only" id={`${generatedId}-${activeGroup.id}-${option.id}-description`}>{option.description}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">No filter groups available.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
