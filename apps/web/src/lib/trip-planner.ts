export type RouteMode = 'fastest' | 'balanced' | 'accessibility';

export type BudgetCategory = 'produce' | 'dairy' | 'pantry' | 'beverages' | 'household' | 'unassigned';

export type TripPlannerItem = {
  name: string;
  aisle: number;
  quantity?: number;
  picked?: boolean;
  budgetCategory?: BudgetCategory;
  plannedPriceSek?: number;
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

export type BudgetEnvelope = {
  category: BudgetCategory;
  label: string;
  weeklyBudgetSek: number;
  spentThisWeekSek: number;
};

export type BudgetEnvelopeBalance = BudgetEnvelope & {
  remainingBeforeTripSek: number;
  plannedTripSpendSek: number;
  remainingAfterTripSek: number;
  overBudgetSek: number;
  status: 'within-budget' | 'over-budget';
};

export type BudgetEnvelopePlan = {
  listId: string;
  listName: string;
  plannedTripTotalSek: number;
  totalRemainingBeforeTripSek: number;
  totalRemainingAfterTripSek: number;
  overBudgetCategoryCount: number;
  balances: BudgetEnvelopeBalance[];
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
      { name: 'Oat milk', aisle: 2, budgetCategory: 'dairy', plannedPriceSek: 22 },
      { name: 'Greek yoghurt', aisle: 2, budgetCategory: 'dairy', plannedPriceSek: 31 },
      { name: 'Bananas', aisle: 1, budgetCategory: 'produce', plannedPriceSek: 18 },
      { name: 'Pasta sauce', aisle: 6, budgetCategory: 'pantry', plannedPriceSek: 24 },
      { name: 'Coffee filters', aisle: 8, picked: true, budgetCategory: 'household', plannedPriceSek: 35 }
    ]
  },
  {
    id: 'family-dinner',
    name: 'Family dinner',
    routeMode: 'balanced',
    checkoutMinutes: 7,
    items: [
      { name: 'Tomatoes', aisle: 1, budgetCategory: 'produce', plannedPriceSek: 27 },
      { name: 'Fresh basil', aisle: 1, budgetCategory: 'produce', plannedPriceSek: 19 },
      { name: 'Spaghetti', aisle: 6, budgetCategory: 'pantry', plannedPriceSek: 16 },
      { name: 'Parmesan', aisle: 3, budgetCategory: 'dairy', plannedPriceSek: 54 },
      { name: 'Sparkling water', aisle: 9, budgetCategory: 'beverages', plannedPriceSek: 29 }
    ]
  },
  {
    id: 'low-mobility-restock',
    name: 'Low-mobility restock',
    routeMode: 'accessibility',
    checkoutMinutes: 8,
    items: [
      { name: 'Wholegrain bread', aisle: 4, budgetCategory: 'pantry', plannedPriceSek: 34 },
      { name: 'Tea', aisle: 7, budgetCategory: 'beverages', plannedPriceSek: 42 },
      { name: 'Soup', aisle: 6, budgetCategory: 'pantry', plannedPriceSek: 25 },
      { name: 'Apples', aisle: 1, budgetCategory: 'produce', plannedPriceSek: 23 }
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

export const weeklyBudgetEnvelopes: BudgetEnvelope[] = [
  { category: 'produce', label: 'Fruit and vegetables', weeklyBudgetSek: 260, spentThisWeekSek: 188 },
  { category: 'dairy', label: 'Dairy and chilled', weeklyBudgetSek: 210, spentThisWeekSek: 148 },
  { category: 'pantry', label: 'Pantry staples', weeklyBudgetSek: 240, spentThisWeekSek: 126 },
  { category: 'beverages', label: 'Drinks', weeklyBudgetSek: 120, spentThisWeekSek: 84 },
  { category: 'household', label: 'Household', weeklyBudgetSek: 150, spentThisWeekSek: 93 }
];

export function summarizeBudgetEnvelopes(list: ActiveShoppingList, envelopes: BudgetEnvelope[] = weeklyBudgetEnvelopes): BudgetEnvelopePlan {
  const plannedByCategory = list.items.filter((item) => !item.picked).reduce<Record<BudgetCategory, number>>((totals, item) => {
    const category = item.budgetCategory ?? 'unassigned';
    const lineTotal = (item.plannedPriceSek ?? 0) * (item.quantity ?? 1);
    totals[category] = (totals[category] ?? 0) + lineTotal;
    return totals;
  }, {
    produce: 0,
    dairy: 0,
    pantry: 0,
    beverages: 0,
    household: 0,
    unassigned: 0
  });

  const balances = envelopes.map((envelope) => {
    const remainingBeforeTripSek = envelope.weeklyBudgetSek - envelope.spentThisWeekSek;
    const plannedTripSpendSek = plannedByCategory[envelope.category] ?? 0;
    const remainingAfterTripSek = remainingBeforeTripSek - plannedTripSpendSek;
    const overBudgetSek = Math.max(0, -remainingAfterTripSek);

    return {
      ...envelope,
      remainingBeforeTripSek,
      plannedTripSpendSek,
      remainingAfterTripSek,
      overBudgetSek,
      status: overBudgetSek > 0 ? 'over-budget' : 'within-budget'
    } satisfies BudgetEnvelopeBalance;
  });

  return {
    listId: list.id,
    listName: list.name,
    plannedTripTotalSek: balances.reduce((total, balance) => total + balance.plannedTripSpendSek, 0),
    totalRemainingBeforeTripSek: balances.reduce((total, balance) => total + balance.remainingBeforeTripSek, 0),
    totalRemainingAfterTripSek: balances.reduce((total, balance) => total + balance.remainingAfterTripSek, 0),
    overBudgetCategoryCount: balances.filter((balance) => balance.status === 'over-budget').length,
    balances
  };
}

export const activeBudgetEnvelopePlans = activeShoppingLists.map((list) => summarizeBudgetEnvelopes(list));
