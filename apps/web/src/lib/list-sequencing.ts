import {
  storeLayoutDepartments,
  type StoreLayoutChain,
  type StoreLayoutGroupOrder
} from './trip-planner';

export const STORE_AISLE_LAYOUT_STORAGE_KEY = 'groceryview:shopping-list:aisle-layout:v1';

export type StoreAisleLayoutPreference = {
  chain: StoreLayoutChain;
  departmentOrder: string[];
  groupOrder: StoreLayoutGroupOrder;
};

export const storeAisleLayoutChains = Object.keys(storeLayoutDepartments) as StoreLayoutChain[];

function isStoreLayoutChain(value: unknown): value is StoreLayoutChain {
  return typeof value === 'string' && storeAisleLayoutChains.includes(value as StoreLayoutChain);
}

function isStoreLayoutGroupOrder(value: unknown): value is StoreLayoutGroupOrder {
  return value === 'store-layout' || value === 'reverse-layout';
}

function defaultDepartmentOrder(chain: StoreLayoutChain) {
  return storeLayoutDepartments[chain].map((department) => department.id);
}

export function defaultStoreAisleLayoutPreference(
  chain: StoreLayoutChain = 'ica',
  groupOrder: StoreLayoutGroupOrder = 'store-layout'
): StoreAisleLayoutPreference {
  return {
    chain,
    departmentOrder: defaultDepartmentOrder(chain),
    groupOrder
  };
}

export function normalizeStoreAisleLayoutPreference(
  value: unknown,
  fallback: StoreAisleLayoutPreference = defaultStoreAisleLayoutPreference()
): StoreAisleLayoutPreference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;

  const parsed = value as Partial<StoreAisleLayoutPreference>;
  const chain = isStoreLayoutChain(parsed.chain) ? parsed.chain : fallback.chain;
  const groupOrder = isStoreLayoutGroupOrder(parsed.groupOrder) ? parsed.groupOrder : fallback.groupOrder;
  const validDepartmentIds = new Set(defaultDepartmentOrder(chain));
  const departmentOrder = Array.isArray(parsed.departmentOrder)
    ? parsed.departmentOrder.filter((departmentId): departmentId is string => (
      typeof departmentId === 'string' && validDepartmentIds.has(departmentId)
    ))
    : [];

  return {
    chain,
    departmentOrder: [
      ...departmentOrder,
      ...defaultDepartmentOrder(chain).filter((departmentId) => !departmentOrder.includes(departmentId))
    ],
    groupOrder
  };
}

export function storeAisleLayoutPreferenceFromStorage(
  value: string | null,
  fallback: StoreAisleLayoutPreference = defaultStoreAisleLayoutPreference()
) {
  if (!value) return fallback;

  try {
    return normalizeStoreAisleLayoutPreference(JSON.parse(value), fallback);
  } catch {
    return fallback;
  }
}

export function storeAisleLayoutPreferenceForChain(
  current: StoreAisleLayoutPreference,
  chain: StoreLayoutChain
): StoreAisleLayoutPreference {
  return normalizeStoreAisleLayoutPreference({ ...current, chain }, defaultStoreAisleLayoutPreference(chain, current.groupOrder));
}

export function moveStoreAisleDepartment(
  preference: StoreAisleLayoutPreference,
  departmentId: string,
  direction: -1 | 1
): StoreAisleLayoutPreference {
  const departmentOrder = [...preference.departmentOrder];
  const currentIndex = departmentOrder.indexOf(departmentId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= departmentOrder.length) return preference;

  [departmentOrder[currentIndex], departmentOrder[nextIndex]] = [departmentOrder[nextIndex], departmentOrder[currentIndex]];
  return { ...preference, departmentOrder };
}
