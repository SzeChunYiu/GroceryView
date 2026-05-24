export const LIST_ROUTE = "/list";
export const LIST_QUERY_KEY = "list";
const DEFAULT_LIST_ID = "weekly-basket-v1";

export type ShareListItem = {
  name: string;
  quantity: string;
  notes?: string;
};

const DEFAULT_LIST_ITEMS: ShareListItem[] = [
  { name: "Zoegas Coffee 450g", quantity: "2 pack", notes: "Buy before Friday" },
  { name: "Arla Mellanmjölk 1L", quantity: "1 liter" },
  { name: "ICA Ägg 15-pack", quantity: "1", notes: "Prefer local eggs if available" },
  { name: "Butter", quantity: "1", notes: "Unsalted spread" }
];

export function getDefaultShareListItems(): readonly ShareListItem[] {
  return DEFAULT_LIST_ITEMS;
}

export function getDefaultShareListId(): string {
  return DEFAULT_LIST_ID;
}

export function normalizeShareListId(raw?: string | null): string {
  const normalized = (raw ?? "").trim().toLowerCase();

  if (!normalized) return DEFAULT_LIST_ID;
  return normalized.replace(/[^a-z0-9_-]/g, "-");
}

export function getShareListUrl(origin: string, listId?: string): string {
  const safeOrigin = origin.replace(/\/$/, "");
  const safeId = encodeURIComponent(normalizeShareListId(listId));
  return `${safeOrigin}${LIST_ROUTE}?${new URLSearchParams({ [LIST_QUERY_KEY]: safeId }).toString()}`;
}
