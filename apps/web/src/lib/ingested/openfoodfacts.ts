// AUTO-GENERATED from the official OpenFoodFacts world data export.
// Source URL: https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
// Retrieved: 2026-05-22T08:25:07.875Z
// Row count: 40 real barcode+nutrition enrichment rows matched to existing ingested retailer products.
// Candidate barcode count checked from current Willys/Hemkop/Coop ingested rows: 172. No-match or nutrition-empty products were skipped.

export type OpenFoodFactsNutritionPer100g = {
  energyKj: number | null;
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
  sodium: number | null;
};

export type OpenFoodFactsRetailerMatch = {
  chain: 'willys' | 'hemkop' | 'coop';
  productCode: string;
  name: string;
  brand: string;
  packageText: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type OpenFoodFactsIngestedProduct = {
  barcode: string;
  name: string;
  brands: string;
  quantity: string;
  categories: string[];
  labels: string[];
  nutriscoreGrade: string;
  nutritionPer100g: OpenFoodFactsNutritionPer100g;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  retailerMatches: OpenFoodFactsRetailerMatch[];
};

export const openFoodFactsSource = {
  source: 'openfoodfacts.org world data export barcode nutrition enrichment',
  retrievedAt: "2026-05-22T08:25:07.875Z",
  rowCount: 40,
  candidateBarcodeCount: 172,
  sourceUrl: "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
} as const;

export const openFoodFactsProducts: OpenFoodFactsIngestedProduct[] = [
  {
    "barcode": "5410673005861",
    "name": "Pitkäjyväinen riisi, keitetty",
    "brands": "MARS NORGE AS",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:seeds",
      "en:cereals-and-their-products",
      "en:cereal-grains",
      "en:rices",
      "en:long-grain-rices",
      "en:parboiled-rices"
    ],
    "labels": [
      "en:no-gluten",
      "en:green-dot"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 681.1,
      "energyKcal": 157,
      "fat": 0.5,
      "saturatedFat": 0.1,
      "carbohydrates": 34,
      "sugars": 0.5,
      "fiber": 0.8,
      "proteins": 4.6,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/541/067/300/5861/front_fi.18.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5410673005861/pitkajyvainen-riisi-keitetty-mars-norge-as",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005861",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101352143_ST",
        "name": "Långkornigt Ris",
        "brand": "Ben's Original",
        "packageText": "BEN'S ORIGINAL, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101352143_ST",
        "name": "Långkornigt Ris",
        "brand": "Ben's Original",
        "packageText": "BEN'S ORIGINAL, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310130003530",
    "name": "Snabb makaroner",
    "brands": "Kungsörnen, Lantmännen",
    "quantity": "750g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:durum-wheat-pasta",
      "en:durum-wheat-macaroni"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1500,
      "energyKcal": 360,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 0.3,
      "fiber": 3,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/000/3530/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130003530/snabb-makaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003530",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101205623_ST",
        "name": "Snabbmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101205623_ST",
        "name": "Snabbmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310130003547",
    "name": "Ideal Makaroner",
    "brands": "Kungsörnen",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:pastas"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1509,
      "energyKcal": 361,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 3,
      "fiber": 3,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/000/3547/front_sv.6.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130003547/ideal-makaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003547",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101205621_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101205621_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310130003561",
    "name": "Gammaldags Ideal makaroner",
    "brands": "Kungsörnen",
    "quantity": "1300 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1509,
      "energyKcal": 360,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 3,
      "fiber": 3,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/000/3561/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130003561/gammaldags-ideal-makaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003561",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101205570_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1,3kg",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101205570_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1,3kg",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865018465",
    "name": "Yoggi Original 2% Jordgubb & Smultron (Yoggi Original 2% Strawberries & Wild strawberries/ European strawberries)",
    "brands": "Arla Yoggi®",
    "quantity": "1000gram/ 1 liter",
    "categories": [
      "en:beverages-and-beverages-preparations",
      "en:beverages",
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:dairy-drinks",
      "en:fermented-dairy-desserts",
      "en:fermented-drinks",
      "en:yogurts",
      "en:fermented-milk-drinks",
      "en:drinkable-yogurts"
    ],
    "labels": [
      "sv:yoggi-arla"
    ],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 340,
      "energyKcal": 80,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 11,
      "sugars": 11,
      "fiber": null,
      "proteins": 3.3,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/501/8465/front_fr.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865018465/yoggi-original-2-jordgubb-smultron-yoggi-original-2-strawberries-wild-strawberries-european-strawberries-arla-yoggi",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018465",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100050640_ST",
        "name": "Jordgubb Smultron Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "100050640_ST",
        "name": "Jordgubb Smultron Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865018472",
    "name": "Yoggi Original Skogsbär",
    "brands": "Arla, Yoggi",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:fermented-dairy-desserts-with-fruits",
      "en:yogurts",
      "en:fruit-yogurts",
      "en:yogurt-with-fruits-and-sugar"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c014047"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 350,
      "energyKcal": 80,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 12,
      "sugars": 11,
      "fiber": null,
      "proteins": 3.4,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/501/8472/front_sv.17.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865018472/yoggi-original-skogsbar-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018472",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100137095_ST",
        "name": "Skogsbär Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "100137095_ST",
        "name": "Skogsbär Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865018496",
    "name": "Yoggi original 2% Samoa",
    "brands": "yoggi",
    "quantity": "1000g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:fermented-dairy-desserts-with-fruits",
      "en:yogurts",
      "en:fruit-yogurts",
      "en:fruit-yogurts-with-fruit-chunks"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "sv:svensk-mjölk"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 317.1,
      "energyKcal": 79,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 11,
      "sugars": 11,
      "fiber": null,
      "proteins": 3.3,
      "salt": 0.07,
      "sodium": 0.028
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/501/8496/front_sv.17.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865018496/yoggi-original-2-samoa",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018496",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100986033_ST",
        "name": "Samoa Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "100986033_ST",
        "name": "Samoa Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865088512",
    "name": "mild yogurt vanilj",
    "brands": "Arla, Arla Foods",
    "quantity": "1500 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 300,
      "energyKcal": 70,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 8.7,
      "sugars": 8.7,
      "fiber": null,
      "proteins": 3.9,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/508/8512/front_sv.6.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865088512/mild-yogurt-vanilj-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088512",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101210853_ST",
        "name": "Vanilj Mild Yoghurt 2%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101210853_ST",
        "name": "Vanilj Mild Yoghurt 2%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311043002191",
    "name": "Mellanmjölk med längre hållbarhet",
    "brands": "Garant",
    "quantity": "1l",
    "categories": [
      "en:dairies",
      "en:milks-liquid-and-powder",
      "en:milks",
      "en:pasteurised-products",
      "en:pasteurised-milks"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 195,
      "energyKcal": 47,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.7,
      "sugars": 4.7,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/2191/front_sv.8.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043002191/mellanmjolk-med-langre-hallbarhet-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002191",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101476218_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101476218_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311043002528",
    "name": "Basmatiris",
    "brands": "Garant",
    "quantity": "1kg",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:seeds",
      "en:cereals-and-their-products",
      "en:cereal-grains",
      "en:rices",
      "en:aromatic-rices",
      "en:indica-rices",
      "en:long-grain-rices",
      "en:basmati-rices"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1504,
      "energyKcal": 354,
      "fat": 0.8,
      "saturatedFat": 0.3,
      "carbohydrates": 78,
      "sugars": 0.2,
      "fiber": 0.5,
      "proteins": 8.7,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/2528/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043002528/basmatiris-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002528",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101488798_ST",
        "name": "Basmatiris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101488798_ST",
        "name": "Basmatiris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311043008346",
    "name": "Fusilli No 57",
    "brands": "Garant",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:pastas",
      "en:fusilli"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1488,
      "energyKcal": 351,
      "fat": 1.4,
      "saturatedFat": 0.3,
      "carbohydrates": 71,
      "sugars": 2.9,
      "fiber": 3.1,
      "proteins": 12,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/8346/front_sv.15.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043008346/fusilli-no-57-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008346",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101548687_ST",
        "name": "Fusilli",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101548687_ST",
        "name": "Fusilli",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311043008353",
    "name": "Gnocchi",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1558.8,
      "energyKcal": 351,
      "fat": 1.4,
      "saturatedFat": null,
      "carbohydrates": 71,
      "sugars": 2.9,
      "fiber": 12,
      "proteins": 12,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043008353/gnocchi-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008353",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101548708_ST",
        "name": "Gnocchi",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101548708_ST",
        "name": "Gnocchi",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311043008377",
    "name": "Farfalle",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1505.4,
      "energyKcal": 357,
      "fat": 1.4,
      "saturatedFat": 0.3,
      "carbohydrates": 72,
      "sugars": 3.1,
      "fiber": 3.2,
      "proteins": 12,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043008377/farfalle-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008377",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101548710_ST",
        "name": "Farfalle",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "willys",
        "productCode": "101548710_ST",
        "name": "Farfalle",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "5410673005847",
    "name": "Ben's Original",
    "brands": "Långkornigt",
    "quantity": "8 x 125 g",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 822.4,
      "energyKcal": 196,
      "fat": 0.6,
      "saturatedFat": null,
      "carbohydrates": 42.5,
      "sugars": null,
      "fiber": 1,
      "proteins": 4.1,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/541/067/300/5847/front_en.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5410673005847/ben-s-original-langkornigt",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005847",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101352142_ST",
        "name": "Långkornigt Ris Boil-in-bag 8x125g",
        "brand": "Ben's Original",
        "packageText": "BEN'S ORIGINAL, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "5900649083097",
    "name": "Matcha latte",
    "brands": "Mokate",
    "quantity": "84g (14g x 6)",
    "categories": [
      "en:beverages-and-beverages-preparations",
      "en:beverages",
      "en:tea-based-beverages"
    ],
    "labels": [],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 1745,
      "energyKcal": 414,
      "fat": 11,
      "saturatedFat": 10,
      "carbohydrates": 72,
      "sugars": 61,
      "fiber": null,
      "proteins": 6.7,
      "salt": 0.43,
      "sodium": 0.172
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/590/064/908/3097/front_en.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5900649083097/matcha-latte-mokate",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5900649083097",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "5900649083097",
        "name": "Snabbkaffe Matcha Latte 6-pack",
        "brand": "Mokate",
        "packageText": "14x6g",
        "sourceUrl": "https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1",
        "retrievedAt": "2026-05-21T01:29:42.710Z"
      }
    ]
  },
  {
    "barcode": "7310050001975",
    "name": "Löfbergs jubileum lätt mörkrost",
    "brands": "Löfbergs",
    "quantity": "450 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:coffees"
    ],
    "labels": [
      "en:rainforest-alliance"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1656.4,
      "energyKcal": 396.6,
      "fat": 15.4,
      "saturatedFat": null,
      "carbohydrates": 40.2,
      "sugars": null,
      "fiber": 19.8,
      "proteins": 14.4,
      "salt": 0.19,
      "sodium": 0.074
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/005/000/1975/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310050001975/lofbergs-jubileum-latt-morkrost",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310050001975",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7310050001975",
        "name": "Bryggkaffe Jubileum Lätt Mörkrost",
        "brand": "Löfbergs",
        "packageText": "450 g",
        "sourceUrl": "https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1",
        "retrievedAt": "2026-05-21T01:29:42.710Z"
      }
    ]
  },
  {
    "barcode": "7310130003554",
    "name": "Snabbmakaroner",
    "brands": "Kungsörnen, Lantmännen",
    "quantity": "1300g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:durum-wheat-pasta",
      "en:common-wheat-pasta",
      "en:durum-wheat-macaroni"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1500,
      "energyKcal": 360,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 3,
      "fiber": 3,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/000/3554/front_sv.5.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130003554/snabbmakaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003554",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101205598_ST",
        "name": "Snabbmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1,3kg",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310130003981",
    "name": "Makaroner",
    "brands": "Kungsörnen",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:pastas"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1509,
      "energyKcal": 360,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 3,
      "fiber": 3,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/000/3981/front_en.13.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130003981/makaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003981",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101216818_ST",
        "name": "Idealmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1,3kg",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310130416170",
    "name": "Ideal makaroner",
    "brands": "Kungsörnen, Lantmännen",
    "quantity": "1000 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:noodles",
      "en:dry-pastas",
      "en:durum-wheat-pasta",
      "en:dry-durum-wheat-pasta",
      "en:durum-wheat-macaroni"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1485,
      "energyKcal": 360,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 72,
      "sugars": 3,
      "fiber": 6.8,
      "proteins": 11,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/041/6170/front_en.26.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130416170/ideal-makaroner-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130416170",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101300386_ST",
        "name": "Idealmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310130418105",
    "name": "Makaroner Fullkornspasta",
    "brands": "Kungsörnen",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:dry-pastas",
      "en:durum-wheat-pasta",
      "en:whole-durum-wheat-pasta"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1473,
      "energyKcal": 350,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 65,
      "sugars": 3,
      "fiber": 7,
      "proteins": 14,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130418105/makaroner-fullkornspasta-kungsornen",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130418105",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100044328_ST",
        "name": "Makaroner Fullkornspasta",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 800g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865000361",
    "name": "Arla mjölk",
    "brands": "Arla",
    "quantity": "1.5 l",
    "categories": [
      "en:dairies",
      "en:milks",
      "en:pasteurised-milks",
      "en:whole-milks",
      "en:cow-milks"
    ],
    "labels": [
      "sv:official-sponsor-of-the-swedish-olymic-team"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 248.7,
      "energyKcal": 59,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 4.6,
      "sugars": 4.6,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.000225,
      "sodium": 0.00009
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/500/0361/front_en.7.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865000361/arla-mjolk",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865000361",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100706158_ST",
        "name": "Mjölk 3%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865001818",
    "name": "Mellanmjölk",
    "brands": "Arla",
    "quantity": "1.5 l",
    "categories": [
      "en:beverages-and-beverages-preparations",
      "en:beverages",
      "en:dairies",
      "en:carbonated-drinks",
      "en:sodas"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 196,
      "energyKcal": 47,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.7,
      "sugars": 4.7,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/500/1818/front_en.5.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865001818/mellanmjolk-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865001818",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100563249_ST",
        "name": "Mellanmjölk 1,5%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865001825",
    "name": "Arla Ko Mellanmjölk",
    "brands": "Arla, Arla Foods, Arla Ko",
    "quantity": "1 l",
    "categories": [
      "en:dairies",
      "en:milks",
      "en:pasteurised-milks",
      "en:cow-milks"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c014047",
      "sv:svensk-mjölk"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 194.9,
      "energyKcal": 47,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.7,
      "sugars": 4.7,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/500/1825/front_sv.7.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865001825/arla-ko-mellanmjolk",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865001825",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100183962_ST",
        "name": "Mellanmjölk 1,5%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865066206",
    "name": "Mild Yoghurt Naturel",
    "brands": "Arla, Arla Foods, Arla Ko",
    "quantity": "3 dl",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:milks",
      "en:yogurts",
      "en:pasteurised-milks"
    ],
    "labels": [
      "en:organic",
      "en:eu-organic",
      "en:fsc",
      "en:fsc-mix",
      "en:se-eko-01",
      "sv:krav",
      "en:fsc-c014047",
      "sv:svensk-mjölk"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 248.7,
      "energyKcal": 59,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 4.6,
      "sugars": 4.6,
      "fiber": 0,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/506/6206/front_sv.13.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865066206/mild-yoghurt-naturel-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865066206",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100814852_ST",
        "name": "Mjölk Eko 3%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 3dl",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865070456",
    "name": "Yoggi original vanilj",
    "brands": "Arla, Arla Foods, Yoggi",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:vanilla-yogurt"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c014047",
      "sv:fsc-c014047"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 320,
      "energyKcal": 80,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 11,
      "sugars": 9.8,
      "fiber": 0.01555,
      "proteins": 3.2,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/507/0456/front_sv.9.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865070456/yoggi-original-vanilj-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865070456",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101024268_ST",
        "name": "Madagaskar Vanilj Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865074522",
    "name": "FÄRSK SVENSK LANTMJÖLK",
    "brands": "Arla",
    "quantity": "1 liter",
    "categories": [
      "en:dairies",
      "en:milks"
    ],
    "labels": [
      "en:organic",
      "en:eu-organic",
      "sv:krav"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 291.4,
      "energyKcal": 70,
      "fat": 4.2,
      "saturatedFat": 2.7,
      "carbohydrates": 4.6,
      "sugars": 4.6,
      "fiber": null,
      "proteins": 3.4,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/507/4522/front_en.34.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865074522/farsk-svensk-lantmjolk-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865074522",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101180932_ST",
        "name": "Lantmjölk Eko 3,8-4,5%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865088482",
    "name": "Yoggi Original Vanilj Jordgubb",
    "brands": "Arla, Arla Foods, Yoggi",
    "quantity": "1 500 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:fermented-dairy-desserts-with-fruits",
      "en:yogurts",
      "en:fruit-yogurts",
      "en:strawberry-yogurts"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "sv:fsc-c014047",
      "sv:svensk-mjölk"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 340,
      "energyKcal": 80,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 12,
      "sugars": 11,
      "fiber": null,
      "proteins": 3.3,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/508/8482/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865088482/yoggi-original-vanilj-jordgubb-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088482",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101210862_ST",
        "name": "Jordgubb Vanilj Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1,5kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865088499",
    "name": "Yoggi Skogsbär",
    "brands": "Arla",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 318.8,
      "energyKcal": 79,
      "fat": 2,
      "saturatedFat": 1.3,
      "carbohydrates": 11,
      "sugars": 11,
      "fiber": null,
      "proteins": 3.4,
      "salt": 0.0775,
      "sodium": 0.031
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865088499/yoggi-skogsbar-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088499",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101210865_ST",
        "name": "Skogsbär Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1,5kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865088505",
    "name": "Mild yoghurt naturell",
    "brands": "Arla",
    "quantity": "1500g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:plain-fermented-dairy-desserts",
      "en:plain-yogurts"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 233.4,
      "energyKcal": 60,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 3.8,
      "sugars": 3.8,
      "fiber": null,
      "proteins": 3.4,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/508/8505/front_en.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865088505/mild-yoghurt-naturell-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088505",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101210850_ST",
        "name": "Naturell Mild Yoghurt 3%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865093363",
    "name": "Yoggi Mini - Blåbär",
    "brands": "Arla",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:fermented-dairy-desserts-with-fruits",
      "en:yogurts",
      "en:fruit-yogurts",
      "en:blueberry-yogurts"
    ],
    "labels": [
      "en:contains-a-source-of-phenylalanine",
      "en:fsc",
      "en:fsc-mix",
      "en:no-added-sugar",
      "en:fsc-c014047"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 139.7,
      "energyKcal": 36,
      "fat": 0.1,
      "saturatedFat": 0.1,
      "carbohydrates": 4.5,
      "sugars": 3.9,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/509/3363/front_sv.24.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865093363/yoggi-mini-blabar-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865093363",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101231441_ST",
        "name": "Mini Blåbär Yoghurt 0,1%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7310865866424",
    "name": "Mild Yoghurt Naturell",
    "brands": "Arla",
    "quantity": "",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts"
    ],
    "labels": [
      "en:fsc"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 233.4,
      "energyKcal": 58,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 3.7,
      "sugars": 3.7,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/586/6424/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865866424/mild-yoghurt-naturell-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865866424",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101288872_ST",
        "name": "Naturell Mild Yoghurt 3%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865866585",
    "name": "Mindre Socker Mild Yoghurt Vanilj 1.5% fett",
    "brands": "Arla",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:vanilla-yogurt"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c014047"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 230.6,
      "energyKcal": 57,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 6.2,
      "sugars": 6.2,
      "fiber": 0,
      "proteins": 4.1,
      "salt": 0.100635,
      "sodium": 0.03952425
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/586/6585/front_sv.18.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865866585/mindre-socker-mild-yoghurt-vanilj-1-5-fett-arla",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865866585",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101288822_ST",
        "name": "Vanilj Mild Yoghurt Mindre Socker 1,5%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7310865877475",
    "name": "Mini Jordgubb",
    "brands": "Yoggi",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 139.7,
      "energyKcal": 36,
      "fat": 0.1,
      "saturatedFat": 0.1,
      "carbohydrates": 4.5,
      "sugars": 3.6,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/587/7475/front_en.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865877475/mini-jordgubb-yoggi",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865877475",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101297879_ST",
        "name": "Mini Jordgubb Yoghurt 0,1%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311041062692",
    "name": "Grovt Bröd Lingon",
    "brands": "Garant",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1051,
      "energyKcal": 251,
      "fat": 3.1,
      "saturatedFat": 0.3,
      "carbohydrates": 44,
      "sugars": 9.4,
      "fiber": 4.8,
      "proteins": 9.1,
      "salt": 0.93,
      "sodium": 0.372
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/106/2692/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311041062692/grovt-brod-lingon-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041062692",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101134176_ST",
        "name": "Lingon Grovt Bröd",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311041062746",
    "name": "Fullkornsgott",
    "brands": "Garant",
    "quantity": "700 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:sliced-breads",
      "en:wholemeal-breads",
      "en:wholemeal-sliced-breads"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1079.6,
      "energyKcal": 257,
      "fat": 4.6,
      "saturatedFat": 0.6,
      "carbohydrates": 40,
      "sugars": 3.2,
      "fiber": 5.3,
      "proteins": 11,
      "salt": 0.885,
      "sodium": 0.354
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/106/2746/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311041062746/fullkornsgott-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041062746",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101134149_ST",
        "name": "Fullkornsgott Osötat Bröd Surdeg Lin Och Solrosfrö",
        "brand": "Garant",
        "packageText": "GARANT, 700g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311041070390",
    "name": "Mellan Mjölk",
    "brands": "Axfood, Garant",
    "quantity": "1L",
    "categories": [
      "en:dairies",
      "en:milks",
      "en:semi-skimmed-milks"
    ],
    "labels": [
      "en:organic",
      "en:eu-organic",
      "en:se-eko-01",
      "sv:krav"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 194.9,
      "energyKcal": 47,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.7,
      "sugars": 4.7,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/107/0390/front_sv.20.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311041070390/mellan-mjolk-axfood",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041070390",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101187327_ST",
        "name": "Mellanmjölk Ekologisk 1,5%",
        "brand": "Garant Eko",
        "packageText": "GARANT EKO, 1l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311043002498",
    "name": "Jasminris, Långkornigt & Aromatiskt, Okokt",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1464,
      "energyKcal": 350,
      "fat": 0.7,
      "saturatedFat": 0.3,
      "carbohydrates": 79,
      "sugars": 0.2,
      "fiber": 0.5,
      "proteins": 7.1,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/2498/front_sv.6.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043002498/jasminris-langkornigt-aromatiskt-okokt-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002498",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101488555_ST",
        "name": "Jasminris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311043002504",
    "name": "Jasminris",
    "brands": "GARANT",
    "quantity": "2 kg",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1465,
      "energyKcal": 350,
      "fat": 0.7,
      "saturatedFat": 0.3,
      "carbohydrates": 79,
      "sugars": 0.2,
      "fiber": 0.5,
      "proteins": 7.1,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/2504/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043002504/jasminris-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002504",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101488556_ST",
        "name": "Jasminris",
        "brand": "Garant",
        "packageText": "GARANT, 2kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311043005727",
    "name": "feta",
    "brands": "garant",
    "quantity": "150g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:greek-cheeses",
      "en:feta"
    ],
    "labels": [],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 1143,
      "energyKcal": 276,
      "fat": 23,
      "saturatedFat": 17,
      "carbohydrates": 0.7,
      "sugars": 0.7,
      "fiber": null,
      "proteins": 17,
      "salt": 2.3,
      "sodium": 0.92
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043005727/feta-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043005727",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101533198_ST",
        "name": "Fetaost Block 23%",
        "brand": "Garant",
        "packageText": "GARANT, 150g",
        "sourceUrl": "https://www.hemkop.se/search?q=ost",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311043008360",
    "name": "Penne Rigate",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1487.6,
      "energyKcal": 351,
      "fat": 1.4,
      "saturatedFat": 0.3,
      "carbohydrates": 71,
      "sugars": 2.9,
      "fiber": 3.1,
      "proteins": 12,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043008360/penne-rigate-garant",
    "sourceUrl": "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008360",
    "retrievedAt": "2026-05-22T08:25:07.875Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101548709_ST",
        "name": "Penne Rigate",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  }
];
