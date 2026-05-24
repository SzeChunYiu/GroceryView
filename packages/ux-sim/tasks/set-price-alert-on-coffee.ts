export type TaskScriptStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionSignals: string[];
};

export type TaskScript = {
  id: string;
  title: string;
  successCriteria: string[];
  steps: TaskScriptStep[];
};

export const setPriceAlertOnCoffeeTask: TaskScript = {
  id: 'set-price-alert-on-coffee',
  title: 'Set a price alert on coffee',
  successCriteria: [
    'User finds a coffee product from browse or search.',
    'User opens the product detail page or alert affordance for that coffee item.',
    'User saves the item to the account-bound watchlist.',
    'User enters or accepts a target price and confirms the alert.',
    'UI shows an alert/watchlist confirmation without exposing another shopper\'s data.'
  ],
  steps: [
    {
      id: 'start-products',
      instruction: 'Start from the home page and navigate to product browsing.',
      expectedAffordance: 'A top-level Products or Shop link is visible in the header or mobile bottom navigation.',
      acceptableVariations: ['Products card on the home page', 'Search field with product suggestions', 'Bottom-nav Products tab'],
      frictionSignals: ['Products label is hidden behind an unclear menu', 'Persona cannot tell if Products means catalog or shopping list']
    },
    {
      id: 'search-coffee',
      instruction: 'Search for coffee.',
      expectedAffordance: 'Product search input accepts “coffee” and returns coffee products or a coffee category.',
      acceptableVariations: ['User types “kaffe” instead of “coffee”', 'User opens Categories then chooses coffee', 'User uses familiar-brand search'],
      frictionSignals: ['No multilingual match for coffee/kaffe', 'Coffee appears only after scrolling past unrelated products']
    },
    {
      id: 'choose-product',
      instruction: 'Choose a concrete coffee product with a visible price.',
      expectedAffordance: 'A product card shows name, brand, current price, source label, and opens a product detail route.',
      acceptableVariations: ['User chooses cheapest coffee', 'User chooses a familiar brand', 'User chooses a product with a price-drop badge'],
      frictionSignals: ['Card lacks enough price confidence to choose', 'Image or brand is missing for all coffee results']
    },
    {
      id: 'open-alert-control',
      instruction: 'Find the save/watchlist/price alert control for the chosen coffee product.',
      expectedAffordance: 'Heart, Save, Watchlist, or Price alert button is visible on the card or product detail page.',
      acceptableVariations: ['Heart opens alert setup', 'Watchlist row exposes alert setup after saving', 'Product page has a dedicated “Set price alert” button'],
      frictionSignals: ['Heart meaning is unclear', 'Alert control appears only after sign-in with no explanation']
    },
    {
      id: 'authenticate-if-needed',
      instruction: 'If prompted, sign in or continue through the account-bound save flow.',
      expectedAffordance: 'Sign-in prompt explains that alerts are account-bound and no anonymous private rows are created.',
      acceptableVariations: ['Existing signed-in session skips this step', 'User lands on Login then returns to product', 'User sees disabled state with sign-in CTA'],
      frictionSignals: ['Prompt loses the selected coffee item', 'Prompt does not explain why sign-in is required']
    },
    {
      id: 'set-target-price',
      instruction: 'Set the target price for the coffee alert.',
      expectedAffordance: 'A target price field, slider, or suggested threshold is shown with SEK currency and current price context.',
      acceptableVariations: ['User accepts suggested target', 'User enters a lower SEK amount manually', 'User selects percent below current price'],
      frictionSignals: ['Currency is not shown', 'Target price accepts invalid values', 'Suggested threshold is above current price without explanation']
    },
    {
      id: 'confirm-alert',
      instruction: 'Confirm the alert.',
      expectedAffordance: 'Primary CTA clearly says Save alert, Create alert, or Add to watchlist.',
      acceptableVariations: ['Confirmation is inline on product page', 'Toast confirms alert', 'User is taken to Watchlist with the new coffee row highlighted'],
      frictionSignals: ['CTA says only Save without alert context', 'No confirmation after click', 'Alert row shows another user\'s data']
    },
    {
      id: 'verify-state',
      instruction: 'Verify the alert can be found later.',
      expectedAffordance: 'Favorites or Watchlist page lists the coffee product, target price, current price, and alert status.',
      acceptableVariations: ['Header heart count increments', 'Account watchlist summary shows alert count', 'Product page button changes to Saved'],
      frictionSignals: ['No path back to alert', 'Target price is hidden after save', 'Saved state disappears on refresh']
    }
  ]
};

export default setPriceAlertOnCoffeeTask;
