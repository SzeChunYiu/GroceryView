"use client";

import { useCallback, useMemo, useState } from "react";

export type FamilyRole = "guardian" | "partner" | "teen" | "guest";

export type ListConflictPrompt = {
  id: string;
  itemId: string;
  itemName: string;
  ownerRole: FamilyRole;
  editorRole: FamilyRole;
  message: string;
};

export type SharedListItem = {
  id: string;
  name: string;
  quantity?: string;
  ownerRole: FamilyRole;
  updatedByRole?: FamilyRole;
  updatedAt?: string;
};

type EditableListItemFields = Partial<
  Pick<SharedListItem, "name" | "quantity" | "ownerRole">
>;

type UseListOptions = {
  currentRole: FamilyRole;
  initialItems?: SharedListItem[];
  onConflictPrompt?: (prompt: ListConflictPrompt) => void;
};

const createConflictPrompt = (
  item: SharedListItem,
  editorRole: FamilyRole,
): ListConflictPrompt => ({
  id: `${item.id}:${editorRole}:${Date.now()}`,
  itemId: item.id,
  itemName: item.name,
  ownerRole: item.ownerRole,
  editorRole,
  message: `${editorRole} edited ${item.name}, which is owned by ${item.ownerRole}. Resolve who should buy it before checkout.`,
});

export function useList({
  currentRole,
  initialItems = [],
  onConflictPrompt,
}: UseListOptions) {
  const [items, setItems] = useState<SharedListItem[]>(initialItems);
  const [conflictPrompts, setConflictPrompts] = useState<ListConflictPrompt[]>(
    [],
  );

  const ownedItems = useMemo(
    () => items.filter((item) => item.ownerRole === currentRole),
    [currentRole, items],
  );

  const addItem = useCallback(
    (name: string, ownerRole: FamilyRole = currentRole, quantity?: string) => {
      const item: SharedListItem = {
        id: `${ownerRole}:${name}:${Date.now()}`,
        name,
        ownerRole,
        ...(quantity === undefined ? {} : { quantity }),
        updatedByRole: currentRole,
        updatedAt: new Date().toISOString(),
      };

      setItems((currentItems) => [...currentItems, item]);
      return item;
    },
    [currentRole],
  );

  const updateItem = useCallback(
    (itemId: string, updates: EditableListItemFields) => {
      const editedItem = items.find((item) => item.id === itemId);
      const prompt =
        editedItem && editedItem.ownerRole !== currentRole
          ? createConflictPrompt(editedItem, currentRole)
          : undefined;

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...updates,
                updatedByRole: currentRole,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      if (prompt) {
        setConflictPrompts((currentPrompts) => [...currentPrompts, prompt]);
        onConflictPrompt?.(prompt);
      }
    },
    [currentRole, items, onConflictPrompt],
  );

  const clearConflictPrompt = useCallback((promptId: string) => {
    setConflictPrompts((currentPrompts) =>
      currentPrompts.filter((prompt) => prompt.id !== promptId),
    );
  }, []);

  return {
    addItem,
    clearConflictPrompt,
    conflictPrompts,
    items,
    ownedItems,
    setItems,
    updateItem,
  };
}
