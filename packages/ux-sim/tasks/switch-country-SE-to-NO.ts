export type SwitchCountryPersona = 'budget_parent' | 'student' | 'elder' | 'immigrant' | 'power_user';

export type SwitchCountryTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  successSignal: string;
  frictionSignals: string[];
};

export type SwitchCountryTaskScript = {
  id: 'switch-country-SE-to-NO';
  title: string;
  startCountry: 'SE';
  targetCountry: 'NO';
  personas: SwitchCountryPersona[];
  steps: SwitchCountryTaskStep[];
  completionCriteria: string[];
  logFields: string[];
};

export const switchCountrySeToNoTask: SwitchCountryTaskScript = {
  id: 'switch-country-SE-to-NO',
  title: 'Switch GroceryView from Sweden to Norway',
  startCountry: 'SE',
  targetCountry: 'NO',
  personas: ['budget_parent', 'student', 'elder', 'immigrant', 'power_user'],
  steps: [
    {
      id: 'open-country-control',
      instruction: 'From any Sweden-scoped GroceryView page, find and open the country selector.',
      expectedAffordance: 'A header or settings affordance labeled Sverige, SE, country, region, or locale opens a country list.',
      acceptableVariations: [
        'A globe icon opens the same country list.',
        'A settings menu contains a Country or Market row.',
        'Mobile navigation exposes the country selector after opening the menu button.'
      ],
      successSignal: 'The available countries are visible without leaving the current task flow.',
      frictionSignals: [
        'Selector is hidden below the fold.',
        'The current country is displayed only as a flag with no text label.',
        'Opening the selector clears the current basket or search context.'
      ]
    },
    {
      id: 'select-norway',
      instruction: 'Choose Norway as the new country.',
      expectedAffordance: 'A selectable row or option labeled Norge, Norway, NO, or Norwegian market is present.',
      acceptableVariations: [
        'The row uses the Norwegian flag plus readable text.',
        'A searchable combobox accepts Norway and filters to Norge.',
        'The selector groups Nordic countries and Norway is listed under Nordics.'
      ],
      successSignal: 'Norway is selected and the UI shows a pending country-change confirmation or starts navigation.',
      frictionSignals: [
        'Norway is abbreviated without explanation.',
        'The option is disabled with no reason.',
        'The selector closes without visible confirmation.'
      ]
    },
    {
      id: 'confirm-market-change',
      instruction: 'Confirm the switch if the app warns that prices, stores, language, or currency will change.',
      expectedAffordance: 'A confirmation button clearly states Switch to Norway, Continue, or Apply country.',
      acceptableVariations: [
        'No confirmation is required and the app switches immediately.',
        'A non-blocking toast explains the market change after selection.',
        'A modal offers to keep the current language while switching market.'
      ],
      successSignal: 'The simulator can proceed without losing consent-critical context or being trapped in the dialog.',
      frictionSignals: [
        'Primary and secondary buttons have ambiguous labels.',
        'The warning mentions data loss but does not specify what changes.',
        'Keyboard focus does not move into the dialog.'
      ]
    },
    {
      id: 'verify-norway-context',
      instruction: 'Verify the app is now in the Norway market.',
      expectedAffordance: 'Header, URL, store list, currency, or market badge shows Norge, NO, Norwegian stores, or NOK.',
      acceptableVariations: [
        'URL changes from /se to /no.',
        'Country selector now displays Norge or NO.',
        'Price cards show NOK/kr with Norwegian chains such as REMA 1000, Kiwi, or Coop Norge.'
      ],
      successSignal: 'The page is visibly Norway-scoped and no Sweden-only store evidence is presented as current.',
      frictionSignals: [
        'Country label updates but prices/stores remain Sweden-only.',
        'The app navigates to a blank or 404 page.',
        'Mixed SEK/NOK labels appear without explanation.'
      ]
    }
  ],
  completionCriteria: [
    'Every persona can complete the switch from SE to NO.',
    'The simulator records any missing affordance, unclear label, lost context, or mixed-market evidence.',
    'Final state contains a Norway country signal and no current Sweden market badge.'
  ],
  logFields: [
    'persona',
    'step_id',
    'completed',
    'time_to_complete_ms',
    'affordance_found',
    'variation_used',
    'friction_signal',
    'final_country'
  ]
};

export default switchCountrySeToNoTask;
