// AUTO-GENERATED from OKQ8 public business fuel price page.
// Source URL: https://www.okq8.se/foretag/priser/
// Retrieved: 2026-05-24T11:15:28.228Z
// Row count: 5 real operator fuel price rows fetched from okq8.se.

export type Okq8FuelPriceIngestedObservation = {
  domain: 'fuel';
  productId: 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  gradeLabel: string;
  chainId: 'okq8';
  operatorName: 'OKQ8';
  sourceKind: 'operator_public_price_page';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'okq8_fuel_prices';
    sourceUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalEffectiveDate: string;
  };
  retrievedAt: string;
};

export const okq8FuelPriceSource = {
  "source": "OKQ8 public business fuel price page",
  "retrievedAt": "2026-05-24T11:15:28.228Z",
  "rowCount": 5,
  "sourceUrl": "https://www.okq8.se/foretag/priser/",
  "parserVersion": "okq8-fuel-prices-v1"
} as const;

export const okq8FuelPriceObservations: Okq8FuelPriceIngestedObservation[] = [
  {
    "domain": "fuel",
    "productId": "fuel-95-e10",
    "fuelGrade": "95",
    "gradeLabel": "95 E10 / Blyfri 95",
    "chainId": "okq8",
    "operatorName": "OKQ8",
    "sourceKind": "operator_public_price_page",
    "sourceUrl": "https://www.okq8.se/foretag/priser/",
    "observedAt": "2026-05-22T00:00:00.000Z",
    "capturedAt": "2026-05-24T11:15:28.228Z",
    "effectiveFrom": "2026-05-22",
    "pricePerLitre": 18.89,
    "currency": "SEK",
    "unit": "l",
    "confidence": 0.85,
    "provenance": {
      "source": "okq8_fuel_prices",
      "sourceUrl": "https://www.okq8.se/foretag/priser/",
      "parserVersion": "okq8-fuel-prices-v1",
      "rawSnapshotRef": "raw://okq8-fuel/okq8-fuel-69099e26",
      "originalTitle": "OKQ8 GoEasy 95 (Blyfri 95)",
      "originalPriceText": "18,89 kr",
      "originalEffectiveDate": "2026-05-22"
    },
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "domain": "fuel",
    "productId": "fuel-98",
    "fuelGrade": "98",
    "gradeLabel": "98 / Blyfri 98",
    "chainId": "okq8",
    "operatorName": "OKQ8",
    "sourceKind": "operator_public_price_page",
    "sourceUrl": "https://www.okq8.se/foretag/priser/",
    "observedAt": "2026-05-22T00:00:00.000Z",
    "capturedAt": "2026-05-24T11:15:28.228Z",
    "effectiveFrom": "2026-05-22",
    "pricePerLitre": 20.49,
    "currency": "SEK",
    "unit": "l",
    "confidence": 0.85,
    "provenance": {
      "source": "okq8_fuel_prices",
      "sourceUrl": "https://www.okq8.se/foretag/priser/",
      "parserVersion": "okq8-fuel-prices-v1",
      "rawSnapshotRef": "raw://okq8-fuel/okq8-fuel-69099e26",
      "originalTitle": "OKQ8 GoEasy 98 (Blyfri 98)",
      "originalPriceText": "20,49 kr",
      "originalEffectiveDate": "2026-05-22"
    },
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "domain": "fuel",
    "productId": "fuel-diesel",
    "fuelGrade": "diesel",
    "gradeLabel": "Diesel",
    "chainId": "okq8",
    "operatorName": "OKQ8",
    "sourceKind": "operator_public_price_page",
    "sourceUrl": "https://www.okq8.se/foretag/priser/",
    "observedAt": "2026-05-21T00:00:00.000Z",
    "capturedAt": "2026-05-24T11:15:28.228Z",
    "effectiveFrom": "2026-05-21",
    "pricePerLitre": 21.34,
    "currency": "SEK",
    "unit": "l",
    "confidence": 0.85,
    "provenance": {
      "source": "okq8_fuel_prices",
      "sourceUrl": "https://www.okq8.se/foretag/priser/",
      "parserVersion": "okq8-fuel-prices-v1",
      "rawSnapshotRef": "raw://okq8-fuel/okq8-fuel-69099e26",
      "originalTitle": "OKQ8 GoEasy Diesel",
      "originalPriceText": "21,34 kr",
      "originalEffectiveDate": "2026-05-21"
    },
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "domain": "fuel",
    "productId": "fuel-hvo100",
    "fuelGrade": "hvo100",
    "gradeLabel": "HVO100",
    "chainId": "okq8",
    "operatorName": "OKQ8",
    "sourceKind": "operator_public_price_page",
    "sourceUrl": "https://www.okq8.se/foretag/priser/",
    "observedAt": "2026-05-21T00:00:00.000Z",
    "capturedAt": "2026-05-24T11:15:28.228Z",
    "effectiveFrom": "2026-05-21",
    "pricePerLitre": 29.89,
    "currency": "SEK",
    "unit": "l",
    "confidence": 0.85,
    "provenance": {
      "source": "okq8_fuel_prices",
      "sourceUrl": "https://www.okq8.se/foretag/priser/",
      "parserVersion": "okq8-fuel-prices-v1",
      "rawSnapshotRef": "raw://okq8-fuel/okq8-fuel-69099e26",
      "originalTitle": "Neste MY Förnybar Diesel (HVO100)",
      "originalPriceText": "29,89 kr",
      "originalEffectiveDate": "2026-05-21"
    },
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "domain": "fuel",
    "productId": "fuel-e85",
    "fuelGrade": "e85",
    "gradeLabel": "E85",
    "chainId": "okq8",
    "operatorName": "OKQ8",
    "sourceKind": "operator_public_price_page",
    "sourceUrl": "https://www.okq8.se/foretag/priser/",
    "observedAt": "2026-05-22T00:00:00.000Z",
    "capturedAt": "2026-05-24T11:15:28.228Z",
    "effectiveFrom": "2026-05-22",
    "pricePerLitre": 15.84,
    "currency": "SEK",
    "unit": "l",
    "confidence": 0.85,
    "provenance": {
      "source": "okq8_fuel_prices",
      "sourceUrl": "https://www.okq8.se/foretag/priser/",
      "parserVersion": "okq8-fuel-prices-v1",
      "rawSnapshotRef": "raw://okq8-fuel/okq8-fuel-69099e26",
      "originalTitle": "Etanol E85",
      "originalPriceText": "15,84 kr",
      "originalEffectiveDate": "2026-05-22"
    },
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  }
];
