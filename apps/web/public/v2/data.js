/* AUTO-GENERATED from the live GroceryView DB — real Swedish prices. Schema matches the prototype. */
const COUNTRIES = {
 "SE": {
  "code": "SE",
  "name": "Sverige",
  "city": "Stockholm",
  "flag": "🇸🇪",
  "currency": "kr",
  "currencyCode": "SEK",
  "locale": "sv-SE",
  "dec": ","
 },
 "NO": {
  "code": "NO",
  "name": "Norge",
  "city": "Oslo",
  "flag": "🇳🇴",
  "currency": "kr",
  "currencyCode": "NOK",
  "locale": "nb-NO",
  "dec": ","
 },
 "IS": {
  "code": "IS",
  "name": "Ísland",
  "city": "Reykjavík",
  "flag": "🇮🇸",
  "currency": "kr.",
  "currencyCode": "ISK",
  "locale": "is-IS",
  "dec": ","
 }
};
const MUNICIPALITIES = { SE: [
 {
  "name": "Uppsala",
  "region": "",
  "index": 1.157,
  "stores": 3,
  "avgPrice": 64.97,
  "products": 33889
 },
 {
  "name": "Sweden",
  "region": "",
  "index": 1.282,
  "stores": 17,
  "avgPrice": 72.01,
  "products": 33725
 },
 {
  "name": "Stenungsund",
  "region": "",
  "index": 1.213,
  "stores": 1,
  "avgPrice": 68.12,
  "products": 23014
 },
 {
  "name": "Karlstad",
  "region": "",
  "index": 0.733,
  "stores": 2,
  "avgPrice": 41.15,
  "products": 22488
 },
 {
  "name": "Järfälla",
  "region": "",
  "index": 1.237,
  "stores": 1,
  "avgPrice": 69.45,
  "products": 19457
 },
 {
  "name": "Sollentuna",
  "region": "",
  "index": 1.248,
  "stores": 1,
  "avgPrice": 70.09,
  "products": 19456
 },
 {
  "name": "Farsta",
  "region": "",
  "index": 1.378,
  "stores": 1,
  "avgPrice": 77.39,
  "products": 19393
 },
 {
  "name": "Nynäshamn",
  "region": "",
  "index": 1.324,
  "stores": 1,
  "avgPrice": 74.38,
  "products": 18993
 },
 {
  "name": "Löttorp",
  "region": "",
  "index": 1.307,
  "stores": 1,
  "avgPrice": 73.4,
  "products": 18143
 },
 {
  "name": "Goteborg",
  "region": "",
  "index": 0.908,
  "stores": 1,
  "avgPrice": 50.98,
  "products": 13834
 },
 {
  "name": "Orebro",
  "region": "",
  "index": 1.114,
  "stores": 1,
  "avgPrice": 62.54,
  "products": 13374
 },
 {
  "name": "Visby",
  "region": "",
  "index": 0.88,
  "stores": 1,
  "avgPrice": 49.41,
  "products": 12538
 },
 {
  "name": "Sundsvall",
  "region": "",
  "index": 0.844,
  "stores": 1,
  "avgPrice": 47.38,
  "products": 11774
 },
 {
  "name": "Ostersund",
  "region": "",
  "index": 0.808,
  "stores": 1,
  "avgPrice": 45.35,
  "products": 11621
 },
 {
  "name": "Jonkoping",
  "region": "",
  "index": 0.801,
  "stores": 1,
  "avgPrice": 45.01,
  "products": 11521
 },
 {
  "name": "Linkoping",
  "region": "",
  "index": 0.593,
  "stores": 1,
  "avgPrice": 33.32,
  "products": 4790
 },
 {
  "name": "Norrkoping",
  "region": "",
  "index": 0.585,
  "stores": 1,
  "avgPrice": 32.83,
  "products": 4519
 },
 {
  "name": "Svappavaara",
  "region": "",
  "index": 0.655,
  "stores": 1,
  "avgPrice": 36.8,
  "products": 2591
 },
 {
  "name": "Anderstorp",
  "region": "",
  "index": 0.934,
  "stores": 1,
  "avgPrice": 52.45,
  "products": 6
 }
], NO: [], IS: [] };
const SECTORS = {
 "groceries": {
  "id": "groceries",
  "name": "Groceries",
  "nameLocal": {
   "SE": "Mat"
  },
  "emoji": "🛒",
  "items": 60
 },
 "fuel": {
  "id": "fuel",
  "name": "Fuel",
  "nameLocal": {
   "SE": "Drivmedel"
  },
  "emoji": "⛽",
  "items": 6
 },
 "pharmacy": {
  "id": "pharmacy",
  "name": "Pharmacy",
  "nameLocal": {
   "SE": "Apotek"
  },
  "emoji": "💊",
  "items": 40
 },
 "beauty": {
  "id": "beauty",
  "name": "Beauty",
  "nameLocal": {
   "SE": "Skönhet"
  },
  "emoji": "✨",
  "items": 40
 }
};
const CHAINS = {
 "kicks": {
  "id": "kicks",
  "name": "Kicks",
  "short": "K",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(56% 0.20 25)",
  "tier": "national"
 },
 "lyko": {
  "id": "lyko",
  "name": "Lyko",
  "short": "L",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(50% 0.20 25)",
  "tier": "national"
 },
 "okq8": {
  "id": "okq8",
  "name": "OKQ8",
  "short": "O",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(48% 0.18 250)",
  "tier": "national"
 },
 "st1": {
  "id": "st1",
  "name": "St1",
  "short": "S",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(50% 0.16 250)",
  "tier": "national"
 },
 "city_gross": {
  "id": "city_gross",
  "name": "City Gross",
  "short": "CG",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(54% 0.18 35)",
  "tier": "national"
 },
 "coop": {
  "id": "coop",
  "name": "Coop",
  "short": "C",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(52% 0.16 145)",
  "tier": "regional"
 },
 "hemkop": {
  "id": "hemkop",
  "name": "Hemkop",
  "short": "H",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(58% 0.20 60)",
  "tier": "national"
 },
 "ica": {
  "id": "ica",
  "name": "ICA",
  "short": "I",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(50% 0.14 60)",
  "tier": "per_store"
 },
 "lidl": {
  "id": "lidl",
  "name": "Lidl",
  "short": "L",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(54% 0.20 140)",
  "tier": "national"
 },
 "netto": {
  "id": "netto",
  "name": "Netto",
  "short": "N",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(56% 0.20 25)",
  "tier": "national"
 },
 "willys": {
  "id": "willys",
  "name": "Willys",
  "short": "W",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(50% 0.20 25)",
  "tier": "national"
 },
 "apohem": {
  "id": "apohem",
  "name": "Apohem",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(48% 0.18 250)",
  "tier": "national"
 },
 "apotea": {
  "id": "apotea",
  "name": "Apotea",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(50% 0.16 250)",
  "tier": "national"
 },
 "apoteket": {
  "id": "apoteket",
  "name": "Apoteket",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(54% 0.18 35)",
  "tier": "national"
 },
 "apotekhjartat": {
  "id": "apotekhjartat",
  "name": "Apotekhjartat",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(52% 0.16 145)",
  "tier": "national"
 },
 "kronansapotek": {
  "id": "kronansapotek",
  "name": "Kronansapotek",
  "short": "K",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(58% 0.20 60)",
  "tier": "national"
 },
 "meds": {
  "id": "meds",
  "name": "Meds",
  "short": "M",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(50% 0.14 60)",
  "tier": "national"
 }
};
const CATEGORIES = [
 {
  "slug": "grocery",
  "name": "grocery",
  "nameSv": "grocery",
  "emoji": "🛒",
  "count": 58
 },
 {
  "slug": "mjöl",
  "name": "mjöl",
  "nameSv": "mjöl",
  "emoji": "🛒",
  "count": 1
 },
 {
  "slug": "bröd & bageri",
  "name": "bröd & bageri",
  "nameSv": "bröd & bageri",
  "emoji": "🛒",
  "count": 1
 }
];
const GROCERY_PRODUCTS = [
 {
  "slug": "pca18d9a8",
  "name": "Guacamole Dip Mix",
  "size": "",
  "brand": "Santa Maria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 8.99
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 8.99
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 9.36,
    "coop": 9.42,
    "hemkop": 11.3,
    "willys": 8.99,
    "city_gross": 9.4
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99,
   8.99
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p9199795b",
  "name": "Grillchips",
  "size": "",
  "brand": "Estrella",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 9.36
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 9.36
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 9.36,
    "coop": 10.88,
    "hemkop": 11.3,
    "willys": 9.36,
    "city_gross": 10.35
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p74483b4f",
  "name": "Delicatoboll 6x40g",
  "size": "6x40",
  "brand": "Delicato",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 9.36
  },
  "regular": {
   "SE": 25.5
  },
  "low52": {
   "SE": 9.36
  },
  "high52": {
   "SE": 25.5
  },
  "chains": {
   "SE": {
    "ica": 9.36,
    "coop": 18.95,
    "hemkop": 25.5,
    "willys": 18.83,
    "city_gross": 19.5
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p85b7289b",
  "name": "Guldnougat Dubbel",
  "size": "",
  "brand": "Cloetta",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 9.36
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 9.36
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 9.36,
    "coop": 10.36,
    "hemkop": 11.3,
    "willys": 9.36,
    "city_gross": 9.4
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36,
   9.36
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pf0b06ba4",
  "name": "Grönsaksgryta Kyckling & Vitlök Från 8 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 10.88
  },
  "regular": {
   "SE": 15.1
  },
  "low52": {
   "SE": 10.88
  },
  "high52": {
   "SE": 15.1
  },
  "chains": {
   "SE": {
    "ica": 11.14,
    "coop": 15.1,
    "hemkop": 14.14,
    "willys": 10.88,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88,
   10.88
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p799c804e",
  "name": "Gröt Päron Katrinplommon Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pe247177f",
  "name": "Gröt Jordgubb Banan Blåbär Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p0e710aa5",
  "name": "Gröt Päron Aprikos Banan Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p3177144b",
  "name": "Gröt Päron Mango Banan Äpple Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p26484ee8",
  "name": "Gröt Äpple Hallon Banan Blåbär Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p7cb4f0e1",
  "name": "Gröt Äpple Blåbär Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p766e99bf",
  "name": "Gröt Äpple Persika Banan Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p32e96c33",
  "name": "Gröt Äpple Banan Kanel Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.2
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 12.2
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 12.2,
    "coop": 12.26,
    "hemkop": 14.14,
    "willys": 12.2,
    "city_gross": 12.25
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2,
   12.2
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p6b6433ae",
  "name": "Gurksallad",
  "size": "",
  "brand": "Rydbergs",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.77
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 12.77
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.15,
    "coop": 13.72,
    "hemkop": 16.04,
    "willys": 12.77,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77,
   12.77
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pcea0a85b",
  "name": "Gröt Havre Quinoa Äpple Kanel Från 6 Månader",
  "size": "",
  "brand": "Love Made",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.15
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.15
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.15,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.15,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15,
   13.15
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pc8ec28e0",
  "name": "Redd Kyckling Varma Koppen Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p16e372bd",
  "name": "Minestrone Varma Koppen Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p3007f508",
  "name": "Redd Grönsak Varma Koppen Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p98aa6e99",
  "name": "Kantarell Varma Koppen Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p9d16484b",
  "name": "Sparris Varma Koppen Soppa Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p7dff8b22",
  "name": "Ost & Broccoli Varma Koppen Soppa Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.72
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.72
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 14.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72,
   13.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p35024ea4",
  "name": "Gräddkola Klassisk",
  "size": "",
  "brand": "Aroma",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.14
  },
  "regular": {
   "SE": 16.98
  },
  "low52": {
   "SE": 14.14
  },
  "high52": {
   "SE": 16.98
  },
  "chains": {
   "SE": {
    "ica": 14.14,
    "coop": 15.62,
    "hemkop": 16.98,
    "willys": 15.04,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14,
   14.14
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p6874044a",
  "name": "Gröt Passion Banan Kokos 1-3 År",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.66
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.66
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.66,
    "coop": 15.62,
    "hemkop": 16.56,
    "willys": 14.66,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pf41cb9d4",
  "name": "Gröt Persika Banan 1-3 År",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.66
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.66
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.66,
    "coop": 15.62,
    "hemkop": 16.56,
    "willys": 14.66,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pd52a1278",
  "name": "Grönsaks Kycklinggryta M Ris Från 6 Månader",
  "size": "",
  "brand": "Hipp",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.66
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.66
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.66,
    "coop": 16.04,
    "hemkop": 16.56,
    "willys": 14.66,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p7ccc56c6",
  "name": "Gröt Jordgubb Banan 1-3 År",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.66
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.66
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.66,
    "coop": 15.62,
    "hemkop": 16.56,
    "willys": 14.66,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66,
   14.66
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pdfdd3140",
  "name": "Gräddfil & Lök Släta Västkustchips",
  "size": "",
  "brand": "Estrella",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 15.04
  },
  "regular": {
   "SE": 29.29
  },
  "low52": {
   "SE": 15.04
  },
  "high52": {
   "SE": 29.29
  },
  "chains": {
   "SE": {
    "ica": 15.04,
    "coop": 25.51,
    "hemkop": 29.29,
    "willys": 25.45,
    "city_gross": 25.95
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04,
   15.04
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p99bbdf2d",
  "name": "Grönsaker Fisk Ärtor Från 12 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 15.05
  },
  "regular": {
   "SE": 16.98
  },
  "low52": {
   "SE": 15.05
  },
  "high52": {
   "SE": 16.98
  },
  "chains": {
   "SE": {
    "ica": 15.05,
    "coop": 15.1,
    "hemkop": 16.98,
    "willys": 15.61,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "city_gross"
  },
  "sparkline": [
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05,
   15.05
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p7f98cc3c",
  "name": "Grekisk Matyoghurt 10% Familjefavoriter",
  "size": "",
  "brand": "Arla",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 15.9
  },
  "regular": {
   "SE": 20.34
  },
  "low52": {
   "SE": 15.9
  },
  "high52": {
   "SE": 20.34
  },
  "chains": {
   "SE": {
    "ica": 15.95,
    "coop": 16.99,
    "hemkop": 20.34,
    "willys": 15.9,
    "city_gross": 17.5
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9,
   15.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p95fe142b",
  "name": "Grillkorv Hots",
  "size": "",
  "brand": "Lithells",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 16.1
  },
  "regular": {
   "SE": 26.02
  },
  "low52": {
   "SE": 16.1
  },
  "high52": {
   "SE": 26.02
  },
  "chains": {
   "SE": {
    "ica": 26.02,
    "coop": 17.51,
    "hemkop": 17.5,
    "willys": 16.1,
    "city_gross": 17.9
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1,
   16.1
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p04525ca5",
  "name": "Gurkmajonnäs Amerikansk Dressing",
  "size": "",
  "brand": "Kavli",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 16.9
  },
  "regular": {
   "SE": 23.61
  },
  "low52": {
   "SE": 16.9
  },
  "high52": {
   "SE": 23.61
  },
  "chains": {
   "SE": {
    "ica": 16.9,
    "coop": 18.46,
    "hemkop": 23.61,
    "willys": 16.94,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9,
   16.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pb75a450a",
  "name": "Lantmjölk Eko 3,8-4,5%",
  "size": "",
  "brand": "Arla Ko",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.5
  },
  "regular": {
   "SE": 20.77
  },
  "low52": {
   "SE": 17.5
  },
  "high52": {
   "SE": 20.77
  },
  "chains": {
   "SE": {
    "ica": 17.5,
    "coop": 18.46,
    "hemkop": 20.77,
    "willys": 17.5,
    "city_gross": 17.9
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pe9b1fcdc",
  "name": "Grekisk Yoghurt Müsli 7%",
  "size": "",
  "brand": "Arla Ko",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.5
  },
  "regular": {
   "SE": 19.8
  },
  "low52": {
   "SE": 17.5
  },
  "high52": {
   "SE": 19.8
  },
  "chains": {
   "SE": {
    "ica": 17.55,
    "coop": 18.88,
    "hemkop": 18.88,
    "willys": 17.5,
    "city_gross": 19.8
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p366f43d5",
  "name": "Minestrone Soppa Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.5
  },
  "regular": {
   "SE": 18.88
  },
  "low52": {
   "SE": 17.5
  },
  "high52": {
   "SE": 18.88
  },
  "chains": {
   "SE": {
    "ica": 17.88,
    "coop": 18.46,
    "hemkop": 18.88,
    "willys": 17.5,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5,
   17.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pa9891014",
  "name": "Gelésocker Multi Dessertsocker",
  "size": "",
  "brand": "Dansukker",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.88
  },
  "regular": {
   "SE": 22.24
  },
  "low52": {
   "SE": 17.88
  },
  "high52": {
   "SE": 22.24
  },
  "chains": {
   "SE": {
    "ica": 17.93,
    "coop": 20.77,
    "hemkop": 22.24,
    "willys": 17.88,
    "city_gross": 20.75
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p544b4fdf",
  "name": "Lime Max Läsk Pet",
  "size": "",
  "brand": "Pepsi",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.88
  },
  "regular": {
   "SE": 20.77
  },
  "low52": {
   "SE": 17.88
  },
  "high52": {
   "SE": 20.77
  },
  "chains": {
   "SE": {
    "ica": 17.88,
    "coop": 17.93,
    "hemkop": 20.77,
    "willys": 17.88,
    "city_gross": 17.9
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pe41568d5",
  "name": "Garam Masala Indian Spices",
  "size": "",
  "brand": "Santa Maria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.88
  },
  "regular": {
   "SE": 19.83
  },
  "low52": {
   "SE": 17.88
  },
  "high52": {
   "SE": 19.83
  },
  "chains": {
   "SE": {
    "ica": 17.93,
    "coop": 19.83,
    "hemkop": 18.88,
    "willys": 17.88,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pd46a3745",
  "name": "Grahamsgryn",
  "size": "",
  "brand": "Axa",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.88
  },
  "regular": {
   "SE": 23.61
  },
  "low52": {
   "SE": 17.88
  },
  "high52": {
   "SE": 23.61
  },
  "chains": {
   "SE": {
    "ica": 17.93,
    "coop": 19.83,
    "hemkop": 23.61,
    "willys": 17.88,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88,
   17.88
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p2ea4aea4",
  "name": "Golden Oreo Cookies Kakor",
  "size": "",
  "brand": "Oreo",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.93
  },
  "regular": {
   "SE": 21.72
  },
  "low52": {
   "SE": 17.93
  },
  "high52": {
   "SE": 21.72
  },
  "chains": {
   "SE": {
    "ica": 17.93,
    "coop": 18.88,
    "hemkop": 21.72,
    "willys": 18.83,
    "city_gross": 20.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93,
   17.93
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p6ee2b467",
  "name": "Fryspåsar 2l",
  "size": "2l",
  "brand": "Toppits",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 18.95
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.95
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.95,
    "coop": 20.95,
    "hemkop": 23.95,
    "willys": 19.5,
    "city_gross": 18.95
   }
  },
  "cheapest": {
   "SE": "city_gross"
  },
  "sparkline": [
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p81aa77b4",
  "name": "Fryspåsar 3l",
  "size": "3l",
  "brand": "Toppits",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 18.95
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.95
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.95,
    "coop": 20.95,
    "hemkop": 23.95,
    "willys": 19.5,
    "city_gross": 18.95
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p99eb1dd9",
  "name": "Fryspåsar 1l",
  "size": "1l",
  "brand": "Toppits",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 18.95
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.95
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.95,
    "coop": 20.95,
    "hemkop": 23.95,
    "willys": 19.5,
    "city_gross": 18.95
   }
  },
  "cheapest": {
   "SE": "city_gross"
  },
  "sparkline": [
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p56dbfc7e",
  "name": "Fryspåsar 6l",
  "size": "6l",
  "brand": "Toppits",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 18.95
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.95
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.95,
    "coop": 20.95,
    "hemkop": 23.95,
    "willys": 19.5,
    "city_gross": 18.95
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95,
   18.95
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "ped39f0e2",
  "name": "Lätt Naturell Yoghurt Laktosfri 0,4%",
  "size": "",
  "brand": "Valio",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 19.4
  },
  "regular": {
   "SE": 21.72
  },
  "low52": {
   "SE": 19.4
  },
  "high52": {
   "SE": 21.72
  },
  "chains": {
   "SE": {
    "ica": 19.4,
    "coop": 19.45,
    "hemkop": 21.72,
    "willys": 19.5,
    "city_gross": 19.8
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4,
   19.4
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p612e5cb3",
  "name": "Gräddnougat Chokladkaka",
  "size": "",
  "brand": "Marabou",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 19.5
  },
  "regular": {
   "SE": 26.45
  },
  "low52": {
   "SE": 19.5
  },
  "high52": {
   "SE": 26.45
  },
  "chains": {
   "SE": {
    "ica": 22.66,
    "coop": 23.19,
    "hemkop": 26.45,
    "willys": 19.5,
    "city_gross": 23.6
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5,
   19.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p47cd7fa7",
  "name": "Glutenfritt Pofiber",
  "size": "",
  "brand": "Schär",
  "category": "mjöl",
  "emoji": "🛒",
  "price": {
   "SE": 19.83
  },
  "regular": {
   "SE": 24.55
  },
  "low52": {
   "SE": 19.83
  },
  "high52": {
   "SE": 24.55
  },
  "chains": {
   "SE": {
    "ica": 20.72,
    "coop": 19.83,
    "hemkop": 24.55,
    "willys": 21.67,
    "city_gross": 21.7
   }
  },
  "cheapest": {
   "SE": "coop"
  },
  "sparkline": [
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83,
   19.83
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pe623fe84",
  "name": "Latte Art Mjölk Eko 2,6%",
  "size": "",
  "brand": "Arla",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 20.72
  },
  "regular": {
   "SE": 24.55
  },
  "low52": {
   "SE": 20.72
  },
  "high52": {
   "SE": 24.55
  },
  "chains": {
   "SE": {
    "ica": 20.77,
    "coop": 21.72,
    "hemkop": 24.55,
    "willys": 20.72,
    "city_gross": 21.7
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72,
   20.72
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p72c8259b",
  "name": "Garlic Salsa Medium",
  "size": "",
  "brand": "Santa Maria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 20.77
  },
  "regular": {
   "SE": 25.08
  },
  "low52": {
   "SE": 20.77
  },
  "high52": {
   "SE": 25.08
  },
  "chains": {
   "SE": {
    "ica": 20.77,
    "coop": 23.61,
    "hemkop": 25.08,
    "willys": 21.67,
    "city_gross": 22.65
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77,
   20.77
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p3ce8c1ef",
  "name": "Gräslök Light 11%",
  "size": "",
  "brand": "Philadelphia",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 21.25
  },
  "regular": {
   "SE": 22.66
  },
  "low52": {
   "SE": 21.25
  },
  "high52": {
   "SE": 22.66
  },
  "chains": {
   "SE": {
    "ica": 21.25,
    "coop": 21.29,
    "hemkop": 22.66,
    "willys": 21.29,
    "city_gross": 21.7
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25,
   21.25
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pcbace2b2",
  "name": "Guldkorn",
  "size": "",
  "brand": "PÅGEN",
  "category": "bröd & bageri",
  "emoji": "🛒",
  "price": {
   "SE": 21.67
  },
  "regular": {
   "SE": 25.5
  },
  "low52": {
   "SE": 21.67
  },
  "high52": {
   "SE": 25.5
  },
  "chains": {
   "SE": {
    "ica": 21.67,
    "coop": 22.24,
    "hemkop": 25.5,
    "willys": 25.45,
    "city_gross": 22.65
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67,
   21.67
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p09fd123c",
  "name": "Gelatinpulver",
  "size": "",
  "brand": "Dr Oetker",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 22.61
  },
  "regular": {
   "SE": 24.56
  },
  "low52": {
   "SE": 22.61
  },
  "high52": {
   "SE": 24.56
  },
  "chains": {
   "SE": {
    "ica": 22.66,
    "coop": 24.56,
    "hemkop": 24.55,
    "willys": 22.61,
    "city_gross": 24.55
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61,
   22.61
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p8c93214e",
  "name": "Grönsaker Ärtor Majs Paprika Fryst",
  "size": "",
  "brand": "Apetit",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 22.9
  },
  "regular": {
   "SE": 26.45
  },
  "low52": {
   "SE": 22.9
  },
  "high52": {
   "SE": 26.45
  },
  "chains": {
   "SE": {
    "ica": 22.95,
    "coop": 26.03,
    "hemkop": 26.45,
    "willys": 22.9,
    "city_gross": 25.5
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9,
   22.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p4259375e",
  "name": "Guldsalami",
  "size": "",
  "brand": "Grilstad",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 23.56
  },
  "regular": {
   "SE": 27.4
  },
  "low52": {
   "SE": 23.56
  },
  "high52": {
   "SE": 27.4
  },
  "chains": {
   "SE": {
    "ica": 24.13,
    "coop": 27.4,
    "hemkop": 25.5,
    "willys": 23.56,
    "city_gross": 23.6
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p3d3e7e31",
  "name": "Lemon Lime No Sugar Blanddryck Pet",
  "size": "",
  "brand": "Zeroh",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 23.56
  },
  "regular": {
   "SE": 30.23
  },
  "low52": {
   "SE": 23.56
  },
  "high52": {
   "SE": 30.23
  },
  "chains": {
   "SE": {
    "ica": 24.55,
    "coop": 26.45,
    "hemkop": 30.23,
    "willys": 23.56,
    "city_gross": 26
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56,
   23.56
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p46728fcf",
  "name": "Avfallspåse med Dragsnöre 35l",
  "size": "35l",
  "brand": "Ninjaplast",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 23.9
  },
  "regular": {
   "SE": 25.95
  },
  "low52": {
   "SE": 23.9
  },
  "high52": {
   "SE": 25.95
  },
  "chains": {
   "SE": {
    "ica": 24.9,
    "coop": 25.95,
    "hemkop": 24.95,
    "willys": 23.9,
    "city_gross": 24.95
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9,
   23.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pc1434779",
  "name": "Gårdsgoda Normalsaltat Smör & Raps 75%",
  "size": "",
  "brand": "Valio",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 24.9
  },
  "regular": {
   "SE": 28.34
  },
  "low52": {
   "SE": 24.9
  },
  "high52": {
   "SE": 28.34
  },
  "chains": {
   "SE": {
    "ica": 25.45,
    "coop": 28.34,
    "hemkop": 27.39,
    "willys": 24.9,
    "city_gross": 27.35
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pf50643f9",
  "name": "Stekpåse 5kg Stor",
  "size": "5kg",
  "brand": "Toppits",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 24.9
  },
  "regular": {
   "SE": 29.95
  },
  "low52": {
   "SE": 24.9
  },
  "high52": {
   "SE": 29.95
  },
  "chains": {
   "SE": {
    "ica": 24.95,
    "coop": 26.95,
    "hemkop": 26.95,
    "willys": 24.9,
    "city_gross": 29.95
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9,
   24.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pa7647407",
  "name": "Lemonade",
  "size": "",
  "brand": "God Morgon",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 25.45
  },
  "regular": {
   "SE": 28.35
  },
  "low52": {
   "SE": 25.45
  },
  "high52": {
   "SE": 28.35
  },
  "chains": {
   "SE": {
    "ica": 25.45,
    "coop": 28.35,
    "hemkop": 28.34,
    "willys": 25.45,
    "city_gross": 28.3
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45,
   25.45
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p99f1ee9c",
  "name": "Grillkrydda Original Burk",
  "size": "",
  "brand": "Santa Maria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 26.4
  },
  "regular": {
   "SE": 28.35
  },
  "low52": {
   "SE": 26.4
  },
  "high52": {
   "SE": 28.35
  },
  "chains": {
   "SE": {
    "ica": 26.45,
    "coop": 28.35,
    "hemkop": 28.34,
    "willys": 26.4,
    "city_gross": 28.3
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p50e75583",
  "name": "Gammeldags Tunnbröd",
  "size": "",
  "brand": "Mjälloms",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 26.4
  },
  "regular": {
   "SE": 30.23
  },
  "low52": {
   "SE": 26.4
  },
  "high52": {
   "SE": 30.23
  },
  "chains": {
   "SE": {
    "ica": 26.45,
    "coop": 28.35,
    "hemkop": 30.23,
    "willys": 26.4,
    "city_gross": 30.2
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4,
   26.4
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 }
];
const FUEL_PRODUCTS = [
 {
  "slug": "fuel-e85",
  "name": "E85",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 15.84
  },
  "low52": {
   "SE": 15.84
  },
  "high52": {
   "SE": 15.84
  },
  "sparkline": [
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84,
   15.84
  ],
  "sector": "fuel"
 },
 {
  "slug": "fuel-95-e10-blyfri-95",
  "name": "95 E10 / Blyfri 95",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 18.89
  },
  "low52": {
   "SE": 18.89
  },
  "high52": {
   "SE": 18.89
  },
  "sparkline": [
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89,
   18.89
  ],
  "sector": "fuel"
 },
 {
  "slug": "fuel-fuel-undefined",
  "name": "Fuel undefined",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 20.19
  },
  "low52": {
   "SE": 20.19
  },
  "high52": {
   "SE": 20.19
  },
  "sparkline": [
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19,
   20.19
  ],
  "sector": "fuel"
 },
 {
  "slug": "fuel-98-blyfri-98",
  "name": "98 / Blyfri 98",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 20.49
  },
  "low52": {
   "SE": 20.49
  },
  "high52": {
   "SE": 20.49
  },
  "sparkline": [
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49,
   20.49
  ],
  "sector": "fuel"
 },
 {
  "slug": "fuel-diesel",
  "name": "Diesel",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 21.34
  },
  "low52": {
   "SE": 21.34
  },
  "high52": {
   "SE": 21.34
  },
  "sparkline": [
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34,
   21.34
  ],
  "sector": "fuel"
 },
 {
  "slug": "fuel-hvo100",
  "name": "HVO100",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 29.89
  },
  "low52": {
   "SE": 29.89
  },
  "high52": {
   "SE": 29.89
  },
  "sparkline": [
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89,
   29.89
  ],
  "sector": "fuel"
 }
];
const PHARMACY_PRODUCTS = [
 {
  "slug": "p4057ae2e",
  "name": "Libresse Freshness & Protection Ultra Long Wing 12 st",
  "size": "12 st",
  "brand": "Libresse",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 27
  },
  "regular": {
   "SE": 35
  },
  "low52": {
   "SE": 27
  },
  "high52": {
   "SE": 35
  },
  "chains": {
   "SE": {
    "meds": 34,
    "apohem": 35,
    "apotea": 27,
    "apoteket": 35,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pf78dfa75",
  "name": "Oral-B Essential Floss Tandtråd Mint 50 m 1 st",
  "size": "1 st",
  "brand": "Oral-B",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 29
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 29
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "meds": 30,
    "apohem": 30,
    "apotea": 29,
    "apoteket": 39,
    "apotekhjartat": 30
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pc0aeb558",
  "name": "Neutrogena Unscented Hand Cream 50 ml",
  "size": "50 ml",
  "brand": "Neutrogena",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 33
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 33
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 49,
    "apohem": 35,
    "apotea": 33,
    "apoteket": 45,
    "apotekhjartat": 44
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33,
   33
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p00a3277a",
  "name": "Lactacyd Duschcreme Utan Parfym 250 ml",
  "size": "250 ml",
  "brand": "Lactacyd",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 37
  },
  "regular": {
   "SE": 45
  },
  "low52": {
   "SE": 37
  },
  "high52": {
   "SE": 45
  },
  "chains": {
   "SE": {
    "meds": 39,
    "apohem": 45,
    "apotea": 45,
    "apoteket": 45,
    "apotekhjartat": 37
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37,
   37
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p43173e9b",
  "name": "Resorb Vätskeersättning Sport 10 portionspåsar",
  "size": "10 p",
  "brand": "Resorb",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 49.6
  },
  "regular": {
   "SE": 62
  },
  "low52": {
   "SE": 49.6
  },
  "high52": {
   "SE": 62
  },
  "chains": {
   "SE": {
    "meds": 50,
    "apohem": 50,
    "apotea": 50,
    "apoteket": 62,
    "apotekhjartat": 49.6
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6,
   49.6
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p490a67cf",
  "name": "Semper Vätskeersättning & Bakteriekultur 38,5 g",
  "size": "38,5 g",
  "brand": "Semper",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 80
  },
  "regular": {
   "SE": 104
  },
  "low52": {
   "SE": 80
  },
  "high52": {
   "SE": 104
  },
  "chains": {
   "SE": {
    "meds": 103,
    "apohem": 104,
    "apotea": 82,
    "apoteket": 95,
    "apotekhjartat": 80
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80,
   80
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pb2e0daa4",
  "name": "A-Creme Oparfymerad Original 120 g",
  "size": "120 g",
  "brand": "A-creme",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 105
  },
  "regular": {
   "SE": 105
  },
  "low52": {
   "SE": 105
  },
  "high52": {
   "SE": 105
  },
  "chains": {
   "SE": {
    "meds": 105,
    "apohem": 105,
    "apotea": 105,
    "apoteket": 105,
    "apotekhjartat": 105
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105,
   105
  ],
  "confidence": "high",
  "verdict": "hold",
  "sector": "pharmacy"
 },
 {
  "slug": "p0daaff52",
  "name": "Daxxín Balsam Conditioner 200 ml",
  "size": "200 ml",
  "brand": "Daxxin",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 119
  },
  "regular": {
   "SE": 119
  },
  "low52": {
   "SE": 119
  },
  "high52": {
   "SE": 119
  },
  "chains": {
   "SE": {
    "meds": 119,
    "apohem": 119,
    "apotea": 119,
    "apoteket": 119,
    "apotekhjartat": 119
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119,
   119
  ],
  "confidence": "high",
  "verdict": "hold",
  "sector": "pharmacy"
 },
 {
  "slug": "p774485bd",
  "name": "Helhetshälsa B-vitamin Komplex 100 kapslar",
  "size": "100 kapslar",
  "brand": "Helhetshälsa",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 128
  },
  "regular": {
   "SE": 159
  },
  "low52": {
   "SE": 128
  },
  "high52": {
   "SE": 159
  },
  "chains": {
   "SE": {
    "meds": 150,
    "apohem": 150,
    "apotea": 128,
    "apoteket": 159,
    "apotekhjartat": 150
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128,
   128
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p70995ad3",
  "name": "Movicol Pulver till oral lösning 20 dospåsar",
  "size": "",
  "brand": "Movicol",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 155
  },
  "regular": {
   "SE": 159
  },
  "low52": {
   "SE": 155
  },
  "high52": {
   "SE": 159
  },
  "chains": {
   "SE": {
    "meds": 155,
    "apohem": 155,
    "apotea": 155,
    "apoteket": 159,
    "apotekhjartat": 155
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155,
   155
  ],
  "confidence": "high",
  "verdict": "hold",
  "sector": "pharmacy"
 },
 {
  "slug": "p748d4b20",
  "name": "Great Earth B-Complex 100mg 60 tabletter",
  "size": "60 tabletter",
  "brand": "Great Earth",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 171
  },
  "regular": {
   "SE": 213
  },
  "low52": {
   "SE": 171
  },
  "high52": {
   "SE": 213
  },
  "chains": {
   "SE": {
    "meds": 171,
    "apohem": 213,
    "apotea": 213,
    "apoteket": 209,
    "apotekhjartat": 213
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171,
   171
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p247771dc",
  "name": "EVY Solskyddsmousse SPF 30 150 ml",
  "size": "150 ml",
  "brand": "EVY",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 180.75
  },
  "regular": {
   "SE": 249
  },
  "low52": {
   "SE": 180.75
  },
  "high52": {
   "SE": 249
  },
  "chains": {
   "SE": {
    "meds": 187,
    "apohem": 249,
    "apotea": 186,
    "apoteket": 249,
    "apotekhjartat": 180.75
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75,
   180.75
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pfca765e0",
  "name": "Loratadin Orifarm 10mg 14 tabletter",
  "size": "14 tabletter",
  "brand": "Orifarm",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 10
  },
  "regular": {
   "SE": 13
  },
  "low52": {
   "SE": 10
  },
  "high52": {
   "SE": 13
  },
  "chains": {
   "SE": {
    "meds": 13,
    "apohem": 10,
    "apotea": 11,
    "apoteket": 13
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10,
   10
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p670235eb",
  "name": "Loratadin Orifarm 10 mg Loratadin 30 tabletter",
  "size": "30 tabletter",
  "brand": "Orifarm",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 15
  },
  "regular": {
   "SE": 19
  },
  "low52": {
   "SE": 15
  },
  "high52": {
   "SE": 19
  },
  "chains": {
   "SE": {
    "meds": 15,
    "apohem": 15,
    "apotea": 15,
    "apoteket": 19
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p045a9789",
  "name": "Vialerg 10 mg Cetrizin 30 tabletter",
  "size": "30 tabletter",
  "brand": "Vialerg",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 15
  },
  "regular": {
   "SE": 19
  },
  "low52": {
   "SE": 15
  },
  "high52": {
   "SE": 19
  },
  "chains": {
   "SE": {
    "meds": 15,
    "apohem": 15,
    "apotea": 15,
    "apoteket": 19
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15,
   15
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pf1c9debc",
  "name": "Lindroos Druvsocker Tropisk Mix 75 g",
  "size": "75 g",
  "brand": "Lindroos",
  "category": "hjälpmedel & tillbehör > diabetes > veganskt",
  "emoji": "💊",
  "price": {
   "SE": 16
  },
  "regular": {
   "SE": 22
  },
  "low52": {
   "SE": 16
  },
  "high52": {
   "SE": 22
  },
  "chains": {
   "SE": {
    "meds": 16,
    "apotea": 21,
    "apoteket": 22,
    "apotekhjartat": 20
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16,
   16
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p0e496d4b",
  "name": "TePe Special Care Ultra Soft Tandborste 1-pack",
  "size": "",
  "brand": "TePe",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 20
  },
  "regular": {
   "SE": 25
  },
  "low52": {
   "SE": 20
  },
  "high52": {
   "SE": 25
  },
  "chains": {
   "SE": {
    "apohem": 20,
    "apotea": 25,
    "apoteket": 25,
    "apotekhjartat": 25
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p43954667",
  "name": "Jordan Step Tandborste 0-2 år",
  "size": "",
  "brand": "Jordan",
  "category": "barn & förälder > tandborstar > tandvård för barn",
  "emoji": "💊",
  "price": {
   "SE": 20
  },
  "regular": {
   "SE": 25
  },
  "low52": {
   "SE": 20
  },
  "high52": {
   "SE": 25
  },
  "chains": {
   "SE": {
    "meds": 20,
    "apotea": 25,
    "apoteket": 22,
    "apotekhjartat": 22
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20,
   20
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p5c19d7ae",
  "name": "Nueva Sunstick SPF30 För Läpparna 15 g",
  "size": "15 g",
  "brand": "Nueva",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 21
  },
  "regular": {
   "SE": 29
  },
  "low52": {
   "SE": 21
  },
  "high52": {
   "SE": 29
  },
  "chains": {
   "SE": {
    "apohem": 28,
    "apotea": 21,
    "apoteket": 29,
    "apotekhjartat": 26
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21,
   21
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p15af5d54",
  "name": "Jordan Step Tandborste 3-5 år 1 st",
  "size": "1 st",
  "brand": "Jordan",
  "category": "barn & förälder > mun & tänder > tandborstar > tandvård för barn",
  "emoji": "💊",
  "price": {
   "SE": 22
  },
  "regular": {
   "SE": 29
  },
  "low52": {
   "SE": 22
  },
  "high52": {
   "SE": 29
  },
  "chains": {
   "SE": {
    "meds": 22,
    "apotea": 27,
    "apoteket": 29,
    "apotekhjartat": 27
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p6aa574d7",
  "name": "Klöver Vaseline 40 g",
  "size": "40 g",
  "brand": "Vaseline",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 22
  },
  "regular": {
   "SE": 25
  },
  "low52": {
   "SE": 22
  },
  "high52": {
   "SE": 25
  },
  "chains": {
   "SE": {
    "apohem": 25,
    "apotea": 22,
    "apoteket": 25,
    "apotekhjartat": 22
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22,
   22
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pad449285",
  "name": "Libresse Binda Ultra+ med vingar 14st",
  "size": "14st",
  "brand": "Libresse",
  "category": "intimvård > mens > bindor",
  "emoji": "💊",
  "price": {
   "SE": 26
  },
  "regular": {
   "SE": 35
  },
  "low52": {
   "SE": 26
  },
  "high52": {
   "SE": 35
  },
  "chains": {
   "SE": {
    "meds": 33,
    "apotea": 26,
    "apoteket": 33,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pa7872a2c",
  "name": "OB ProComfort Super Plus 16 st",
  "size": "16 st",
  "brand": "O.b",
  "category": "intimvård > mens > tamponger > riklig mens",
  "emoji": "💊",
  "price": {
   "SE": 26
  },
  "regular": {
   "SE": 37
  },
  "low52": {
   "SE": 26
  },
  "high52": {
   "SE": 37
  },
  "chains": {
   "SE": {
    "meds": 37,
    "apotea": 26,
    "apoteket": 32,
    "apotekhjartat": 32
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pc8d7b57a",
  "name": "OB ProComfort Super 16 st",
  "size": "16 st",
  "brand": "O.b",
  "category": "intimvård > mens > tamponger > riklig mens",
  "emoji": "💊",
  "price": {
   "SE": 26
  },
  "regular": {
   "SE": 36
  },
  "low52": {
   "SE": 26
  },
  "high52": {
   "SE": 36
  },
  "chains": {
   "SE": {
    "meds": 36,
    "apotea": 26,
    "apoteket": 35,
    "apotekhjartat": 32
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pff9f129a",
  "name": "OB ProComfort Normal 16 st",
  "size": "16 st",
  "brand": "O.b",
  "category": "intimvård > mens > tamponger > meds tipsar! > hundra under 100:-",
  "emoji": "💊",
  "price": {
   "SE": 26
  },
  "regular": {
   "SE": 36
  },
  "low52": {
   "SE": 26
  },
  "high52": {
   "SE": 36
  },
  "chains": {
   "SE": {
    "meds": 36,
    "apotea": 26,
    "apoteket": 35,
    "apotekhjartat": 32
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "paff2b52b",
  "name": "The Humble Co. Pro Humble Brush plant based 7k bristles ultra soft black",
  "size": "",
  "brand": "The Humble Co.",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 26
  },
  "regular": {
   "SE": 35
  },
  "low52": {
   "SE": 26
  },
  "high52": {
   "SE": 35
  },
  "chains": {
   "SE": {
    "meds": 27,
    "apohem": 26,
    "apoteket": 35,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26,
   26
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pe7b5c41c",
  "name": "Libresse Binda Ultra+ utan vingar 16 st",
  "size": "16 st",
  "brand": "Libresse",
  "category": "intimvård > mens > bindor",
  "emoji": "💊",
  "price": {
   "SE": 27
  },
  "regular": {
   "SE": 35
  },
  "low52": {
   "SE": 27
  },
  "high52": {
   "SE": 35
  },
  "chains": {
   "SE": {
    "meds": 34,
    "apotea": 27,
    "apoteket": 34,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p8bd7011e",
  "name": "o.b ProComfort Mini 16 st",
  "size": "16 st",
  "brand": "o.b",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 27
  },
  "regular": {
   "SE": 36
  },
  "low52": {
   "SE": 27
  },
  "high52": {
   "SE": 36
  },
  "chains": {
   "SE": {
    "meds": 36,
    "apohem": 36,
    "apotea": 27,
    "apoteket": 35
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27,
   27
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p1521a8f3",
  "name": "Sensodyne Original Tandkräm 75 ml",
  "size": "75 ml",
  "brand": "Sensodyne",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 28
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 28
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "apohem": 39,
    "apotea": 28,
    "apoteket": 35,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28,
   28
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p85d2fef2",
  "name": "SB12 Duo 0,2% Munskölj 50 ml",
  "size": "50 ml",
  "brand": "SB12",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 29
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 29
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "meds": 29,
    "apohem": 36,
    "apotea": 36,
    "apoteket": 39
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "p6fb34b15",
  "name": "Micropore kirurgisk tejp vit",
  "size": "",
  "brand": "Micropore",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 29
  },
  "regular": {
   "SE": 30.5
  },
  "low52": {
   "SE": 29
  },
  "high52": {
   "SE": 30.5
  },
  "chains": {
   "SE": {
    "meds": 29,
    "apohem": 29,
    "apotea": 29,
    "apoteket": 30.5
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29,
   29
  ],
  "confidence": "high",
  "verdict": "hold",
  "sector": "pharmacy"
 },
 {
  "slug": "p410f2ee3",
  "name": "Mölnlycke Health Care Tubifast 2 Way Stretch Blue Line 1 m",
  "size": "",
  "brand": "Mölnlycke Health Care",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 32
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 32
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "meds": 32,
    "apohem": 39,
    "apotea": 32,
    "apoteket": 39
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pc96f5d58",
  "name": "Neutrogena Norwegian Formula Concentrated Hand Cream 50 ml",
  "size": "50 ml",
  "brand": "Neutrogena",
  "category": "händer & fötter > handkräm > dermatologisk hudvård",
  "emoji": "💊",
  "price": {
   "SE": 34
  },
  "regular": {
   "SE": 46
  },
  "low52": {
   "SE": 34
  },
  "high52": {
   "SE": 46
  },
  "chains": {
   "SE": {
    "meds": 46,
    "apotea": 34,
    "apoteket": 45,
    "apotekhjartat": 44
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pbcac3386",
  "name": "Oral-B 3D White Luxe Perfection 75 ml",
  "size": "75 ml",
  "brand": "Oral-B",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 34
  },
  "regular": {
   "SE": 35
  },
  "low52": {
   "SE": 34
  },
  "high52": {
   "SE": 35
  },
  "chains": {
   "SE": {
    "meds": 34,
    "apohem": 34,
    "apoteket": 35,
    "apotekhjartat": 34
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34
  ],
  "confidence": "high",
  "verdict": "hold",
  "sector": "pharmacy"
 },
 {
  "slug": "p51f95831",
  "name": "Nestlé OptiXpress Katrinplommonjuice 200 ml",
  "size": "200 ml",
  "brand": "Nestlé",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 34
  },
  "regular": {
   "SE": 37
  },
  "low52": {
   "SE": 34
  },
  "high52": {
   "SE": 37
  },
  "chains": {
   "SE": {
    "meds": 34,
    "apohem": 34,
    "apoteket": 37,
    "apotekhjartat": 35
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pd577baec",
  "name": "Sensodyne Repair & Protect Extra Soft Tandborste 1 st",
  "size": "1 st",
  "brand": "Sensodyne",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 35
  },
  "regular": {
   "SE": 37
  },
  "low52": {
   "SE": 35
  },
  "high52": {
   "SE": 37
  },
  "chains": {
   "SE": {
    "meds": 35,
    "apohem": 35,
    "apoteket": 35,
    "apotekhjartat": 37
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pbe2df0d4",
  "name": "Ipren 200mg Ibuprofen 30 tabletter",
  "size": "30 tabletter",
  "brand": "Ipren",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 35
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 35
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "meds": 37,
    "apohem": 36,
    "apotea": 35,
    "apoteket": 39
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35,
   35
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pa382fbbe",
  "name": "Resorb Vätskeersättning Apelsinsmak 90 g",
  "size": "90 g",
  "brand": "Resorb",
  "category": "pharmacy",
  "emoji": "💊",
  "price": {
   "SE": 39
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 39
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 40,
    "apohem": 39,
    "apoteket": 49,
    "apotekhjartat": 39.2
   }
  },
  "cheapest": {
   "SE": "apohem"
  },
  "sparkline": [
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pb5b031fd",
  "name": "TePe Kids Extra Soft Tandborste 4 st",
  "size": "4 st",
  "brand": "TePe",
  "category": "barn & förälder > mun & tänder > tandborstar > tandvård för barn",
  "emoji": "💊",
  "price": {
   "SE": 39
  },
  "regular": {
   "SE": 48
  },
  "low52": {
   "SE": 39
  },
  "high52": {
   "SE": 48
  },
  "chains": {
   "SE": {
    "meds": 48,
    "apotea": 47,
    "apoteket": 45,
    "apotekhjartat": 39
   }
  },
  "cheapest": {
   "SE": "apotekhjartat"
  },
  "sparkline": [
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 },
 {
  "slug": "pfde669f3",
  "name": "CCS Vårdande Handkräm 200 ml",
  "size": "200 ml",
  "brand": "CCS",
  "category": "händer & fötter > handkräm",
  "emoji": "💊",
  "price": {
   "SE": 39
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 39
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 40,
    "apotea": 39,
    "apoteket": 49,
    "apotekhjartat": 49
   }
  },
  "cheapest": {
   "SE": "apotea"
  },
  "sparkline": [
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "pharmacy"
 }
];
const BEAUTY_PRODUCTS = [
 {
  "slug": "pbe5302d0",
  "name": "ACO Deo Caring 3 in 1 50 ml",
  "size": "50 ml",
  "brand": "ACO",
  "category": "hud/deodorant & antiperspirant/dermatologisk hudvård",
  "emoji": "✨",
  "price": {
   "SE": 52.5
  },
  "regular": {
   "SE": 85
  },
  "low52": {
   "SE": 52.5
  },
  "high52": {
   "SE": 85
  },
  "chains": {
   "SE": {
    "lyko": 52.5,
    "meds": 65,
    "kicks": 85
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5,
   52.5
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pc2bf8f88",
  "name": "IDA WARG Beauty Deodorant Vitalizing Antiperspirant 50 ml",
  "size": "50 ml",
  "brand": "IDA WARG Beauty",
  "category": "hud/deodorant & antiperspirant/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 74.9
  },
  "regular": {
   "SE": 129
  },
  "low52": {
   "SE": 74.9
  },
  "high52": {
   "SE": 129
  },
  "chains": {
   "SE": {
    "lyko": 74.9,
    "meds": 99,
    "kicks": 129
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9,
   74.9
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p24e18455",
  "name": "Löwengrip Count On Me Deodorant 50 ml",
  "size": "50 ml",
  "brand": "Löwengrip",
  "category": "hud/deodorant & antiperspirant/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 82
  },
  "regular": {
   "SE": 155
  },
  "low52": {
   "SE": 82
  },
  "high52": {
   "SE": 155
  },
  "chains": {
   "SE": {
    "lyko": 155,
    "meds": 82,
    "kicks": 155
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82,
   82
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p001c85f5",
  "name": "Vichy Clinical Control Roll-on Antiperspirant Deodorant 50 ml",
  "size": "50 ml",
  "brand": "Vichy",
  "category": "hud/deodorant & antiperspirant/dermatologisk hudvård",
  "emoji": "✨",
  "price": {
   "SE": 137.6
  },
  "regular": {
   "SE": 165
  },
  "low52": {
   "SE": 137.6
  },
  "high52": {
   "SE": 165
  },
  "chains": {
   "SE": {
    "lyko": 137.6,
    "meds": 143,
    "kicks": 165
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6,
   137.6
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p15988f10",
  "name": "NIVEA Creme 75 ml",
  "size": "75 ml",
  "brand": "NIVEA",
  "category": "händer & fötter/ansikte/hud/ansiktskräm/handkräm/hudkräm & body lotion/dagkräm/meds tipsar!/hundra under 100:-",
  "emoji": "✨",
  "price": {
   "SE": 25
  },
  "regular": {
   "SE": 40
  },
  "low52": {
   "SE": 25
  },
  "high52": {
   "SE": 40
  },
  "chains": {
   "SE": {
    "meds": 25,
    "kicks": 40
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25,
   25
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p06a201ca",
  "name": "Better You Blandflaska Spray 30 ml",
  "size": "30 ml",
  "brand": "BETTER YOU",
  "category": "hud/hudolja/ansikte/ansiktsolja",
  "emoji": "✨",
  "price": {
   "SE": 31
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 31
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 31,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31,
   31
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pe993b558",
  "name": "L'Oréal Paris Men Expert Thermic Resist Heat Protection 48H Anti-Perspirant Deodorant Roll On 50 ml",
  "size": "50 ml",
  "brand": "L'Oréal Paris",
  "category": "man/hudvård för män/deodorant & antiperspirant",
  "emoji": "✨",
  "price": {
   "SE": 31.5
  },
  "regular": {
   "SE": 55.3
  },
  "low52": {
   "SE": 31.5
  },
  "high52": {
   "SE": 55.3
  },
  "chains": {
   "SE": {
    "lyko": 31.5,
    "kicks": 55.3
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pab554922",
  "name": "L'Oréal Paris Men Expert Carbon Protect Total Protection 48H Anti-Perspirant Deodorant Roll On 50 ml",
  "size": "50 ml",
  "brand": "L'Oréal Paris",
  "category": "man/hudvård för män/deodorant & antiperspirant",
  "emoji": "✨",
  "price": {
   "SE": 31.5
  },
  "regular": {
   "SE": 55.3
  },
  "low52": {
   "SE": 31.5
  },
  "high52": {
   "SE": 55.3
  },
  "chains": {
   "SE": {
    "lyko": 31.5,
    "kicks": 55.3
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5,
   31.5
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pb031be80",
  "name": "Bats Roll-On Dam 60ml",
  "size": "60ml",
  "brand": "Bats",
  "category": "hud/deodorant & antiperspirant",
  "emoji": "✨",
  "price": {
   "SE": 32
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 32
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "lyko": 39,
    "meds": 32
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32,
   32
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p0fb5415c",
  "name": "Bats Roll-On 60ml Oparfymerad",
  "size": "60ml",
  "brand": "Bats",
  "category": "hud/deodorant & antiperspirant/deodorant herr",
  "emoji": "✨",
  "price": {
   "SE": 34
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 34
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "lyko": 39,
    "meds": 34
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34,
   34
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pff39f359",
  "name": "Dr. Ceuracle Royal Vita Propolis Mask 20 ml",
  "size": "20 ml",
  "brand": "Dr. Ceuracle",
  "category": "ansikte/ansiktsmask/sheet mask/k-beauty",
  "emoji": "✨",
  "price": {
   "SE": 36
  },
  "regular": {
   "SE": 36.75
  },
  "low52": {
   "SE": 36
  },
  "high52": {
   "SE": 36.75
  },
  "chains": {
   "SE": {
    "meds": 36,
    "kicks": 36.75
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p6c95bf94",
  "name": "IDA WARG Beauty Self-Tan Applicator Mitt",
  "size": "",
  "brand": "IDA WARG Beauty",
  "category": "hud/brun utan sol/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 36
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 36
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 36,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p184c3845",
  "name": "Dr. Ceuracle Tea Tree Sheet Mask 30 ml",
  "size": "30 ml",
  "brand": "Dr. Ceuracle",
  "category": "ansikte/ansiktsmask/sheet mask/k-beauty/akne",
  "emoji": "✨",
  "price": {
   "SE": 36
  },
  "regular": {
   "SE": 36.75
  },
  "low52": {
   "SE": 36
  },
  "high52": {
   "SE": 36.75
  },
  "chains": {
   "SE": {
    "meds": 36,
    "kicks": 36.75
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p8913bcaf",
  "name": "Dr. Ceuracle Hyal Reyouth Sheet Mask 30 ml",
  "size": "30 ml",
  "brand": "Dr. Ceuracle",
  "category": "ansikte/ansiktsmask/sheet mask/k-beauty",
  "emoji": "✨",
  "price": {
   "SE": 36
  },
  "regular": {
   "SE": 36.75
  },
  "low52": {
   "SE": 36
  },
  "high52": {
   "SE": 36.75
  },
  "chains": {
   "SE": {
    "meds": 36,
    "kicks": 36.75
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36,
   36
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p2f132854",
  "name": "Dr. Ceuracle Expert Collagen Firming Modeling Mask 30 g",
  "size": "30 g",
  "brand": "Dr. Ceuracle",
  "category": "ansikte/ansiktsmask/k-beauty",
  "emoji": "✨",
  "price": {
   "SE": 36.75
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 36.75
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 49,
    "kicks": 36.75
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75,
   36.75
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p578c7987",
  "name": "By Wishtrend Natural Vitamin 21.5% Enhancing Sheet Mask 23 ml",
  "size": "23 ml",
  "brand": "By Wishtrend",
  "category": "ansikte/ansiktsmask/sheet mask/k-beauty",
  "emoji": "✨",
  "price": {
   "SE": 39
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 39
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 39,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39,
   39
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p025a41b4",
  "name": "L'Oréal Paris Elvital Nutri-Gloss Shine Conditioner 200 ml",
  "size": "200 ml",
  "brand": "L'Oréal Paris",
  "category": "hår/balsam",
  "emoji": "✨",
  "price": {
   "SE": 41.3
  },
  "regular": {
   "SE": 45.9
  },
  "low52": {
   "SE": 41.3
  },
  "high52": {
   "SE": 45.9
  },
  "chains": {
   "SE": {
    "meds": 45.9,
    "kicks": 41.3
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pfb6eb22d",
  "name": "L'Oréal Paris Elvital Dream Length Restoring Conditioner 200 ml",
  "size": "200 ml",
  "brand": "L'Oréal Paris",
  "category": "hår/balsam",
  "emoji": "✨",
  "price": {
   "SE": 41.3
  },
  "regular": {
   "SE": 45.9
  },
  "low52": {
   "SE": 41.3
  },
  "high52": {
   "SE": 45.9
  },
  "chains": {
   "SE": {
    "meds": 45.9,
    "kicks": 41.3
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p1c111f32",
  "name": "L'Oréal Paris Elvital Color Vive Conditioner 200 ml",
  "size": "200 ml",
  "brand": "L'Oréal Paris",
  "category": "hår/balsam",
  "emoji": "✨",
  "price": {
   "SE": 41.3
  },
  "regular": {
   "SE": 45.9
  },
  "low52": {
   "SE": 41.3
  },
  "high52": {
   "SE": 45.9
  },
  "chains": {
   "SE": {
    "meds": 45.9,
    "kicks": 41.3
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3,
   41.3
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pac3e1922",
  "name": "Garnier SkinAcive Moisture Bomb Super-Hydrating and Energizing Sheet Mask 28 g",
  "size": "28 g",
  "brand": "Garnier",
  "category": "ansikte/ansiktsmask/sheet mask",
  "emoji": "✨",
  "price": {
   "SE": 45
  },
  "regular": {
   "SE": 45
  },
  "low52": {
   "SE": 45
  },
  "high52": {
   "SE": 45
  },
  "chains": {
   "SE": {
    "meds": 45,
    "kicks": 45
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45,
   45
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p0d932442",
  "name": "Batiste Dry Schampo Bare 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 54
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 54
  },
  "chains": {
   "SE": {
    "meds": 54,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p04ddc457",
  "name": "Neutrogena® Blackhead Eliminating 0.5 % Salicylic Acid Cleansing Toner, 200 ml",
  "size": "200 ml",
  "brand": "Neutrogena",
  "category": "ansikte/akne/ansiktsvatten/dermatologisk hudvård",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 75
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 75
  },
  "chains": {
   "SE": {
    "meds": 49,
    "kicks": 75
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p96b18a36",
  "name": "NIVEA Intensive Care Shower Oil 200 ml",
  "size": "200 ml",
  "brand": "NIVEA",
  "category": "hud/bad & dusch",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 58
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 58
  },
  "chains": {
   "SE": {
    "meds": 49,
    "kicks": 58
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pf40bb97b",
  "name": "Batiste Dry Schampo Original 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo/meds tipsar!/hundra under 100:-",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 49
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 49
  },
  "chains": {
   "SE": {
    "meds": 49,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p59a438cc",
  "name": "Batiste Color Dry Schampo Brunette 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 59
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 59
  },
  "chains": {
   "SE": {
    "meds": 59,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p8ae9fcd7",
  "name": "Batiste Color Dry Schampo Dark Hair 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 59
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 59
  },
  "chains": {
   "SE": {
    "meds": 59,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p0e4ef40f",
  "name": "Batiste Dry Schampo Heavenly Volume 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 55
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 55
  },
  "chains": {
   "SE": {
    "meds": 55,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p7310ba80",
  "name": "Batiste Dry Schampo XXL Volume 200 ml",
  "size": "200 ml",
  "brand": "Batiste",
  "category": "hår/torrschampo",
  "emoji": "✨",
  "price": {
   "SE": 49
  },
  "regular": {
   "SE": 59
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 59
  },
  "chains": {
   "SE": {
    "meds": 59,
    "kicks": 49
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49,
   49
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p369b37a6",
  "name": "NIVEA Ansiktsservetter Gentle Cleansing Wipes 25 st",
  "size": "25 st",
  "brand": "NIVEA",
  "category": "smink & makeup/ansikte/ansiktsrengöring/sminkborttagning/rengöringsservetter/meds tipsar!/hundra under 100:-",
  "emoji": "✨",
  "price": {
   "SE": 52
  },
  "regular": {
   "SE": 61
  },
  "low52": {
   "SE": 52
  },
  "high52": {
   "SE": 61
  },
  "chains": {
   "SE": {
    "meds": 52,
    "kicks": 61
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p09fc9214",
  "name": "MJUUK Heat Protection 50 ml",
  "size": "50 ml",
  "brand": "MJUUK",
  "category": "hår/värmeskydd/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 52
  },
  "regular": {
   "SE": 65
  },
  "low52": {
   "SE": 52
  },
  "high52": {
   "SE": 65
  },
  "chains": {
   "SE": {
    "meds": 52,
    "kicks": 65
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52,
   52
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p1de6e2fa",
  "name": "Decubal Restoring Lips & Dry Spots Balm 30 ml",
  "size": "30 ml",
  "brand": "Decubal",
  "category": "ansikte/läppbalsam/meds tipsar!/hundra under 100:-/dermatologisk hudvård",
  "emoji": "✨",
  "price": {
   "SE": 55
  },
  "regular": {
   "SE": 55
  },
  "low52": {
   "SE": 55
  },
  "high52": {
   "SE": 55
  },
  "chains": {
   "SE": {
    "meds": 55,
    "kicks": 55
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p6fbecae8",
  "name": "Lumene HERKKÄ Gentle Makeup Removing Wipes 25 st",
  "size": "25 st",
  "brand": "Lumene",
  "category": "smink & makeup/ansikte/ansiktsrengöring/sminkborttagning/rengöringsservetter/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 55
  },
  "regular": {
   "SE": 75
  },
  "low52": {
   "SE": 55
  },
  "high52": {
   "SE": 75
  },
  "chains": {
   "SE": {
    "meds": 55,
    "kicks": 75
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55,
   55
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pc291f1e0",
  "name": "NIVEA Soft 200 ml",
  "size": "200 ml",
  "brand": "NIVEA",
  "category": "hud/hudkräm & body lotion/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 56
  },
  "regular": {
   "SE": 56
  },
  "low52": {
   "SE": 56
  },
  "high52": {
   "SE": 56
  },
  "chains": {
   "SE": {
    "meds": 56,
    "kicks": 56
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56,
   56
  ],
  "confidence": "medium",
  "verdict": "hold",
  "sector": "beauty"
 },
 {
  "slug": "p39c43798",
  "name": "Neutrogena®Clear & Radiant Face Wash 200 ml",
  "size": "200 ml",
  "brand": "Neutrogena",
  "category": "ansikte/ansiktsrengöring/akne/rengöringsgel/dermatologisk hudvård/hundra under 100:-",
  "emoji": "✨",
  "price": {
   "SE": 59
  },
  "regular": {
   "SE": 82
  },
  "low52": {
   "SE": 59
  },
  "high52": {
   "SE": 82
  },
  "chains": {
   "SE": {
    "meds": 59,
    "kicks": 82
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59,
   59
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "peb0f9496",
  "name": "NIVEA Refining Clear Up Strips 8 st",
  "size": "8 st",
  "brand": "NIVEA",
  "category": "ansikte/ansiktsmask/akne/ansiktsmask för finnar",
  "emoji": "✨",
  "price": {
   "SE": 62
  },
  "regular": {
   "SE": 80
  },
  "low52": {
   "SE": 62
  },
  "high52": {
   "SE": 80
  },
  "chains": {
   "SE": {
    "meds": 62,
    "kicks": 80
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pa61eb713",
  "name": "Indy Beauty Intensive 48 h Protect Antiperspirant 50 ml",
  "size": "50 ml",
  "brand": "Indy Beauty",
  "category": "hud/deodorant & antiperspirant/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 62
  },
  "regular": {
   "SE": 89
  },
  "low52": {
   "SE": 62
  },
  "high52": {
   "SE": 89
  },
  "chains": {
   "SE": {
    "meds": 62,
    "kicks": 89
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62,
   62
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p21e07974",
  "name": "Indy Beauty Deodorant Aluminium Free 50 ml",
  "size": "50 ml",
  "brand": "Indy Beauty",
  "category": "hud/deodorant & antiperspirant/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 63
  },
  "regular": {
   "SE": 89
  },
  "low52": {
   "SE": 63
  },
  "high52": {
   "SE": 89
  },
  "chains": {
   "SE": {
    "meds": 63,
    "kicks": 89
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p015850ff",
  "name": "IsaDora The Intense Eyeliner 24H Wear & Smudge-proof 61 Black Brown 0,35 g",
  "size": "0,35 g",
  "brand": "IsaDora",
  "category": "smink & makeup/ögon/eyeliner & kajal/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 63
  },
  "regular": {
   "SE": 129
  },
  "low52": {
   "SE": 63
  },
  "high52": {
   "SE": 129
  },
  "chains": {
   "SE": {
    "meds": 63,
    "kicks": 129
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63,
   63
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pf5e4c47e",
  "name": "NIVEA Body Lotion Smooth Caring 250 ml",
  "size": "250 ml",
  "brand": "NIVEA",
  "category": "hud/hudkräm & body lotion",
  "emoji": "✨",
  "price": {
   "SE": 64
  },
  "regular": {
   "SE": 82
  },
  "low52": {
   "SE": 64
  },
  "high52": {
   "SE": 82
  },
  "chains": {
   "SE": {
    "meds": 64,
    "kicks": 82
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64,
   64
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p2ed41f69",
  "name": "ACO Deo Original 50 ml",
  "size": "50 ml",
  "brand": "ACO",
  "category": "hud/deodorant & antiperspirant/dermatologisk hudvård",
  "emoji": "✨",
  "price": {
   "SE": 65
  },
  "regular": {
   "SE": 85
  },
  "low52": {
   "SE": 65
  },
  "high52": {
   "SE": 85
  },
  "chains": {
   "SE": {
    "meds": 65,
    "kicks": 85
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65,
   65
  ],
  "confidence": "medium",
  "verdict": "buy",
  "sector": "beauty"
 }
];
const FUEL_STATIONS = {};
const STORES = [
 {
  "slug": "s5cdf79a8",
  "name": "Coop Svappavaara-Norrbotten",
  "chain": "coop",
  "city": "Svappavaara",
  "country": "SE",
  "district": "Svappavaara",
  "distance": 0,
  "basketCost": 1472,
  "basketDiff": -394,
  "percentile": 1,
  "openTill": "",
  "coords": [
   "21.0460",
   "67.6484"
  ],
  "lat": 67.6484,
  "lng": 21.046
 },
 {
  "slug": "s8ccef2f3",
  "name": "ICA Supermarket Årstahallen",
  "chain": "ica",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1521,
  "basketDiff": -345,
  "percentile": 2,
  "openTill": "",
  "coords": [
   "17.6846",
   "59.8655"
  ],
  "lat": 59.8655,
  "lng": 17.6846
 },
 {
  "slug": "sba949ee3",
  "name": "ICA Supermarket Skåre",
  "chain": "ica",
  "city": "Karlstad",
  "country": "SE",
  "district": "Karlstad",
  "distance": 0,
  "basketCost": 1540,
  "basketDiff": -326,
  "percentile": 3,
  "openTill": "",
  "coords": [
   "13.4403",
   "59.4348"
  ],
  "lat": 59.4348,
  "lng": 13.4403
 },
 {
  "slug": "sc0de1f3a",
  "name": "Coop Karlstad",
  "chain": "coop",
  "city": "Karlstad",
  "country": "SE",
  "district": "Karlstad",
  "distance": 0,
  "basketCost": 1746,
  "basketDiff": -120,
  "percentile": 3,
  "openTill": "",
  "coords": [
   "12.7010",
   "59.0596"
  ],
  "lat": 59.0596,
  "lng": 12.701
 },
 {
  "slug": "s81a016f7",
  "name": "Hemköp Solna Mall Of Scandinavia",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0048",
   "59.3696"
  ],
  "lat": 59.3696,
  "lng": 18.0048
 },
 {
  "slug": "s96489688",
  "name": "Hemköp 4207 Kvarnholmen",
  "chain": "hemkop",
  "city": "Kalmar",
  "country": "SE",
  "district": "Kalmar",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.3638",
   "56.6651"
  ],
  "lat": 56.6651,
  "lng": 16.3638
 },
 {
  "slug": "sa81ef55a",
  "name": "Hemköp Jönköping Munksjöstaden",
  "chain": "hemkop",
  "city": "Jönköping",
  "country": "SE",
  "district": "Jönköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.1565",
   "57.7711"
  ],
  "lat": 57.7711,
  "lng": 14.1565
 },
 {
  "slug": "s208d8919",
  "name": "Hemköp Solna Ulriksdal",
  "chain": "hemkop",
  "city": "Solna",
  "country": "SE",
  "district": "Solna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9992",
   "59.3808"
  ],
  "lat": 59.3808,
  "lng": 17.9992
 },
 {
  "slug": "s7ddda959",
  "name": "Hemköp Örebro Lucullus",
  "chain": "hemkop",
  "city": "Örebro",
  "country": "SE",
  "district": "Örebro",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.2152",
   "59.2765"
  ],
  "lat": 59.2765,
  "lng": 15.2152
 },
 {
  "slug": "scc4cd9f6",
  "name": "Hemköp Skövde C",
  "chain": "hemkop",
  "city": "Skövde",
  "country": "SE",
  "district": "Skövde",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.8440",
   "58.3885"
  ],
  "lat": 58.3885,
  "lng": 13.844
 },
 {
  "slug": "sc67d3d9b",
  "name": "Hemköp Gustavsberg Hamnen",
  "chain": "hemkop",
  "city": "Gustavsberg",
  "country": "SE",
  "district": "Gustavsberg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.3848",
   "59.3241"
  ],
  "lat": 59.3241,
  "lng": 18.3848
 },
 {
  "slug": "sc0d438a8",
  "name": "Hemköp Nyköping C",
  "chain": "hemkop",
  "city": "Nyköping",
  "country": "SE",
  "district": "Nyköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.0033",
   "58.7526"
  ],
  "lat": 58.7526,
  "lng": 17.0033
 },
 {
  "slug": "s722ad160",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Vänersborg",
  "country": "SE",
  "district": "Vänersborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.3233",
   "58.3792"
  ],
  "lat": 58.3792,
  "lng": 12.3233
 },
 {
  "slug": "sbe3b3a4b",
  "name": "Hemköp Bromma Blackeberg C",
  "chain": "hemkop",
  "city": "Bromma",
  "country": "SE",
  "district": "Bromma",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.8844",
   "59.3475"
  ],
  "lat": 59.3475,
  "lng": 17.8844
 },
 {
  "slug": "s9d8ea389",
  "name": "Hemköp Motala City Östenssons",
  "chain": "hemkop",
  "city": "Motala",
  "country": "SE",
  "district": "Motala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.0367",
   "58.5362"
  ],
  "lat": 58.5362,
  "lng": 15.0367
 },
 {
  "slug": "s3fad3977",
  "name": "Hemköp Göteborg Vasagatan",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9680",
   "57.6986"
  ],
  "lat": 57.6986,
  "lng": 11.968
 },
 {
  "slug": "s2176b5f3",
  "name": "Hemköp Jönköping C",
  "chain": "hemkop",
  "city": "Jönköping",
  "country": "SE",
  "district": "Jönköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.1632",
   "57.7829"
  ],
  "lat": 57.7829,
  "lng": 14.1632
 },
 {
  "slug": "seab1b874",
  "name": "Hemköp Insjön Hjultorget",
  "chain": "hemkop",
  "city": "Insjön",
  "country": "SE",
  "district": "Insjön",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.0899",
   "60.6754"
  ],
  "lat": 60.6754,
  "lng": 15.0899
 },
 {
  "slug": "s5cca85b0",
  "name": "Hemköp Västervik",
  "chain": "hemkop",
  "city": "Västervik",
  "country": "SE",
  "district": "Västervik",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.6346",
   "57.7572"
  ],
  "lat": 57.7572,
  "lng": 16.6346
 },
 {
  "slug": "sc5776793",
  "name": "Hemköp Sköndal C",
  "chain": "hemkop",
  "city": "Sköndal",
  "country": "SE",
  "district": "Sköndal",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.1142",
   "59.2555"
  ],
  "lat": 59.2555,
  "lng": 18.1142
 },
 {
  "slug": "sd2db518e",
  "name": "Hemköp Östervåla Torget",
  "chain": "hemkop",
  "city": "Östervåla",
  "country": "SE",
  "district": "Östervåla",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.1802",
   "60.1814"
  ],
  "lat": 60.1814,
  "lng": 17.1802
 },
 {
  "slug": "sd728f727",
  "name": "Hemköp Malmö Triangeln",
  "chain": "hemkop",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.0034",
   "55.5955"
  ],
  "lat": 55.5955,
  "lng": 13.0034
 },
 {
  "slug": "s1455d0e1",
  "name": "Hemköp Stockholm Torsplan",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0337",
   "59.3464"
  ],
  "lat": 59.3464,
  "lng": 18.0337
 },
 {
  "slug": "se8417a9f",
  "name": "Hemköp Göteborg Majorna",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9184",
   "57.6929"
  ],
  "lat": 57.6929,
  "lng": 11.9184
 },
 {
  "slug": "s0e997168",
  "name": "Hemköp Kungsbacka Hålabäck",
  "chain": "hemkop",
  "city": "Kungsbacka",
  "country": "SE",
  "district": "Kungsbacka",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.0876",
   "57.4847"
  ],
  "lat": 57.4847,
  "lng": 12.0876
 },
 {
  "slug": "s9a7188bb",
  "name": "Hemköp Bålsta",
  "chain": "hemkop",
  "city": "Bålsta",
  "country": "SE",
  "district": "Bålsta",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.5120",
   "59.5770"
  ],
  "lat": 59.577,
  "lng": 17.512
 },
 {
  "slug": "s9b954fef",
  "name": "Hemköp Helsingborg Stattena",
  "chain": "hemkop",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.7010",
   "56.0571"
  ],
  "lat": 56.0571,
  "lng": 12.701
 },
 {
  "slug": "s149d1de8",
  "name": "Priso Hemköp",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.6117",
   "58.4189"
  ],
  "lat": 58.4189,
  "lng": 15.6117
 },
 {
  "slug": "s97617865",
  "name": "Hemköp Svedala",
  "chain": "hemkop",
  "city": "Svedala",
  "country": "SE",
  "district": "Svedala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.2367",
   "55.5089"
  ],
  "lat": 55.5089,
  "lng": 13.2367
 },
 {
  "slug": "s27178bbe",
  "name": "Hemköp Göteborg Nordenskiöldsgatan",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9509",
   "57.6928"
  ],
  "lat": 57.6928,
  "lng": 11.9509
 },
 {
  "slug": "s41daba63",
  "name": "Hemköp Malmö Kronprinsen",
  "chain": "hemkop",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.9844",
   "55.5986"
  ],
  "lat": 55.5986,
  "lng": 12.9844
 },
 {
  "slug": "sa0e684b2",
  "name": "Hemköp Mölndal Bifrost",
  "chain": "hemkop",
  "city": "Mölndal",
  "country": "SE",
  "district": "Mölndal",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9915",
   "57.6618"
  ],
  "lat": 57.6618,
  "lng": 11.9915
 },
 {
  "slug": "s39f87a61",
  "name": "Hemköp Sälen Tandådalen",
  "chain": "hemkop",
  "city": "Sälen",
  "country": "SE",
  "district": "Sälen",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.9901",
   "61.1795"
  ],
  "lat": 61.1795,
  "lng": 12.9901
 },
 {
  "slug": "sdd79d253",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Karlskrona",
  "country": "SE",
  "district": "Karlskrona",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.5882",
   "56.1622"
  ],
  "lat": 56.1622,
  "lng": 15.5882
 },
 {
  "slug": "s06a935b0",
  "name": "Hemköp Köping C",
  "chain": "hemkop",
  "city": "Köping",
  "country": "SE",
  "district": "Köping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.9981",
   "59.5136"
  ],
  "lat": 59.5136,
  "lng": 15.9981
 },
 {
  "slug": "s70b392c1",
  "name": "Hemköp Mellerud Torget",
  "chain": "hemkop",
  "city": "Mellerud",
  "country": "SE",
  "district": "Mellerud",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.4529",
   "58.6994"
  ],
  "lat": 58.6994,
  "lng": 12.4529
 },
 {
  "slug": "s2eda341e",
  "name": "Hemköp Hägersten Västertorp",
  "chain": "hemkop",
  "city": "Hägersten",
  "country": "SE",
  "district": "Hägersten",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9678",
   "59.2931"
  ],
  "lat": 59.2931,
  "lng": 17.9678
 },
 {
  "slug": "s76570ddf",
  "name": "Hemköp Kungsbacka Torget",
  "chain": "hemkop",
  "city": "Kungsbacka",
  "country": "SE",
  "district": "Kungsbacka",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.0767",
   "57.4865"
  ],
  "lat": 57.4865,
  "lng": 12.0767
 },
 {
  "slug": "s554602f2",
  "name": "Hemköp Kungsbacka Billdal",
  "chain": "hemkop",
  "city": "Billdal",
  "country": "SE",
  "district": "Billdal",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9615",
   "57.5607"
  ],
  "lat": 57.5607,
  "lng": 11.9615
 },
 {
  "slug": "s761b54c1",
  "name": "Hemköp Bollebygd",
  "chain": "hemkop",
  "city": "Bollebygd",
  "country": "SE",
  "district": "Bollebygd",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.5696",
   "57.6679"
  ],
  "lat": 57.6679,
  "lng": 12.5696
 },
 {
  "slug": "s69882853",
  "name": "Hemköp Borlänge Södra Backa",
  "chain": "hemkop",
  "city": "Borlänge",
  "country": "SE",
  "district": "Borlänge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.4412",
   "60.4711"
  ],
  "lat": 60.4711,
  "lng": 15.4412
 },
 {
  "slug": "sf27b2523",
  "name": "Hemköp Trollhättan Kungsgatan",
  "chain": "hemkop",
  "city": "Trollhättan",
  "country": "SE",
  "district": "Trollhättan",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.2940",
   "58.2870"
  ],
  "lat": 58.287,
  "lng": 12.294
 },
 {
  "slug": "s8da49fd9",
  "name": "Hemköp Lund Karhögstorg",
  "chain": "hemkop",
  "city": "Lund",
  "country": "SE",
  "district": "Lund",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.1915",
   "55.6945"
  ],
  "lat": 55.6945,
  "lng": 13.1915
 },
 {
  "slug": "sa09dd703",
  "name": "Hemköp Göteborg Mölnlycke",
  "chain": "hemkop",
  "city": "Mölnlycke",
  "country": "SE",
  "district": "Mölnlycke",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.1141",
   "57.6581"
  ],
  "lat": 57.6581,
  "lng": 12.1141
 },
 {
  "slug": "s4e3a5c3e",
  "name": "Hemköp Helsingborg Rydebäck",
  "chain": "hemkop",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.7750",
   "55.9663"
  ],
  "lat": 55.9663,
  "lng": 12.775
 },
 {
  "slug": "s5ad7d538",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Huddinge",
  "country": "SE",
  "district": "Huddinge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9813",
   "59.2366"
  ],
  "lat": 59.2366,
  "lng": 17.9813
 },
 {
  "slug": "sc3d6d522",
  "name": "Hemköp Göteborg Guldheden",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9717",
   "57.6840"
  ],
  "lat": 57.684,
  "lng": 11.9717
 },
 {
  "slug": "sce423779",
  "name": "Hemköp Lidingö Brevik",
  "chain": "hemkop",
  "city": "Lidingö",
  "country": "SE",
  "district": "Lidingö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.2048",
   "59.3481"
  ],
  "lat": 59.3481,
  "lng": 18.2048
 },
 {
  "slug": "s385d3467",
  "name": "Hemköp Göteborg Torslanda C",
  "chain": "hemkop",
  "city": "Torslanda",
  "country": "SE",
  "district": "Torslanda",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.7671",
   "57.7238"
  ],
  "lat": 57.7238,
  "lng": 11.7671
 },
 {
  "slug": "sadce386b",
  "name": "Wasahallen",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0512",
   "59.3403"
  ],
  "lat": 59.3403,
  "lng": 18.0512
 },
 {
  "slug": "sbc91c6b2",
  "name": "Hemköp Kisa",
  "chain": "hemkop",
  "city": "Kisa",
  "country": "SE",
  "district": "Kisa",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.6331",
   "57.9886"
  ],
  "lat": 57.9886,
  "lng": 15.6331
 },
 {
  "slug": "s0f1b3393",
  "name": "Hemköp Veddige C",
  "chain": "hemkop",
  "city": "Veddige",
  "country": "SE",
  "district": "Veddige",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.3339",
   "57.2669"
  ],
  "lat": 57.2669,
  "lng": 12.3339
 },
 {
  "slug": "s58d175df",
  "name": "Hemköp Ludvika C",
  "chain": "hemkop",
  "city": "Ludvika",
  "country": "SE",
  "district": "Ludvika",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.1864",
   "60.1506"
  ],
  "lat": 60.1506,
  "lng": 15.1864
 },
 {
  "slug": "sbb0e338e",
  "name": "Hemköp Lucullus",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.6209",
   "58.4107"
  ],
  "lat": 58.4107,
  "lng": 15.6209
 },
 {
  "slug": "s88e3283d",
  "name": "Hemköp Stockholm Gärdet",
  "chain": "hemkop",
  "city": "Stockholm",
  "country": "SE",
  "district": "Stockholm",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.1033",
   "59.3463"
  ],
  "lat": 59.3463,
  "lng": 18.1033
 },
 {
  "slug": "sa7078787",
  "name": "Hemköp Sollentuna Rotehallen",
  "chain": "hemkop",
  "city": "Sollentuna",
  "country": "SE",
  "district": "Sollentuna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9118",
   "59.4768"
  ],
  "lat": 59.4768,
  "lng": 17.9118
 },
 {
  "slug": "s4bfc3e87",
  "name": "Hemköp Stockholm Jungfrugatan",
  "chain": "hemkop",
  "city": "Stockholm",
  "country": "SE",
  "district": "Stockholm",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0863",
   "59.3430"
  ],
  "lat": 59.343,
  "lng": 18.0863
 },
 {
  "slug": "s635c70cb",
  "name": "Hemköp Tranås C",
  "chain": "hemkop",
  "city": "Tranås",
  "country": "SE",
  "district": "Tranås",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.9760",
   "58.0377"
  ],
  "lat": 58.0377,
  "lng": 14.976
 },
 {
  "slug": "s6a2818b8",
  "name": "Hemköp Stockholm City",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0622",
   "59.3324"
  ],
  "lat": 59.3324,
  "lng": 18.0622
 },
 {
  "slug": "seac53162",
  "name": "Hemköp Nacka Forum",
  "chain": "hemkop",
  "city": "Nacka",
  "country": "SE",
  "district": "Nacka",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.1649",
   "59.3109"
  ],
  "lat": 59.3109,
  "lng": 18.1649
 },
 {
  "slug": "s59ff9718",
  "name": "Hemköp Göteborg Linnégatan",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9522",
   "57.6956"
  ],
  "lat": 57.6956,
  "lng": 11.9522
 },
 {
  "slug": "s02c301df",
  "name": "Hemköp Hudiksvall C",
  "chain": "hemkop",
  "city": "Hudiksvall",
  "country": "SE",
  "district": "Hudiksvall",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.1032",
   "61.7294"
  ],
  "lat": 61.7294,
  "lng": 17.1032
 },
 {
  "slug": "s95b4c4f9",
  "name": "Hemköp Stockholm Skanstull",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0761",
   "59.3074"
  ],
  "lat": 59.3074,
  "lng": 18.0761
 },
 {
  "slug": "scfa0d70d",
  "name": "Hemköp Sundbyberg Rissne",
  "chain": "hemkop",
  "city": "Sundbyberg",
  "country": "SE",
  "district": "Sundbyberg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9406",
   "59.3760"
  ],
  "lat": 59.376,
  "lng": 17.9406
 },
 {
  "slug": "sfba99a99",
  "name": "Hemköp Göteborg Kortedala Torg",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.0314",
   "57.7521"
  ],
  "lat": 57.7521,
  "lng": 12.0314
 },
 {
  "slug": "sa1e6507c",
  "name": "Hemköp Stockholm Fatburen",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0649",
   "59.3146"
  ],
  "lat": 59.3146,
  "lng": 18.0649
 },
 {
  "slug": "sd1e8b6b9",
  "name": "Hemköp Stockholm Älvsjö",
  "chain": "hemkop",
  "city": "Älvsjö",
  "country": "SE",
  "district": "Älvsjö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0023",
   "59.2788"
  ],
  "lat": 59.2788,
  "lng": 18.0023
 },
 {
  "slug": "sb3931049",
  "name": "Hemköp Stockholm Odenplan",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0460",
   "59.3431"
  ],
  "lat": 59.3431,
  "lng": 18.046
 },
 {
  "slug": "s81858e80",
  "name": "Hemköp Göteborg Högsbo",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9129",
   "57.6732"
  ],
  "lat": 57.6732,
  "lng": 11.9129
 },
 {
  "slug": "s5364fb26",
  "name": "Hemköp Lidköping C",
  "chain": "hemkop",
  "city": "Lidköping",
  "country": "SE",
  "district": "Lidköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.1538",
   "58.5031"
  ],
  "lat": 58.5031,
  "lng": 13.1538
 },
 {
  "slug": "s2edf6fe6",
  "name": "Hemköp Göteborg Masthuggstorget",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9431",
   "57.6984"
  ],
  "lat": 57.6984,
  "lng": 11.9431
 },
 {
  "slug": "sd2fde512",
  "name": "Hemköp Danderyd Mörby Centrum",
  "chain": "hemkop",
  "city": "Danderyd",
  "country": "SE",
  "district": "Danderyd",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0367",
   "59.3985"
  ],
  "lat": 59.3985,
  "lng": 18.0367
 },
 {
  "slug": "sca0ac807",
  "name": "Hemköp Helsingborg Laröd",
  "chain": "hemkop",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.6548",
   "56.0911"
  ],
  "lat": 56.0911,
  "lng": 12.6548
 },
 {
  "slug": "s06988a56",
  "name": "Hemköp Sabis Fältöversten",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0917",
   "59.3399"
  ],
  "lat": 59.3399,
  "lng": 18.0917
 },
 {
  "slug": "sf5bec230",
  "name": "Hemköp Stockholm Vällingby C",
  "chain": "hemkop",
  "city": "Vällingby",
  "country": "SE",
  "district": "Vällingby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.8729",
   "59.3635"
  ],
  "lat": 59.3635,
  "lng": 17.8729
 },
 {
  "slug": "sd8cd5804",
  "name": "Hemköp Uppsala Svava C",
  "chain": "hemkop",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.6433",
   "59.8583"
  ],
  "lat": 59.8583,
  "lng": 17.6433
 },
 {
  "slug": "sf3364440",
  "name": "Hemköp Malmö Värnhem",
  "chain": "hemkop",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.0261",
   "55.6073"
  ],
  "lat": 55.6073,
  "lng": 13.0261
 },
 {
  "slug": "s070ff768",
  "name": "Hemköp Mellerud Kvarnkullen",
  "chain": "hemkop",
  "city": "Mellerud",
  "country": "SE",
  "district": "Mellerud",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.4642",
   "58.6977"
  ],
  "lat": 58.6977,
  "lng": 12.4642
 },
 {
  "slug": "s990bc657",
  "name": "Hemköp Sundbyberg Sturegatan",
  "chain": "hemkop",
  "city": "Sundbyberg",
  "country": "SE",
  "district": "Sundbyberg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9735",
   "59.3612"
  ],
  "lat": 59.3612,
  "lng": 17.9735
 },
 {
  "slug": "sb33d17c5",
  "name": "Hemköp Stockholm Matpressen",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0174",
   "59.3280"
  ],
  "lat": 59.328,
  "lng": 18.0174
 },
 {
  "slug": "s0c4307ba",
  "name": "Hemkop Stockholm Torsplan",
  "chain": "hemkop",
  "city": "Stockholm",
  "country": "SE",
  "district": "Stockholm",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0359",
   "59.3490"
  ],
  "lat": 59.349,
  "lng": 18.0359
 },
 {
  "slug": "sd6ea294b",
  "name": "Hemköp Avesta",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.1602",
   "60.1425"
  ],
  "lat": 60.1425,
  "lng": 16.1602
 },
 {
  "slug": "s765fb640",
  "name": "Hemköp Västra Frölunda Långedrag",
  "chain": "hemkop",
  "city": "Västra Frölunda",
  "country": "SE",
  "district": "Västra Frölunda",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.8798",
   "57.6719"
  ],
  "lat": 57.6719,
  "lng": 11.8798
 },
 {
  "slug": "s2ec9b770",
  "name": "Hemköp Göteborg Annedal",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9591",
   "57.6931"
  ],
  "lat": 57.6931,
  "lng": 11.9591
 },
 {
  "slug": "s109fd472",
  "name": "Hemköp Almö Livs",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.7519",
   "58.0621"
  ],
  "lat": 58.0621,
  "lng": 11.7519
 },
 {
  "slug": "s192a8a90",
  "name": "Hemköp Göteborg Stigbergstorget",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9349",
   "57.6989"
  ],
  "lat": 57.6989,
  "lng": 11.9349
 },
 {
  "slug": "sd12e22ce",
  "name": "Hemköp Leksand",
  "chain": "hemkop",
  "city": "Leksand",
  "country": "SE",
  "district": "Leksand",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.9975",
   "60.7332"
  ],
  "lat": 60.7332,
  "lng": 14.9975
 },
 {
  "slug": "se0812a12",
  "name": "Hemköp Solna Centrum",
  "chain": "hemkop",
  "city": "Solna",
  "country": "SE",
  "district": "Solna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9999",
   "59.3606"
  ],
  "lat": 59.3606,
  "lng": 17.9999
 },
 {
  "slug": "s5499c74a",
  "name": "Hemköp Linköping Ryd",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.5625",
   "58.4089"
  ],
  "lat": 58.4089,
  "lng": 15.5625
 },
 {
  "slug": "s81ae565e",
  "name": "Hemköp Tyringe",
  "chain": "hemkop",
  "city": "Tyringe",
  "country": "SE",
  "district": "Tyringe",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.6044",
   "56.1613"
  ],
  "lat": 56.1613,
  "lng": 13.6044
 },
 {
  "slug": "sac9adcfb",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Värnamo",
  "country": "SE",
  "district": "Värnamo",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.0458",
   "57.1846"
  ],
  "lat": 57.1846,
  "lng": 14.0458
 },
 {
  "slug": "sea5c507d",
  "name": "Hemköp Linköping Tallboda",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.6785",
   "58.4265"
  ],
  "lat": 58.4265,
  "lng": 15.6785
 },
 {
  "slug": "se0764a93",
  "name": "Hemköp Solna Huvudsta C",
  "chain": "hemkop",
  "city": "Solna",
  "country": "SE",
  "district": "Solna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9866",
   "59.3498"
  ],
  "lat": 59.3498,
  "lng": 17.9866
 },
 {
  "slug": "sa4f34fa7",
  "name": "Hemköp Stockholm Fruängen C",
  "chain": "hemkop",
  "city": "Hägersten",
  "country": "SE",
  "district": "Hägersten",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9646",
   "59.2857"
  ],
  "lat": 59.2857,
  "lng": 17.9646
 },
 {
  "slug": "sc2c66757",
  "name": "Hemköp Huddinge Matbörsen",
  "chain": "hemkop",
  "city": "Huddinge",
  "country": "SE",
  "district": "Huddinge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9716",
   "59.2541"
  ],
  "lat": 59.2541,
  "lng": 17.9716
 },
 {
  "slug": "seaac17bd",
  "name": "Hemköp Hässelby Strand",
  "chain": "hemkop",
  "city": "Hässelby",
  "country": "SE",
  "district": "Hässelby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.8327",
   "59.3606"
  ],
  "lat": 59.3606,
  "lng": 17.8327
 },
 {
  "slug": "s16c7f605",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9348",
   "59.2952"
  ],
  "lat": 59.2952,
  "lng": 17.9348
 },
 {
  "slug": "s4df8b497",
  "name": "Hemköp Solna Frösunda Boulevard",
  "chain": "hemkop",
  "city": "Solna",
  "country": "SE",
  "district": "Solna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0161",
   "59.3719"
  ],
  "lat": 59.3719,
  "lng": 18.0161
 },
 {
  "slug": "s77af1862",
  "name": "Hemköp Härnösand C",
  "chain": "hemkop",
  "city": "Härnösand",
  "country": "SE",
  "district": "Härnösand",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9394",
   "62.6317"
  ],
  "lat": 62.6317,
  "lng": 17.9394
 },
 {
  "slug": "sbcce1dbc",
  "name": "Hemköp Linköping Storgatan",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.6282",
   "58.4115"
  ],
  "lat": 58.4115,
  "lng": 15.6282
 },
 {
  "slug": "s5bcddee4",
  "name": "Hemköp Västra Frölunda Torg",
  "chain": "hemkop",
  "city": "Västra Frölunda",
  "country": "SE",
  "district": "Västra Frölunda",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9135",
   "57.6525"
  ],
  "lat": 57.6525,
  "lng": 11.9135
 },
 {
  "slug": "sdaaec87b",
  "name": "Hemköp Stockholm Östermalmstorg",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0784",
   "59.3364"
  ],
  "lat": 59.3364,
  "lng": 18.0784
 },
 {
  "slug": "s10628473",
  "name": "Hemköp Dalby",
  "chain": "hemkop",
  "city": "Dalby",
  "country": "SE",
  "district": "Dalby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.3491",
   "55.6644"
  ],
  "lat": 55.6644,
  "lng": 13.3491
 },
 {
  "slug": "s2e6dc69b",
  "name": "Hemköp Rättvik C",
  "chain": "hemkop",
  "city": "Rättvik",
  "country": "SE",
  "district": "Rättvik",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "15.1210",
   "60.8829"
  ],
  "lat": 60.8829,
  "lng": 15.121
 },
 {
  "slug": "s73510b9b",
  "name": "Hemköp Malung",
  "chain": "hemkop",
  "city": "Malung",
  "country": "SE",
  "district": "Malung",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.7112",
   "60.6847"
  ],
  "lat": 60.6847,
  "lng": 13.7112
 },
 {
  "slug": "s9d57f107",
  "name": "Hemköp Skövde Rydshallen",
  "chain": "hemkop",
  "city": "Skövde",
  "country": "SE",
  "district": "Skövde",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.8723",
   "58.4263"
  ],
  "lat": 58.4263,
  "lng": 13.8723
 },
 {
  "slug": "sd48f3bb7",
  "name": "Hemköp Halmstad C",
  "chain": "hemkop",
  "city": "Halmstad",
  "country": "SE",
  "district": "Halmstad",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "12.8567",
   "56.6748"
  ],
  "lat": 56.6748,
  "lng": 12.8567
 },
 {
  "slug": "s7eb7164f",
  "name": "Hemköp Norrköping Lasarettsgatan",
  "chain": "hemkop",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.1793",
   "58.5839"
  ],
  "lat": 58.5839,
  "lng": 16.1793
 },
 {
  "slug": "s548e10df",
  "name": "Hemköp Västerås City",
  "chain": "hemkop",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.5400",
   "59.6086"
  ],
  "lat": 59.6086,
  "lng": 16.54
 },
 {
  "slug": "s398c9111",
  "name": "Hemköp Uppsala Västertorg",
  "chain": "hemkop",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.6020",
   "59.8411"
  ],
  "lat": 59.8411,
  "lng": 17.602
 },
 {
  "slug": "s25fb6c93",
  "name": "Hemköp Norrköping Kungsgatan",
  "chain": "hemkop",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.1783",
   "58.5916"
  ],
  "lat": 58.5916,
  "lng": 16.1783
 },
 {
  "slug": "s98b395cc",
  "name": "Hemköp Botkyrka Tullinge C",
  "chain": "hemkop",
  "city": "Tullinge",
  "country": "SE",
  "district": "Tullinge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.9025",
   "59.2060"
  ],
  "lat": 59.206,
  "lng": 17.9025
 },
 {
  "slug": "s608be366",
  "name": "Hemköp Karlstad C",
  "chain": "hemkop",
  "city": "Karlstad",
  "country": "SE",
  "district": "Karlstad",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.4977",
   "59.3792"
  ],
  "lat": 59.3792,
  "lng": 13.4977
 },
 {
  "slug": "sd9c401e0",
  "name": "Hemköp Järfälla Jakobsbergs Centrum",
  "chain": "hemkop",
  "city": "Järfälla",
  "country": "SE",
  "district": "Järfälla",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.8377",
   "59.4236"
  ],
  "lat": 59.4236,
  "lng": 17.8377
 },
 {
  "slug": "sce2953a8",
  "name": "Hemköp Kullavik C",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "11.9467",
   "57.5468"
  ],
  "lat": 57.5468,
  "lng": 11.9467
 },
 {
  "slug": "s59af6ae3",
  "name": "Hemköp Vrigstad",
  "chain": "hemkop",
  "city": "Vrigstad",
  "country": "SE",
  "district": "Vrigstad",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "14.4765",
   "57.3551"
  ],
  "lat": 57.3551,
  "lng": 14.4765
 },
 {
  "slug": "s549299b7",
  "name": "Hemköp Täby Näsbypark C",
  "chain": "hemkop",
  "city": "Täby",
  "country": "SE",
  "district": "Täby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "18.0949",
   "59.4305"
  ],
  "lat": 59.4305,
  "lng": 18.0949
 },
 {
  "slug": "sad2984fc",
  "name": "Hemköp Järfälla Stäket",
  "chain": "hemkop",
  "city": "Järfälla",
  "country": "SE",
  "district": "Järfälla",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "17.8119",
   "59.4693"
  ],
  "lat": 59.4693,
  "lng": 17.8119
 },
 {
  "slug": "s6120efee",
  "name": "Hemköp Kolbäck",
  "chain": "hemkop",
  "city": "Kolbäck",
  "country": "SE",
  "district": "Kolbäck",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "16.2330",
   "59.5654"
  ],
  "lat": 59.5654,
  "lng": 16.233
 },
 {
  "slug": "sf4028ed9",
  "name": "Hemköp Blentarp",
  "chain": "hemkop",
  "city": "Sverige",
  "country": "SE",
  "district": "",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 100,
  "openTill": "",
  "coords": [
   "13.6023",
   "55.5835"
  ],
  "lat": 55.5835,
  "lng": 13.6023
 }
];
const PRICE_HISTORY_LONG = [];
const MY_BASKET_DEFAULT = [
 {
  "slug": "pca18d9a8",
  "qty": 1
 },
 {
  "slug": "p9199795b",
  "qty": 1
 },
 {
  "slug": "p74483b4f",
  "qty": 1
 },
 {
  "slug": "p85b7289b",
  "qty": 1
 },
 {
  "slug": "pf0b06ba4",
  "qty": 1
 },
 {
  "slug": "p799c804e",
  "qty": 1
 },
 {
  "slug": "pe247177f",
  "qty": 1
 },
 {
  "slug": "p0e710aa5",
  "qty": 1
 },
 {
  "slug": "p3177144b",
  "qty": 1
 },
 {
  "slug": "p26484ee8",
  "qty": 1
 }
];
const ALL_PRODUCTS = [...GROCERY_PRODUCTS, ...FUEL_PRODUCTS, ...PHARMACY_PRODUCTS, ...BEAUTY_PRODUCTS];

function fmtPrice(value){ if(value==null) return '—'; return new Intl.NumberFormat('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+'\u00A0kr'; }
function fmtPct(value){ const s=value>0?'+':''; return s+value.toFixed(1)+'%'; }
function findProduct(slug){ return ALL_PRODUCTS.find(p=>p.slug===slug); }
function findStore(slug){ return STORES.find(s=>s.slug===slug); }
function findCategory(slug){ return CATEGORIES.find(c=>c.slug===slug); }
function priceOf(p,c='SE'){ return p?(p.price?.[c]??p.price):null; }
function chainsOf(p,c='SE'){ return p.chains?.[c]??{}; }
function cheapestChainOf(p,c='SE'){ return p.cheapest?.[c]; }
function municipalitiesFor(){ return MUNICIPALITIES.SE; }
function municipalityInfo(code,name){ return MUNICIPALITIES.SE.find(m=>m.name===name)||MUNICIPALITIES.SE[0]; }
function jamforpris(product){ const price=priceOf(product,'SE'); if(price==null) return null;
  const fmt=(v)=>v.toLocaleString('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(product.unit){ const u=String(product.unit).replace(/^kr\s*\//i,'').toLowerCase(); return fmt(price)+' kr/'+u; }
  const m=String(product.size||'').toLowerCase().match(/([\d.,]+)\s*([a-zà-ÿ]+)/); if(!m) return null;
  const qty=parseFloat(m[1].replace(',','.')); const unit=m[2]; if(!qty||qty<=0) return null;
  let per,label; if(unit==='kg'){per=price/qty;label='kg';} else if(unit.startsWith('g')){per=price/(qty/1000);label='kg';}
  else if(unit==='l'){per=price/qty;label='l';} else if(unit==='dl'){per=price/(qty/10);label='l';}
  else if(unit==='cl'){per=price/(qty/100);label='l';} else if(unit==='ml'){per=price/(qty/1000);label='l';}
  else {per=price/qty;label='st';} return per.toLocaleString('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2})+' kr/'+label; }

Object.assign(window, { COUNTRIES, MUNICIPALITIES, SECTORS, CHAINS, CATEGORIES, STORES,
  GROCERY_PRODUCTS, FUEL_PRODUCTS, PHARMACY_PRODUCTS, BEAUTY_PRODUCTS, ALL_PRODUCTS,
  FUEL_STATIONS, PRICE_HISTORY_LONG, MY_BASKET_DEFAULT,
  fmtPrice, fmtPct, findProduct, findStore, findCategory, priceOf, chainsOf, cheapestChainOf,
  municipalitiesFor, municipalityInfo, jamforpris });
try { var _gc = window.localStorage && localStorage.getItem('gv-country'); if (_gc && !COUNTRIES[_gc]) { localStorage.setItem('gv-country','SE'); localStorage.removeItem('gv-municipality'); } } catch (e) {}
