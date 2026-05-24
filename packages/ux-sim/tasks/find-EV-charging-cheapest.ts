export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionSignals: string[];
};

export type UxTaskScript = {
  id: string;
  title: string;
  personaScope: 'all-personas';
  successCriteria: string[];
  steps: UxTaskStep[];
};

export const findEvChargingCheapestTask: UxTaskScript = {
  id: 'find-EV-charging-cheapest',
  title: 'Find the cheapest EV charging option',
  personaScope: 'all-personas',
  successCriteria: [
    'Persona can find EV charging or fuel/charging navigation from the home page.',
    'Persona can compare charger prices by provider, speed, and payment channel.',
    'Persona can identify the cheapest viable charger for their route or area.',
    'Persona sees caveats for source freshness, app/member requirements, and unavailable live prices.'
  ],
  steps: [
    {
      id: 'open-charging-surface',
      instruction: 'Start from the home page and navigate to EV charging prices or the fuel/charging area.',
      expectedAffordance: 'Navigation label, card, or search result mentioning EV charging, charging, fuel, or stations.',
      acceptableVariations: ['Fuel page with charging tab', 'Map page with charger filter', 'Search result for charging prices'],
      frictionSignals: ['Charging hidden under unrelated category', 'Fuel-only wording makes EV charging hard to discover', 'Persona leaves the app to search web']
    },
    {
      id: 'set-location-or-route',
      instruction: 'Choose the area or route where the persona needs to charge.',
      expectedAffordance: 'Location input, map region selector, country picker, or current-location affordance.',
      acceptableVariations: ['Country-level fallback', 'Manual city entry', 'Map pan/zoom', 'Saved home/work location'],
      frictionSignals: ['No way to scope results geographically', 'Permission prompt blocks manual search', 'Results do not say which country/currency applies']
    },
    {
      id: 'filter-viable-chargers',
      instruction: 'Filter to chargers that match the persona vehicle and time constraints.',
      expectedAffordance: 'Connector/provider, kW speed, plug/payment channel, member/app requirement, or availability filters.',
      acceptableVariations: ['Fast charger preset', 'Provider chips', 'App vs one-off payment toggle', 'Unavailable prices grouped separately'],
      frictionSignals: ['Cheapest result requires incompatible payment method', 'Speed units missing', 'App/member requirement hidden']
    },
    {
      id: 'compare-cheapest',
      instruction: 'Compare prices and pick the cheapest viable charging row.',
      expectedAffordance: 'Sorted table/card list showing price per kWh, provider, payment channel, and source freshness.',
      acceptableVariations: ['Map pins with price cards', 'List sorted by price', 'Savings badge versus next cheapest'],
      frictionSignals: ['Prices not normalized to per kWh', 'Currency missing', 'Sort order unclear', 'Freshness caveat absent']
    },
    {
      id: 'confirm-next-action',
      instruction: 'Continue with the chosen charger or save/share the result.',
      expectedAffordance: 'Open station details, copy address, route link, save, or share action with the selected price context preserved.',
      acceptableVariations: ['Open external map', 'Copy station/provider details', 'Save to trip plan'],
      frictionSignals: ['Selected row context lost on details page', 'No station/address handoff', 'Share omits app/member caveat']
    }
  ]
};

export default findEvChargingCheapestTask;
