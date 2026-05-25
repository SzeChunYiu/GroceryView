import type { TripPlannerOrigin } from '@/hooks/useGeolocation';

export type RouteMode = 'fastest' | 'balanced' | 'accessibility';

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

export type SplitTripBasketItem = {
  id: string;
  name: string;
  quantity: number;
  preferredStorePrices: Record<string, number>;
};

export type SplitTripStore = {
  id: string;
  name: string;
  chain: string;
  latitude: number;
  longitude: number;
  pickupMinutes: number;
};

export type SplitTripPlannerConfig = {
  origin: TripPlannerOrigin;
  basketItems: SplitTripBasketItem[];
  stores: SplitTripStore[];
  costPerKmSek: number;
  valueOfTimeSekPerHour: number;
  averageKph: number;
  minimumNetSavingsSek: number;
};

export type RouteLeg = {
  from: string;
  to: string;
  distanceKm: number;
  travelMinutes: number;
};

export type StoreBasketStop = {
  storeId: string;
  storeName: string;
  chain: string;
  items: string[];
  basketTotalSek: number;
  pickupMinutes: number;
};

export type StoreTripPlan = {
  mode: 'single-store' | 'split-store';
  label: string;
  stores: StoreBasketStop[];
  routeLegs: RouteLeg[];
  shelfTotalSek: number;
  travelDistanceKm: number;
  travelMinutes: number;
  pickupMinutes: number;
  travelCostSek: number;
  timeCostSek: number;
  effectiveTotalSek: number;
  grossShelfSavingsSek: number;
  netSavingsSek: number;
  qualifiesForSplit: boolean;
  explanation: string;
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

const ENTRY_EXIT_METERS = 80;
const METERS_PER_AISLE_STOP = 35;
const METERS_PER_AISLE_GAP = 18;

export function getAisleTraversal(items: TripPlannerItem[], routeMode: RouteMode = 'balanced') {
  const uniqueAisles = Array.from(new Set(items.filter((item) => !item.picked).map((item) => item.aisle))).sort((a, b) => a - b);

  if (routeMode === 'accessibility') {
    return uniqueAisles.sort((a, b) => Math.abs(a - 1) - Math.abs(b - 1) || a - b);
  }

  return uniqueAisles;
}

export function estimateTripCompletion(list: ActiveShoppingList, selectedRouteMode: RouteMode = list.routeMode): TripEstimate {
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
  const pickingMinutes = Math.ceil((remainingItems.length * profile.secondsPerItem) / 60);
  const checkoutMinutes = remainingItems.length === 0 ? 0 : (list.checkoutMinutes ?? 6);
  const estimatedCompletionMinutes = walkingMinutes + pickingMinutes + checkoutMinutes;

  return {
    listId: list.id,
    listName: list.name,
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

const STOCKHOLM_CENTRAL_ORIGIN: TripPlannerOrigin = {
  latitude: 59.3301,
  longitude: 18.0589,
  accuracyMeters: 0,
  label: 'Demo origin: Stockholm Central',
  consented: false
};

const demoSplitTripStores: SplitTripStore[] = [
  {
    id: 'willys-odenplan',
    name: 'Willys Odenplan',
    chain: 'Willys',
    latitude: 59.3433,
    longitude: 18.0496,
    pickupMinutes: 14
  },
  {
    id: 'ica-kungsholmen',
    name: 'ICA Kvantum Kungsholmen',
    chain: 'ICA',
    latitude: 59.3315,
    longitude: 18.0318,
    pickupMinutes: 13
  },
  {
    id: 'coop-vasastan',
    name: 'Coop Vasastan',
    chain: 'Coop',
    latitude: 59.3389,
    longitude: 18.0601,
    pickupMinutes: 12
  }
];

const demoSplitTripBasketItems: SplitTripBasketItem[] = [
  {
    id: 'coffee',
    name: 'Bryggkaffe 450 g',
    quantity: 2,
    preferredStorePrices: {
      'willys-odenplan': 46.9,
      'ica-kungsholmen': 64.9,
      'coop-vasastan': 61.9
    }
  },
  {
    id: 'oat-milk',
    name: 'Havredryck 1 l',
    quantity: 4,
    preferredStorePrices: {
      'willys-odenplan': 18.9,
      'ica-kungsholmen': 13.9,
      'coop-vasastan': 20.9
    }
  },
  {
    id: 'pasta',
    name: 'Pasta 500 g',
    quantity: 3,
    preferredStorePrices: {
      'willys-odenplan': 14.9,
      'ica-kungsholmen': 19.9,
      'coop-vasastan': 8.9
    }
  },
  {
    id: 'cheese',
    name: 'Mellanlagrad ost 700 g',
    quantity: 1,
    preferredStorePrices: {
      'willys-odenplan': 89.9,
      'ica-kungsholmen': 96.9,
      'coop-vasastan': 69.9
    }
  },
  {
    id: 'mince',
    name: 'Vegofars 500 g',
    quantity: 2,
    preferredStorePrices: {
      'willys-odenplan': 44.9,
      'ica-kungsholmen': 29.9,
      'coop-vasastan': 49.9
    }
  }
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: Pick<TripPlannerOrigin | SplitTripStore, 'latitude' | 'longitude'>, to: Pick<TripPlannerOrigin | SplitTripStore, 'latitude' | 'longitude'>) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const startLatitude = toRadians(from.latitude);
  const endLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundDistance(value: number) {
  return Math.round(value * 10) / 10;
}

function buildRouteLeg(fromLabel: string, from: TripPlannerOrigin | SplitTripStore, toLabel: string, to: TripPlannerOrigin | SplitTripStore, averageKph: number): RouteLeg {
  const legDistanceKm = distanceKm(from, to) * 1.28;

  return {
    from: fromLabel,
    to: toLabel,
    distanceKm: roundDistance(legDistanceKm),
    travelMinutes: Math.ceil((legDistanceKm / averageKph) * 60)
  };
}

function buildSingleStorePlan(store: SplitTripStore, config: SplitTripPlannerConfig): StoreTripPlan {
  const items = config.basketItems.map((item) => item.name);
  const shelfTotalSek = config.basketItems.reduce((total, item) => total + (item.preferredStorePrices[store.id] ?? Number.POSITIVE_INFINITY) * item.quantity, 0);
  const outbound = buildRouteLeg(config.origin.label, config.origin, store.name, store, config.averageKph);
  const inbound = buildRouteLeg(store.name, store, config.origin.label, config.origin, config.averageKph);
  const routeLegs = [outbound, inbound];
  const travelDistanceKm = routeLegs.reduce((total, leg) => total + leg.distanceKm, 0);
  const travelMinutes = routeLegs.reduce((total, leg) => total + leg.travelMinutes, 0);
  const pickupMinutes = store.pickupMinutes;
  const travelCostSek = travelDistanceKm * config.costPerKmSek;
  const timeCostSek = ((travelMinutes + pickupMinutes) / 60) * config.valueOfTimeSekPerHour;
  const effectiveTotalSek = shelfTotalSek + travelCostSek + timeCostSek;

  return {
    mode: 'single-store',
    label: `All items at ${store.name}`,
    stores: [
      {
        storeId: store.id,
        storeName: store.name,
        chain: store.chain,
        items,
        basketTotalSek: roundCurrency(shelfTotalSek),
        pickupMinutes
      }
    ],
    routeLegs,
    shelfTotalSek: roundCurrency(shelfTotalSek),
    travelDistanceKm: roundDistance(travelDistanceKm),
    travelMinutes,
    pickupMinutes,
    travelCostSek: roundCurrency(travelCostSek),
    timeCostSek: roundCurrency(timeCostSek),
    effectiveTotalSek: roundCurrency(effectiveTotalSek),
    grossShelfSavingsSek: 0,
    netSavingsSek: 0,
    qualifiesForSplit: true,
    explanation: 'Baseline single-store option for comparing basket, route, and time costs.'
  };
}

function nearestNeighborStoreOrder(stores: SplitTripStore[], origin: TripPlannerOrigin) {
  const remaining = [...stores];
  const ordered: SplitTripStore[] = [];
  let cursor: TripPlannerOrigin | SplitTripStore = origin;

  while (remaining.length > 0) {
    remaining.sort((left, right) => distanceKm(cursor, left) - distanceKm(cursor, right));
    const [nextStore] = remaining.splice(0, 1);
    ordered.push(nextStore);
    cursor = nextStore;
  }

  return ordered;
}

function buildSplitStorePlan(config: SplitTripPlannerConfig, singleStoreBaseline: StoreTripPlan): StoreTripPlan {
  const assignments = new Map<string, StoreBasketStop>();

  config.basketItems.forEach((item) => {
    const bestStore = config.stores
      .filter((store) => Number.isFinite(item.preferredStorePrices[store.id]))
      .sort((left, right) => item.preferredStorePrices[left.id] - item.preferredStorePrices[right.id])[0];

    if (!bestStore) {
      return;
    }

    const currentStop = assignments.get(bestStore.id) ?? {
      storeId: bestStore.id,
      storeName: bestStore.name,
      chain: bestStore.chain,
      items: [],
      basketTotalSek: 0,
      pickupMinutes: bestStore.pickupMinutes
    };

    currentStop.items.push(item.name);
    currentStop.basketTotalSek += item.preferredStorePrices[bestStore.id] * item.quantity;
    assignments.set(bestStore.id, currentStop);
  });

  const assignedStoreIds = new Set(assignments.keys());
  const orderedStores = nearestNeighborStoreOrder(config.stores.filter((store) => assignedStoreIds.has(store.id)), config.origin);
  const routeLegs = orderedStores.reduce<RouteLeg[]>((legs, store, index) => {
    const previous = index === 0 ? config.origin : orderedStores[index - 1];
    const previousLabel = index === 0 ? config.origin.label : orderedStores[index - 1].name;

    return [...legs, buildRouteLeg(previousLabel, previous, store.name, store, config.averageKph)];
  }, []);

  const lastStore = orderedStores.at(-1);
  if (lastStore) {
    routeLegs.push(buildRouteLeg(lastStore.name, lastStore, config.origin.label, config.origin, config.averageKph));
  }

  const stores = orderedStores.map((store) => {
    const stop = assignments.get(store.id);

    return {
      storeId: store.id,
      storeName: store.name,
      chain: store.chain,
      items: stop?.items ?? [],
      basketTotalSek: roundCurrency(stop?.basketTotalSek ?? 0),
      pickupMinutes: store.pickupMinutes
    };
  });
  const shelfTotalSek = stores.reduce((total, stop) => total + stop.basketTotalSek, 0);
  const travelDistanceKm = routeLegs.reduce((total, leg) => total + leg.distanceKm, 0);
  const travelMinutes = routeLegs.reduce((total, leg) => total + leg.travelMinutes, 0);
  const pickupMinutes = stores.reduce((total, stop) => total + stop.pickupMinutes, 0);
  const travelCostSek = travelDistanceKm * config.costPerKmSek;
  const timeCostSek = ((travelMinutes + pickupMinutes) / 60) * config.valueOfTimeSekPerHour;
  const effectiveTotalSek = shelfTotalSek + travelCostSek + timeCostSek;
  const grossShelfSavingsSek = singleStoreBaseline.shelfTotalSek - shelfTotalSek;
  const netSavingsSek = singleStoreBaseline.effectiveTotalSek - effectiveTotalSek;
  const qualifiesForSplit = stores.length > 1 && netSavingsSek >= config.minimumNetSavingsSek;

  return {
    mode: 'split-store',
    label: 'Split basket route',
    stores,
    routeLegs,
    shelfTotalSek: roundCurrency(shelfTotalSek),
    travelDistanceKm: roundDistance(travelDistanceKm),
    travelMinutes,
    pickupMinutes,
    travelCostSek: roundCurrency(travelCostSek),
    timeCostSek: roundCurrency(timeCostSek),
    effectiveTotalSek: roundCurrency(effectiveTotalSek),
    grossShelfSavingsSek: roundCurrency(grossShelfSavingsSek),
    netSavingsSek: roundCurrency(netSavingsSek),
    qualifiesForSplit,
    explanation: qualifiesForSplit
      ? `Split shopping clears the ${config.minimumNetSavingsSek} kr savings threshold after route and time costs.`
      : `Split shopping stays below the ${config.minimumNetSavingsSek} kr savings threshold after route and time costs.`
  };
}

export function planRouteAwareSplitTrip(config: SplitTripPlannerConfig) {
  const singleStorePlans = config.stores.map((store) => buildSingleStorePlan(store, config)).sort((left, right) => left.effectiveTotalSek - right.effectiveTotalSek);
  const bestSingleStorePlan = singleStorePlans[0];
  const splitStorePlan = buildSplitStorePlan(config, bestSingleStorePlan);
  const recommendedPlan = splitStorePlan.qualifiesForSplit ? splitStorePlan : bestSingleStorePlan;

  return {
    origin: config.origin,
    minimumNetSavingsSek: config.minimumNetSavingsSek,
    bestSingleStorePlan,
    singleStorePlans,
    splitStorePlan,
    recommendedPlan,
    plannerInputs: {
      costPerKmSek: config.costPerKmSek,
      valueOfTimeSekPerHour: config.valueOfTimeSekPerHour,
      averageKph: config.averageKph,
      itemCount: config.basketItems.reduce((total, item) => total + item.quantity, 0),
      storeCount: config.stores.length
    }
  };
}

export const routeAwareSplitTripPlanner = planRouteAwareSplitTrip({
  origin: STOCKHOLM_CENTRAL_ORIGIN,
  basketItems: demoSplitTripBasketItems,
  stores: demoSplitTripStores,
  costPerKmSek: 3.2,
  valueOfTimeSekPerHour: 95,
  averageKph: 28,
  minimumNetSavingsSek: 25
});
