export type PriceCorrectionScriptStep = {
  id: string;
  userAction: string;
  expectedAffordance: string;
  acceptableVariations: readonly string[];
  frictionLog: string;
};

export const submitPriceCorrectionTaskScript = {
  id: 'submit-price-correction',
  title: 'Submit a price correction',
  entryPage: '/products/{productSlug}',
  successCriteria: [
    'Persona can find the report/correct price affordance from a product or price card.',
    'Persona can enter corrected price, store, and evidence without guessing required fields.',
    'Submission ends with a review-state confirmation and a clear next step.'
  ],
  steps: [
    {
      id: 'find-price-to-correct',
      userAction: 'Open a product detail page and identify the stale or incorrect price row.',
      expectedAffordance: 'Price cards show store, unit price, last-seen timestamp, and an obvious report/correct action near the suspect price.',
      acceptableVariations: [
        'A kebab or overflow menu contains Report price as the first or second action.',
        'A dedicated Correct price button appears on each store price row.',
        'Scanner or receipt flows deep-link directly to the same correction form with the product preselected.'
      ],
      frictionLog: 'Log friction if the persona must inspect unrelated menus, cannot tell which store price is being corrected, or the timestamp/source is absent.'
    },
    {
      id: 'open-correction-form',
      userAction: 'Choose the report/correct affordance for the target store price.',
      expectedAffordance: 'A focused form or bottom sheet opens with product name, store, current listed price, and required fields visible above the fold.',
      acceptableVariations: [
        'The correction opens as a modal, drawer, or full page as long as context is preserved.',
        'If launched from a generic report button, the first field may ask the user to select the affected store.',
        'Signed-out users may continue as guest until final submit, where sign-in is optional or clearly justified.'
      ],
      frictionLog: 'Log friction for lost product context, hidden required fields, unexpected sign-in walls, or forms that do not name the affected store.'
    },
    {
      id: 'enter-corrected-price',
      userAction: 'Enter the corrected shelf price and confirm whether it is item price, unit price, or member price.',
      expectedAffordance: 'The price input accepts local currency formatting, validates impossible values inline, and labels item/unit/member-price choices plainly.',
      acceptableVariations: [
        'Currency may be prefilled as SEK and accept comma decimals.',
        'Member price can be a checkbox, segmented control, or price-type dropdown.',
        'Unit price may be auto-calculated when package size is known, provided the user can override it.'
      ],
      frictionLog: 'Log friction for rejected comma decimals, unclear unit-vs-item price labels, no member-price option, or validation shown only after submit.'
    },
    {
      id: 'add-evidence',
      userAction: 'Attach or describe evidence for the correction, such as receipt, shelf photo, flyer, or observation date.',
      expectedAffordance: 'Evidence controls explain accepted proof types, optional versus required status, and privacy handling for uploaded receipt/photo data.',
      acceptableVariations: [
        'Evidence can be uploaded immediately, pasted as a URL, selected from a recent receipt scan, or entered as structured notes.',
        'Observation date may default to today with an editable date picker.',
        'If evidence is optional, the UI still asks for source confidence or reason.'
      ],
      frictionLog: 'Log friction when upload requirements are vague, privacy reassurance is missing, date cannot be corrected, or evidence failure blocks saving without recovery.'
    },
    {
      id: 'review-and-submit',
      userAction: 'Review the correction summary and submit it.',
      expectedAffordance: 'A summary names product, store, old price, corrected price, evidence/source, and review policy before the submit button.',
      acceptableVariations: [
        'Review may be inline at the end of the form instead of a separate step.',
        'Submit copy may say Send correction, Submit for review, or Report price update.',
        'The UI may warn that verified prices update after moderation or confidence checks.'
      ],
      frictionLog: 'Log friction if the persona cannot verify what will be submitted, cannot edit previous fields, or moderation expectations are absent.'
    },
    {
      id: 'confirm-outcome',
      userAction: 'Read the confirmation and decide what to do next.',
      expectedAffordance: 'Confirmation states that the correction was received, indicates pending/accepted status, and offers return-to-product plus optional track/report-another actions.',
      acceptableVariations: [
        'A toast is acceptable only if the corrected price row also shows pending review state.',
        'Anonymous submissions may provide a one-time reference code instead of account tracking.',
        'The product page may optimistically show a pending community correction badge.'
      ],
      frictionLog: 'Log friction for disappearing toasts, no status indicator, no path back to the product, or duplicate-submit uncertainty.'
    }
  ] satisfies readonly PriceCorrectionScriptStep[]
} as const;

export default submitPriceCorrectionTaskScript;
