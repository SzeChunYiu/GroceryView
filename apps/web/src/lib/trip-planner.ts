export type RouteMode = 'fastest' | 'balanced' | 'accessibility';
export type TripOriginSource = 'public_snapshot' | 'consented_geolocation';

export type TripOrigin = {
  source: TripOriginSource;
  label: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  observedAt?: string;
};

export type TripPlannerItem = {
  name: string;
  aisle: number;
  quantity?: number;
  picked?: boolean;
};

export type ActiveShoppingList = {
  id: string;
  name: string;
  routeMode: RouteMode;
  items: TripPlannerItem[];
  checkoutMinutes?: number;
};

export type RouteModeProfile = {
  label: string;
  description: string;
  metersPerMinute: number;
  secondsPerItem: number;
  turnPenaltySeconds: number;
};

export type AisleStop = {
  aisle: number;
  itemCount: number;
  items: string[];
};

export type TripEstimate = {
  listId: string;
  listName: string;
  originAccuracyMeters?: number;
  originApproachMinutes: number;
  originDistanceMeters: number;
  originLabel: string;
  originSource: TripOriginSource;
  routeRecalculatedAt?: string;
  routeMode: RouteMode;
  routeModeLabel: string;
  routeModeDescription: string;
  totalItemCount: number;
  remainingItemCount: number;
  aisleTraversal: number[];
  aisleStops: AisleStop[];
  walkingMinutes: number;
  pickingMinutes: number;
  checkoutMinutes: number;
  estimatedCompletionMinutes: number;
  timeToCompleteMinutes: number;
};

export const routeModeProfiles: Record<RouteMode, RouteModeProfile> = {
  fastest: {
    label: 'Fastest route',
    description: 'Prioritizes the shortest aisle pass with quick item picks.',
    metersPerMinute: 72,
    secondsPerItem: 28,
    turnPenaltySeconds: 8
  },
  balanced: {
    label: 'Balanced route',
    description: 'Keeps the route direct while allowing more time to compare products.',
    metersPerMinute: 58,
    secondsPerItem: 38,
    turnPenaltySeconds: 12
  },
  accessibility: {
    label: 'Accessible route',
    description: 'Uses a steadier pace with extra time for turns and reaching shelves.',
    metersPerMinute: 42,
    secondsPerItem: 52,
    turnPenaltySeconds: 18
  }
};

export const activeShoppingLists: ActiveShoppingList[] = [
  {
    id: 'weekday-top-up',
    name: 'Weekday top-up',
    routeMode: 'fastest',
    checkoutMinutes: 5,
    items: [
      { name: 'Oat milk', aisle: 2 },
      { name: 'Greek yoghurt', aisle: 2 },
      { name: 'Bananas', aisle: 1 },
      { name: 'Pasta sauce', aisle: 6 },
      { name: 'Coffee filters', aisle: 8, picked: true }
    ]
  },
  {
    id: 'family-dinner',
    name: 'Family dinner',
    routeMode: 'balanced',
    checkoutMinutes: 7,
    items: [
      { name: 'Tomatoes', aisle: 1 },
      { name: 'Fresh basil', aisle: 1 },
      { name: 'Spaghetti', aisle: 6 },
      { name: 'Parmesan', aisle: 3 },
      { name: 'Sparkling water', aisle: 9 }
    ]
  },
  {
    id: 'low-mobility-restock',
    name: 'Low-mobility restock',
    routeMode: 'accessibility',
    checkoutMinutes: 8,
    items: [
      { name: 'Wholegrain bread', aisle: 4 },
      { name: 'Tea', aisle: 7 },
      { name: 'Soup', aisle: 6 },
      { name: 'Apples', aisle: 1 }
    ]
  }
];

export const publicSnapshotTripOrigin: TripOrigin = {
  source: 'public_snapshot',
  label: 'Public snapshot origin · no private shopper location',
  latitude: 55.60498,
  longitude: 13.00382
};

export function consentedTripOrigin(latitude: number, longitude: number, accuracyMeters?: number): TripOrigin {
  return {
    source: 'consented_geolocation',
    label: 'Consented browser location',
    latitude,
    longitude,
    accuracyMeters,
    observedAt: new Date().toISOString()
  };
}

const SHOPPING_TRIP_STORE = { latitude: 55.60587, longitude: 13.00073 };
const ENTRY_EXIT_METERS = 80;
const METERS_PER_AISLE_STOP = 35;
const METERS_PER_AISLE_GAP = 18;

function distanceMeters(from: Pick<TripOrigin, 'latitude' | 'longitude'>, to: { latitude: number; longitude: number }) {
  const earthRadiusMeters = 6_371_000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getAisleTraversal(items: TripPlannerItem[], routeMode: RouteMode = 'balanced') {
  const uniqueAisles = Array.from(new Set(items.filter((item) => !item.picked).map((item) => item.aisle))).sort((a, b) => a - b);

  if (routeMode === 'accessibility') {
    return uniqueAisles.sort((a, b) => Math.abs(a - 1) - Math.abs(b - 1) || a - b);
  }

  return uniqueAisles;
}

export function estimateTripCompletion(
  list: ActiveShoppingList,
  selectedRouteMode: RouteMode = list.routeMode,
  origin: TripOrigin = publicSnapshotTripOrigin
): TripEstimate {
  const profile = routeModeProfiles[selectedRouteMode];
  const remainingItems = list.items.filter((item) => !item.picked);
  const aisleTraversal = getAisleTraversal(remainingItems, selectedRouteMode);
  const aisleStops = aisleTraversal.map((aisle) => {
    const aisleItems = remainingItems.filter((item) => item.aisle === aisle);

    return {
      aisle,
      itemCount: aisleItems.reduce((count, item) => count + (item.quantity ?? 1), 0),
      items: aisleItems.map((item) => item.name)
    };
  });
  const aisleGapMeters = aisleTraversal.slice(1).reduce((meters, aisle, index) => {
    return meters + Math.abs(aisle - aisleTraversal[index]) * METERS_PER_AISLE_GAP;
  }, 0);
  const walkingMeters = remainingItems.length === 0 ? 0 : ENTRY_EXIT_METERS + aisleTraversal.length * METERS_PER_AISLE_STOP + aisleGapMeters;
  const turnSeconds = Math.max(0, aisleTraversal.length - 1) * profile.turnPenaltySeconds;
  const walkingMinutes = Math.ceil((walkingMeters / profile.metersPerMinute) + (turnSeconds / 60));
  const originDistanceMeters = distanceMeters(origin, SHOPPING_TRIP_STORE);
  const originApproachMinutes = origin.source === 'consented_geolocation'
    ? Math.ceil(originDistanceMeters / profile.metersPerMinute)
    : 0;
  const pickingMinutes = Math.ceil((remainingItems.length * profile.secondsPerItem) / 60);
  const checkoutMinutes = remainingItems.length === 0 ? 0 : (list.checkoutMinutes ?? 6);
  const estimatedCompletionMinutes = originApproachMinutes + walkingMinutes + pickingMinutes + checkoutMinutes;

  return {
    listId: list.id,
    listName: list.name,
    originAccuracyMeters: origin.accuracyMeters,
    originApproachMinutes,
    originDistanceMeters,
    originLabel: origin.label,
    originSource: origin.source,
    routeRecalculatedAt: origin.observedAt,
    routeMode: selectedRouteMode,
    routeModeLabel: profile.label,
    routeModeDescription: profile.description,
    totalItemCount: list.items.length,
    remainingItemCount: remainingItems.length,
    aisleTraversal,
    aisleStops,
    walkingMinutes,
    pickingMinutes,
    checkoutMinutes,
    estimatedCompletionMinutes,
    timeToCompleteMinutes: estimatedCompletionMinutes
  };
}

export const activeShoppingTripEstimates = activeShoppingLists.map((list) => estimateTripCompletion(list, list.routeMode));

export type StoreLayoutChain = 'ica' | 'coop' | 'willys';
export type StoreLayoutGroupOrder = 'store-layout' | 'reverse-layout';

export type StoreLayoutDepartment = {
  id: string;
  label: string;
  keywords: string[];
};

export const storeLayoutDepartments: Record<StoreLayoutChain, StoreLayoutDepartment[]> = {
  ica: [
    { id: 'produce', label: 'Produce entrance', keywords: ['apple', 'banana', 'tomato', 'basil', 'salad', 'potato'] },
    { id: 'dairy', label: 'Dairy chillers', keywords: ['milk', 'yoghurt', 'yogurt', 'cheese', 'cream'] },
    { id: 'pantry', label: 'Pantry aisles', keywords: ['pasta', 'sauce', 'rice', 'flour', 'soup'] },
    { id: 'drinks', label: 'Drinks wall', keywords: ['water', 'juice', 'coffee', 'tea', 'soda'] },
    { id: 'checkout', label: 'Checkout', keywords: [] }
  ],
  coop: [
    { id: 'produce', label: 'Fruit and vegetables', keywords: ['apple', 'banana', 'tomato', 'basil', 'salad', 'potato'] },
    { id: 'bakery', label: 'Bakery', keywords: ['bread', 'bun', 'roll'] },
    { id: 'pantry', label: 'Dry goods', keywords: ['pasta', 'sauce', 'rice', 'flour', 'soup'] },
    { id: 'dairy', label: 'Dairy and cheese', keywords: ['milk', 'yoghurt', 'yogurt', 'cheese', 'cream'] },
    { id: 'checkout', label: 'Checkout', keywords: [] }
  ],
  willys: [
    { id: 'produce', label: 'Produce deals', keywords: ['apple', 'banana', 'tomato', 'basil', 'salad', 'potato'] },
    { id: 'pantry', label: 'Value pantry', keywords: ['pasta', 'sauce', 'rice', 'flour', 'soup'] },
    { id: 'dairy', label: 'Dairy fridges', keywords: ['milk', 'yoghurt', 'yogurt', 'cheese', 'cream'] },
    { id: 'drinks', label: 'Bulk drinks', keywords: ['water', 'juice', 'coffee', 'tea', 'soda'] },
    { id: 'checkout', label: 'Checkout', keywords: [] }
  ]
};

export function getStoreLayoutDepartment(itemName: string, chain: StoreLayoutChain = 'ica') {
  const normalized = itemName.toLocaleLowerCase('sv-SE');
  return storeLayoutDepartments[chain].find((department) => department.keywords.some((keyword) => normalized.includes(keyword))) ?? storeLayoutDepartments[chain][storeLayoutDepartments[chain].length - 1];
}

export function storeLayoutDepartmentsForOrder(chain: StoreLayoutChain = 'ica', groupOrder: StoreLayoutGroupOrder = 'store-layout') {
  return groupOrder === 'reverse-layout' ? [...storeLayoutDepartments[chain]].reverse() : storeLayoutDepartments[chain];
}

export function sortItemsByStoreLayout<TItem extends { name: string }>(items: TItem[], chain: StoreLayoutChain = 'ica', groupOrder: StoreLayoutGroupOrder = 'store-layout') {
  const departments = storeLayoutDepartmentsForOrder(chain, groupOrder);
  return [...items].sort((left, right) => {
    const leftDepartment = getStoreLayoutDepartment(left.name, chain);
    const rightDepartment = getStoreLayoutDepartment(right.name, chain);
    const leftIndex = departments.findIndex((department) => department.id === leftDepartment.id);
    const rightIndex = departments.findIndex((department) => department.id === rightDepartment.id);
    return leftIndex - rightIndex || left.name.localeCompare(right.name, 'sv-SE');
  });
}

export type SplitTripBasketItem = {
  id: string;
  name: string;
  prices: Record<string, number>;
};

export type SplitTripStore = {
  id: string;
  label: string;
  routeOrder: number;
  travelCost: number;
};

export type SplitTripPlan = {
  assignments: Array<{ itemId: string; itemName: string; storeId: string; price: number }>;
  effectiveTotal: number;
  mode: 'single-store' | 'split-trip';
  routeLegs: string[];
  savingsVsSingleStore: number;
};

function storeBasketTotal(items: SplitTripBasketItem[], storeId: string) {
  return items.reduce((total, item) => total + (item.prices[storeId] ?? Number.POSITIVE_INFINITY), 0);
}

export function planSplitTrip(
  items: SplitTripBasketItem[],
  stores: SplitTripStore[],
  options: { minimumSavings: number } = { minimumSavings: 0 }
): SplitTripPlan {
  const orderedStores = [...stores].sort((left, right) => left.routeOrder - right.routeOrder || left.label.localeCompare(right.label, 'sv-SE'));
  const singleStore = orderedStores
    .map((store) => ({ store, total: storeBasketTotal(items, store.id) + store.travelCost }))
    .sort((left, right) => left.total - right.total)[0];

  if (!singleStore || !Number.isFinite(singleStore.total)) {
    throw new Error('At least one store must price every basket item.');
  }

  const assignments = items.map((item) => {
    const [storeId, price] = Object.entries(item.prices).sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0], 'sv-SE'))[0];
    return { itemId: item.id, itemName: item.name, storeId, price };
  });
  const usedStoreIds = new Set(assignments.map((assignment) => assignment.storeId));
  const routeLegs = orderedStores.filter((store) => usedStoreIds.has(store.id)).map((store) => store.id);
  const splitTotal = assignments.reduce((total, assignment) => total + assignment.price, 0)
    + orderedStores.filter((store) => usedStoreIds.has(store.id)).reduce((total, store) => total + store.travelCost, 0);
  const savingsVsSingleStore = Number((singleStore.total - splitTotal).toFixed(2));

  if (savingsVsSingleStore < options.minimumSavings) {
    return {
      assignments: items.map((item) => ({ itemId: item.id, itemName: item.name, storeId: singleStore.store.id, price: item.prices[singleStore.store.id] })),
      effectiveTotal: Number(singleStore.total.toFixed(2)),
      mode: 'single-store',
      routeLegs: [singleStore.store.id],
      savingsVsSingleStore: 0
    };
  }

  return {
    assignments,
    effectiveTotal: Number(splitTotal.toFixed(2)),
    mode: 'split-trip',
    routeLegs,
    savingsVsSingleStore
  };
}
