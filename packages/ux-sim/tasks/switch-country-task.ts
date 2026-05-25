import type { UxTask } from '../runner.js';

export const switchCountryTask: UxTask = {
  id: 'switch-country-SE-to-NO',
  label: 'Switch country from Sweden to Norway',
  entryPath: '/se/products?currency=NOK&origin=no-border',
  successSignals: ['country switcher visible', 'Norway route reached', 'NOK prices remain visible'],
  steps: [
    ({ note }) => {
      note("Check whether the country switcher is visible before opening navigation; if not, record 'I couldn't find the country switcher'.", 'minor');
    }
  ]
};
