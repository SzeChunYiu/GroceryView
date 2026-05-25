'use client';

import { useEffect } from 'react';

export type KeyboardShortcut = {
  key: string;
  description?: string;
  enabled?: boolean;
  ignoreEditableTargets?: boolean;
  preventDefault?: boolean;
  onKeyDown: (event: KeyboardEvent) => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function normalizedKey(value: string): string {
  return value.length === 1 ? value.toLowerCase() : value;
}

export function useKeyboardShortcuts(shortcuts: readonly KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const eventKey = normalizedKey(event.key);
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;
        if (shortcut.ignoreEditableTargets !== false && isEditableTarget(event.target)) continue;
        if (normalizedKey(shortcut.key) !== eventKey) continue;
        if (shortcut.preventDefault !== false) event.preventDefault();
        shortcut.onKeyDown(event);
        break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
