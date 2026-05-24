// AUTO-GENERATED from St1 public business fuel list price page.
// Source URL: https://st1.se/foretag/listpris
// Retrieved: 2026-05-24T11:15:28.228Z
// Row count: 5 real operator fuel price rows fetched from st1.se.

export type St1FuelPriceIngestedObservation = {
  id: string;
  domain: 'fuel';
  grade: '95' | '98' | 'diesel' | 'HVO100' | 'E85';
  label: string;
  pricePerLitre: number;
  currency: 'SEK';
  litreBasis: 1;
  observedAt: string;
  validFrom: string;
  confidence: number;
  source: {
    id: string;
    kind: 'operator';
    name: string;
    operatorName: string;
    sourceUrl: string;
    legalReviewStatus: 'approved';
  };
  provenance: {
    sourceRunId: string;
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    contentDigest: {
      algorithm: 'sha-256';
      value: string;
    };
  };
  sourceUrl: string;
  retrievedAt: string;
};

export const st1FuelPriceSource = {
  "source": "St1 public business fuel list price page",
  "retrievedAt": "2026-05-24T11:15:28.228Z",
  "rowCount": 5,
  "sourceUrl": "https://st1.se/foretag/listpris",
  "parserVersion": "st1-fuel-listpris-v1"
} as const;

export const st1FuelPriceObservations: St1FuelPriceIngestedObservation[] = [
  {
    "id": "fuel-st1-98-2026-05-23",
    "domain": "fuel",
    "grade": "98",
    "label": "Bensin 98",
    "pricePerLitre": 20.19,
    "currency": "SEK",
    "litreBasis": 1,
    "observedAt": "2026-05-23T22:01:00.000Z",
    "validFrom": "2026-05-23T22:01:00.000Z",
    "confidence": 0.95,
    "source": {
      "id": "st1-business-listpris",
      "kind": "operator",
      "name": "St1 Business listpris",
      "operatorName": "St1 Sverige AB",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "legalReviewStatus": "approved"
    },
    "provenance": {
      "sourceRunId": "st1-fuel-2026-05-23",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "capturedAt": "2026-05-24T11:15:28.228Z",
      "parserVersion": "st1-fuel-listpris-v1",
      "contentDigest": {
        "algorithm": "sha-256",
        "value": "19a95c448acea343fa0c2e2c8821ba354daedbeb6d99dcdb5a1c4d02441cf8bc"
      }
    },
    "sourceUrl": "https://st1.se/foretag/listpris",
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "id": "fuel-st1-95-2026-05-23",
    "domain": "fuel",
    "grade": "95",
    "label": "Bensin 95",
    "pricePerLitre": 18.89,
    "currency": "SEK",
    "litreBasis": 1,
    "observedAt": "2026-05-23T22:01:00.000Z",
    "validFrom": "2026-05-23T22:01:00.000Z",
    "confidence": 0.95,
    "source": {
      "id": "st1-business-listpris",
      "kind": "operator",
      "name": "St1 Business listpris",
      "operatorName": "St1 Sverige AB",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "legalReviewStatus": "approved"
    },
    "provenance": {
      "sourceRunId": "st1-fuel-2026-05-23",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "capturedAt": "2026-05-24T11:15:28.228Z",
      "parserVersion": "st1-fuel-listpris-v1",
      "contentDigest": {
        "algorithm": "sha-256",
        "value": "19a95c448acea343fa0c2e2c8821ba354daedbeb6d99dcdb5a1c4d02441cf8bc"
      }
    },
    "sourceUrl": "https://st1.se/foretag/listpris",
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "id": "fuel-st1-e85-2026-05-23",
    "domain": "fuel",
    "grade": "E85",
    "label": "E85",
    "pricePerLitre": 15.84,
    "currency": "SEK",
    "litreBasis": 1,
    "observedAt": "2026-05-23T22:01:00.000Z",
    "validFrom": "2026-05-23T22:01:00.000Z",
    "confidence": 0.95,
    "source": {
      "id": "st1-business-listpris",
      "kind": "operator",
      "name": "St1 Business listpris",
      "operatorName": "St1 Sverige AB",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "legalReviewStatus": "approved"
    },
    "provenance": {
      "sourceRunId": "st1-fuel-2026-05-23",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "capturedAt": "2026-05-24T11:15:28.228Z",
      "parserVersion": "st1-fuel-listpris-v1",
      "contentDigest": {
        "algorithm": "sha-256",
        "value": "19a95c448acea343fa0c2e2c8821ba354daedbeb6d99dcdb5a1c4d02441cf8bc"
      }
    },
    "sourceUrl": "https://st1.se/foretag/listpris",
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "id": "fuel-st1-diesel-2026-05-23",
    "domain": "fuel",
    "grade": "diesel",
    "label": "Diesel",
    "pricePerLitre": 21.34,
    "currency": "SEK",
    "litreBasis": 1,
    "observedAt": "2026-05-23T22:01:00.000Z",
    "validFrom": "2026-05-23T22:01:00.000Z",
    "confidence": 0.95,
    "source": {
      "id": "st1-business-listpris",
      "kind": "operator",
      "name": "St1 Business listpris",
      "operatorName": "St1 Sverige AB",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "legalReviewStatus": "approved"
    },
    "provenance": {
      "sourceRunId": "st1-fuel-2026-05-23",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "capturedAt": "2026-05-24T11:15:28.228Z",
      "parserVersion": "st1-fuel-listpris-v1",
      "contentDigest": {
        "algorithm": "sha-256",
        "value": "19a95c448acea343fa0c2e2c8821ba354daedbeb6d99dcdb5a1c4d02441cf8bc"
      }
    },
    "sourceUrl": "https://st1.se/foretag/listpris",
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  },
  {
    "id": "fuel-st1-hvo100-2026-05-23",
    "domain": "fuel",
    "grade": "HVO100",
    "label": "HVO100",
    "pricePerLitre": 29.74,
    "currency": "SEK",
    "litreBasis": 1,
    "observedAt": "2026-05-23T22:01:00.000Z",
    "validFrom": "2026-05-23T22:01:00.000Z",
    "confidence": 0.95,
    "source": {
      "id": "st1-business-listpris",
      "kind": "operator",
      "name": "St1 Business listpris",
      "operatorName": "St1 Sverige AB",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "legalReviewStatus": "approved"
    },
    "provenance": {
      "sourceRunId": "st1-fuel-2026-05-23",
      "sourceUrl": "https://st1.se/foretag/listpris",
      "capturedAt": "2026-05-24T11:15:28.228Z",
      "parserVersion": "st1-fuel-listpris-v1",
      "contentDigest": {
        "algorithm": "sha-256",
        "value": "19a95c448acea343fa0c2e2c8821ba354daedbeb6d99dcdb5a1c4d02441cf8bc"
      }
    },
    "sourceUrl": "https://st1.se/foretag/listpris",
    "retrievedAt": "2026-05-24T11:15:28.228Z"
  }
];
