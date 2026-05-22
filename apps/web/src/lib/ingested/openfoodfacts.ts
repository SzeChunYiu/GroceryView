// AUTO-GENERATED from the official OpenFoodFacts world data export.
// Source URL: https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
// Retrieved: 2026-05-22T09:07:37.774Z
// Row count: 147 real barcode+nutrition enrichment rows matched to existing ingested retailer products.
// Candidate barcode count checked from current Willys/Hemkop/Coop ingested rows: 277. No-match or nutrition-empty products were skipped.

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
  retrievedAt: "2026-05-22T09:07:37.774Z",
  rowCount: 147,
  candidateBarcodeCount: 277,
  sourceUrl: "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz"
} as const;

export const openFoodFactsProducts: OpenFoodFactsIngestedProduct[] = [
  {
    "barcode": "3415581520927",
    "name": "Fruit Collection",
    "brands": "Häagen-Dazs",
    "quantity": "3x81g , 1x83g",
    "categories": [
      "en:desserts",
      "en:frozen-foods",
      "en:frozen-desserts",
      "en:ice-creams-and-sorbets",
      "en:ice-creams",
      "en:ice-cream-tubs"
    ],
    "labels": [
      "en:no-gluten"
    ],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 934.567901234568,
      "energyKcal": 223.456790123457,
      "fat": 13.5802469135802,
      "saturatedFat": 9.01234567901234,
      "carbohydrates": 21.6049382716049,
      "sugars": 20.7407407407407,
      "fiber": 0.493827160493827,
      "proteins": 3.58024691358025,
      "salt": 0.132716049382716,
      "sodium": 0.0530864197530864
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/341/558/152/0927/front_en.34.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/3415581520927/fruit-collection-haagen-dazs",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3415581520927",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101469546_ST",
        "name": "Glass 4-pack",
        "brand": "Häagen-Dazs",
        "packageText": "4x95ml",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "3523230062633",
    "name": "Chèvre",
    "brands": "Soignon",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1208,
      "energyKcal": 291,
      "fat": 23,
      "saturatedFat": 16,
      "carbohydrates": 1,
      "sugars": 1,
      "fiber": null,
      "proteins": 20,
      "salt": 1.475,
      "sodium": 0.59
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/3523230062633/chevre-soignon",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=3523230062633",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101511398_ST",
        "name": "Getost",
        "brand": "SOIGNON",
        "packageText": "125-150g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "4016241051035",
    "name": "Mild Kvarg Vanilj",
    "brands": "Arla",
    "quantity": "350 g",
    "categories": [],
    "labels": [
      "en:contains-a-source-of-phenylalanine"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 240.3,
      "energyKcal": 60,
      "fat": 0.2,
      "saturatedFat": 0.1,
      "carbohydrates": 4,
      "sugars": 3.5,
      "fiber": null,
      "proteins": 9.7,
      "salt": 0.0975,
      "sodium": 0.039
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/401/624/105/1035/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/4016241051035/mild-kvarg-vanilj-arla",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4016241051035",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101719942_ST",
        "name": "Mild kvarg",
        "brand": "Arla",
        "packageText": "450g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "4770513127216",
    "name": "Kycklingbröst filé",
    "brands": "TOP CHOICE POULTRY",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 376.5,
      "energyKcal": 89,
      "fat": 1.4,
      "saturatedFat": 0.5,
      "carbohydrates": 1.1,
      "sugars": 0.5,
      "fiber": null,
      "proteins": 18,
      "salt": 0.56,
      "sodium": 0.224
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/4770513127216/kycklingbrost-file-top-choice-poultry",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=4770513127216",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101860922_ST",
        "name": "Kycklingbröstfilé",
        "brand": "TOP CHOICE",
        "packageText": "800g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "5000112637939",
    "name": "Coca-Cola Zero Sugar",
    "brands": "Coca-Cola",
    "quantity": "330 ml",
    "categories": [
      "en:beverages-and-beverages-preparations",
      "en:beverages",
      "en:carbonated-drinks",
      "en:artificially-sweetened-beverages",
      "en:sodas",
      "en:diet-beverages",
      "en:non-alcoholic-beverages",
      "en:colas",
      "en:diet-sodas",
      "en:diet-cola-soft-drink"
    ],
    "labels": [
      "en:contains-a-source-of-phenylalanine"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1.4,
      "energyKcal": 0.3,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": null,
      "proteins": 0,
      "salt": 0.02,
      "sodium": 0.008
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/500/011/263/7939/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5000112637939/coca-cola-zero-sugar",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5000112637939",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101291077_ST",
        "name": "Läsk",
        "brand": "Coca-Cola, Fanta, Sprite",
        "packageText": "33cl",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "5059319023229",
    "name": "Frosties",
    "brands": "Kellogg's, Kellogg's - KELLOG Company",
    "quantity": "620g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:breakfasts",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breakfast-cereals",
      "en:flakes",
      "en:cereal-flakes",
      "en:extruded-cereals"
    ],
    "labels": [
      "en:kosher"
    ],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 1594,
      "energyKcal": 375,
      "fat": 0.6,
      "saturatedFat": 0.1,
      "carbohydrates": 87,
      "sugars": 37,
      "fiber": 2,
      "proteins": 4.5,
      "salt": 0.83,
      "sodium": 0.332
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/505/931/902/3229/front_en.16.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5059319023229/frosties-kellogg-s",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5059319023229",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101502692_ST",
        "name": "Flingor",
        "brand": "KELLOGG'S",
        "packageText": "450-750g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005847",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5410673005861",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101352143_ST",
        "name": "Långkornigt Ris",
        "brand": "Ben's Original",
        "packageText": "BEN'S ORIGINAL, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101352143_ST",
        "name": "Långkornigt Ris",
        "brand": "Ben's Original",
        "packageText": "BEN'S ORIGINAL, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "5740301203124",
    "name": "Torskrygg",
    "brands": "Royal Greenland",
    "quantity": "",
    "categories": [],
    "labels": [
      "en:sustainable",
      "en:sustainable-fishery",
      "en:sustainable-seafood-msc"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 324.5,
      "energyKcal": 77,
      "fat": 0.5,
      "saturatedFat": null,
      "carbohydrates": 0,
      "sugars": null,
      "fiber": null,
      "proteins": 18,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/574/030/120/3124/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/5740301203124/torskrygg-royal-greenland",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5740301203124",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "5740301203124",
        "name": "Torskryggfilé 3-pack",
        "brand": "Royal Greenland",
        "packageText": "375 g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=5900649083097",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "6408432088933",
    "name": "Valio Vanilj Original Slät",
    "brands": "Valio, Valio Oy",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:flavoured-fermented-dairy-desserts",
      "en:vanilla-yogurt",
      "en:bifidus-yogurts",
      "en:flavoured-bifidus-yogurts",
      "en:flavoured-yogurts"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c014047"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 311,
      "energyKcal": 74,
      "fat": 2.1,
      "saturatedFat": 1.2,
      "carbohydrates": 9.5,
      "sugars": 9.2,
      "fiber": null,
      "proteins": 3.6,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/640/843/208/8933/front_sv.27.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/6408432088933/valio-vanilj-original-slat",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=6408432088933",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100300906_ST",
        "name": "Vaniljyoghurt",
        "brand": "Valio",
        "packageText": "1kg",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7300200630001",
    "name": "Nötspett - Svartpeppar",
    "brands": "Scan",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 484.5,
      "energyKcal": 110,
      "fat": 3.4,
      "saturatedFat": 1.4,
      "carbohydrates": 1.1,
      "sugars": 0.2,
      "fiber": null,
      "proteins": 20,
      "salt": 1.0825,
      "sodium": 0.433
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/730/020/063/0001/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7300200630001/notspett-svartpeppar-scan",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300200630001",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101548724_ST",
        "name": "Nötspett",
        "brand": "SCAN",
        "packageText": "400g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7300200730008",
    "name": "Grillspett Mild Chili",
    "brands": "Scan",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 430.2,
      "energyKcal": 100,
      "fat": 2.3,
      "saturatedFat": 0.9,
      "carbohydrates": 1.3,
      "sugars": 0.5,
      "fiber": null,
      "proteins": 19,
      "salt": 1.5725,
      "sodium": 0.629
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7300200730008/grillspett-mild-chili-scan",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300200730008",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101548725_ST",
        "name": "Grillspett",
        "brand": "SCAN",
        "packageText": "400g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7300206718000",
    "name": "Bacon",
    "brands": "HKScan, Scan",
    "quantity": "420 g (3 x 140 g)",
    "categories": [
      "en:meats-and-their-products",
      "en:meats",
      "en:pork-and-its-products",
      "en:pork",
      "en:bacon",
      "en:sliced-bacon"
    ],
    "labels": [],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 1257,
      "energyKcal": 300,
      "fat": 28,
      "saturatedFat": 11,
      "carbohydrates": 0,
      "sugars": null,
      "fiber": null,
      "proteins": 13,
      "salt": 2.1625,
      "sodium": 0.865
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/730/020/671/8000/front_sv.16.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7300206718000/bacon-hkscan",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300206718000",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7300206718000",
        "name": "Bacon 3-pack",
        "brand": "Scan",
        "packageText": "3x140g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7300207071005",
    "name": "Klassisk Grillkorv",
    "brands": "Scan",
    "quantity": "640g",
    "categories": [
      "en:meats-and-their-products",
      "en:meats",
      "en:prepared-meats",
      "en:sausages"
    ],
    "labels": [],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 1066,
      "energyKcal": 250,
      "fat": 21,
      "saturatedFat": 8,
      "carbohydrates": 8,
      "sugars": 0.5,
      "fiber": null,
      "proteins": 9,
      "salt": 2.2,
      "sodium": 0.88
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/730/020/707/1005/front_en.9.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7300207071005/klassisk-grillkorv-scan",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300207071005",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100308301_ST",
        "name": "Grillkorv",
        "brand": "Scan",
        "packageText": "400-640g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      },
      {
        "chain": "coop",
        "productCode": "7300207071005",
        "name": "Grillkorv med tunt skinn",
        "brand": "Scan",
        "packageText": "640 g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7300328530009",
    "name": "Minut Filér",
    "brands": "Kronfågel",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 473.5,
      "energyKcal": 120,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 0.5,
      "sugars": 0.5,
      "fiber": null,
      "proteins": 23,
      "salt": 0.1975,
      "sodium": 0.079
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7300328530009/minut-filer-kronfagel",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7300328530009",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101599328_ST",
        "name": "Kycklingfilé",
        "brand": "KRONFÅGEL",
        "packageText": "550-600g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310050001975",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003530",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101205623_ST",
        "name": "Snabbmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101205623_ST",
        "name": "Snabbmakaroner",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003547",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101205621_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101205621_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 750g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003554",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003561",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101205570_ST",
        "name": "Idealmakaroner Gammaldags",
        "brand": "Kungsörnen",
        "packageText": "KUNGSÖRNEN, 1,3kg",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101205570_ST",
        "name": "Idealmakaroner Gammaldags",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130003981",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130416170",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130418105",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7310130801709",
    "name": "Start! Naturell granola",
    "brands": "Lantmännen, Start!",
    "quantity": "750g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:breakfasts",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breakfast-cereals",
      "en:mueslis"
    ],
    "labels": [
      "en:source-of-fibre",
      "en:sustainable-farming",
      "en:high-fibres",
      "en:whole-grain",
      "en:lantmannen"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1799,
      "energyKcal": 430,
      "fat": 14,
      "saturatedFat": 1.8,
      "carbohydrates": 63,
      "sugars": 20,
      "fiber": 7.1,
      "proteins": 9,
      "salt": 0.51,
      "sodium": 0.204
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/013/080/1709/front_fi.71.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310130801709/start-naturell-granola-lantmannen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310130801709",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100638035_ST",
        "name": "Start! Naturell",
        "brand": "Lantmännen",
        "packageText": "750g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7310240060072",
    "name": "Felix Tomatketchup Original",
    "brands": "FELIX",
    "quantity": "1kg",
    "categories": [
      "en:condiments",
      "en:sauces",
      "en:tomato-sauces",
      "en:ketchup",
      "en:groceries"
    ],
    "labels": [
      "en:no-preservatives"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 360,
      "energyKcal": 82,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 18,
      "sugars": 17,
      "fiber": 0,
      "proteins": 1.3,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/024/006/0072/front_sv.24.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310240060072/felix-tomatketchup-original",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310240060072",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101222172_ST",
        "name": "Ketchup",
        "brand": "FELIX",
        "packageText": "980g • 1kg",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7310240120189",
    "name": "Vegoschnitzel",
    "brands": "Anamma",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 965.333333333333,
      "energyKcal": 230.666666666667,
      "fat": 13.3333333333333,
      "saturatedFat": null,
      "carbohydrates": 13.3333333333333,
      "sugars": 0.933333333333333,
      "fiber": null,
      "proteins": 12.5333333333333,
      "salt": 1.02666666666667,
      "sodium": 0.410666666666667
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/024/012/0189/front_en.5.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310240120189/vegoschnitzel-anamma",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310240120189",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101287807_ST",
        "name": "Fryst vegetariskt",
        "brand": "Anamma",
        "packageText": "300-450g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7310500188454",
    "name": "Tasty Bites",
    "brands": "Findus",
    "quantity": "250g",
    "categories": [
      "en:frozen-foods",
      "en:meals",
      "en:pizzas-pies-and-quiches",
      "en:pizzas",
      "en:frozen-pizzas-and-pies",
      "en:frozen-pizzas"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1123.84,
      "energyKcal": 260,
      "fat": 8.8,
      "saturatedFat": 4,
      "carbohydrates": 35.2,
      "sugars": 3.2,
      "fiber": 2.88,
      "proteins": 10.4,
      "salt": 0.866,
      "sodium": 0.3464
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/050/018/8454/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310500188454/tasty-bites-findus",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310500188454",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101607949_ST",
        "name": "Pizzapockets 2-pack",
        "brand": "FINDUS",
        "packageText": "250g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7310628005572",
    "name": "Cheezy Chorre",
    "brands": "Sibylla",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1104.7,
      "energyKcal": 268,
      "fat": 22,
      "saturatedFat": null,
      "carbohydrates": 5.1,
      "sugars": null,
      "fiber": null,
      "proteins": 12,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310628005572/cheezy-chorre-sibylla",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310628005572",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101837666_ST",
        "name": "Grillkorv",
        "brand": "SIBYLLA",
        "packageText": "320-350g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7310628008894",
    "name": "Varmkorv",
    "brands": "Lithells",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1158.7,
      "energyKcal": 280,
      "fat": 23,
      "saturatedFat": 9,
      "carbohydrates": 9.9,
      "sugars": 2.5,
      "fiber": null,
      "proteins": 8.2,
      "salt": 1.9675,
      "sodium": 0.787
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310628008894/varmkorv-lithells",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310628008894",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101512430_ST",
        "name": "Varmkorv",
        "brand": "Lithells",
        "packageText": "360g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865000361",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865001818",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865001825",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7310865005168",
    "name": "Svenskt Smör - Normalsaltat",
    "brands": "Arla",
    "quantity": "500g",
    "categories": [
      "en:dairies",
      "en:fats",
      "en:spreads",
      "en:spreadable-fats",
      "en:animal-fats",
      "en:dairy-spreads",
      "en:milkfat",
      "en:butters",
      "en:salted-butters"
    ],
    "labels": [],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 3056.1,
      "energyKcal": 739,
      "fat": 82,
      "saturatedFat": 52,
      "carbohydrates": 0.7,
      "sugars": 0.7,
      "fiber": null,
      "proteins": 0.6,
      "salt": 1.18,
      "sodium": 0.472
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/500/5168/front_sv.15.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865005168/svenskt-smor-normalsaltat-arla",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865005168",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101017249_ST",
        "name": "Smör",
        "brand": "SVENSKT SMÖR",
        "packageText": "500g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101017249_ST",
        "name": "Svenskt smör",
        "brand": "Arla",
        "packageText": "500g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      },
      {
        "chain": "coop",
        "productCode": "7310865005168",
        "name": "Smör Normalsaltat",
        "brand": "Svenskt Smör från Arla",
        "packageText": "500g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018465",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100050640_ST",
        "name": "Jordgubb Smultron Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "100050640_ST",
        "name": "Jordgubb Smultron Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018472",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100137095_ST",
        "name": "Skogsbär Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "100137095_ST",
        "name": "Skogsbär Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865018496",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100986033_ST",
        "name": "Samoa Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "100986033_ST",
        "name": "Samoa Original Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865066206",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865070456",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865074522",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088482",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088499",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088505",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865088512",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101210853_ST",
        "name": "Vanilj Mild Yoghurt 2%",
        "brand": "Arla Ko",
        "packageText": "ARLA KO, 1,5kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101210853_ST",
        "name": "Vanilj Mild Yoghurt 2%",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865093363",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7310865095466",
    "name": "Arla Köket Grekisk Yoghurt 10 %",
    "brands": "Arla Köket",
    "quantity": "1000 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:greek-style-yogurts"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 500.9,
      "energyKcal": 120,
      "fat": 10,
      "saturatedFat": 6.4,
      "carbohydrates": 3.5,
      "sugars": 3.5,
      "fiber": null,
      "proteins": 4.2,
      "salt": 0.0975,
      "sodium": 0.039
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/509/5466/front_en.43.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310865095466/arla-koket-grekisk-yoghurt-10",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865095466",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101252347_ST",
        "name": "Grekisk yoghurt",
        "brand": "Arla",
        "packageText": "1kg",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      },
      {
        "chain": "coop",
        "productCode": "7310865095466",
        "name": "Grekisk yoghurt 10%",
        "brand": "Arla Köket®",
        "packageText": "1000 g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865866424",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865866585",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310865877475",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7310867561020",
    "name": "Tropisk Juice",
    "brands": "Bravo",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:beverages",
      "en:plant-based-beverages",
      "en:fruit-based-beverages",
      "en:juices-and-nectars",
      "en:fruit-juices"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 153,
      "energyKcal": 45,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 9,
      "sugars": 9,
      "fiber": null,
      "proteins": 0,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/086/756/1020/front_en.21.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7310867561020/tropisk-juice-bravo",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7310867561020",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7310867561020",
        "name": "Juice Tropisk",
        "brand": "Bravo",
        "packageText": "2 L",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7311041062654",
    "name": "Pesto Alla Genovese",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1922.8,
      "energyKcal": 470,
      "fat": 46,
      "saturatedFat": 6,
      "carbohydrates": 7.2,
      "sugars": 3.3,
      "fiber": 0.4,
      "proteins": 5.6,
      "salt": 2.95,
      "sodium": 0.003
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/106/2654/front_en.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311041062654/pesto-alla-genovese-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041062654",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101135095_ST",
        "name": "Pesto",
        "brand": "Garant",
        "packageText": "200g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041062692",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041062746",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041070390",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7311041071748",
    "name": "Basturökt Skinka",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 377.9,
      "energyKcal": 89,
      "fat": 1.3,
      "saturatedFat": 0,
      "carbohydrates": 1.4,
      "sugars": 1.3,
      "fiber": null,
      "proteins": 18,
      "salt": 2.7525,
      "sodium": 1.101
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311041071748/basturokt-skinka-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311041071748",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101183319_ST",
        "name": "Skivat smörgåspålägg",
        "brand": "GARANT",
        "packageText": "80-120g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101183319_ST",
        "name": "Smörgåspålägg",
        "brand": "Garant",
        "packageText": "80-120g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002191",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101476218_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101476218_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002498",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002504",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043002528",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101488798_ST",
        "name": "Basmatiris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101488798_ST",
        "name": "Basmatiris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043005727",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "barcode": "7311043005802",
    "name": "Riven Texmexost",
    "brands": "Garant",
    "quantity": "150G",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:soft-cheeses",
      "en:cut-cheese"
    ],
    "labels": [],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 1501,
      "energyKcal": 359,
      "fat": 29,
      "saturatedFat": 19,
      "carbohydrates": 1.6,
      "sugars": 0,
      "fiber": 0,
      "proteins": 24,
      "salt": 1.4,
      "sodium": 0.56
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/300/5802/front_en.31.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043005802/riven-texmexost-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043005802",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101532475_ST",
        "name": "Riven ost",
        "brand": "Garant",
        "packageText": "150g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008346",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101548687_ST",
        "name": "Fusilli",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101548687_ST",
        "name": "Fusilli",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008353",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101548708_ST",
        "name": "Gnocchi",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101548708_ST",
        "name": "Gnocchi",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008360",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
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
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043008377",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101548710_ST",
        "name": "Farfalle",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101548710_ST",
        "name": "Farfalle",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311043009091",
    "name": "Crunchy Fries",
    "brands": "Garant",
    "quantity": "750 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:frozen-foods",
      "en:chips-and-fries",
      "en:potatoes-and-their-products",
      "en:fries",
      "en:frozen-fried-potatoes",
      "en:frozen-fries"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 602.3,
      "energyKcal": 143,
      "fat": 3.7,
      "saturatedFat": 0.4,
      "carbohydrates": 23,
      "sugars": 0,
      "fiber": 2.5,
      "proteins": 3.2,
      "salt": 0.3925,
      "sodium": 0.157
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043009091/crunchy-fries-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043009091",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101551759_ST",
        "name": "Crunchy fries",
        "brand": "GARANT",
        "packageText": "750g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311043011957",
    "name": "Ekologisk Blandfärs",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1100,
      "energyKcal": 265,
      "fat": 21,
      "saturatedFat": 9.2,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": null,
      "proteins": 19,
      "salt": 0.1975,
      "sodium": 0.079
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/301/1957/front_fr.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043011957/ekologisk-blandfars-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043011957",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101599080_ST",
        "name": "Ekologisk blandfärs",
        "brand": "Garant Eko",
        "packageText": "500g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7311043014798",
    "name": "Smokey Ribs",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 906.5,
      "energyKcal": 221,
      "fat": 16,
      "saturatedFat": null,
      "carbohydrates": 1.5,
      "sugars": 1.2,
      "fiber": null,
      "proteins": 17,
      "salt": 2.1625,
      "sodium": 0.865
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043014798/smokey-ribs-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043014798",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101748537_ST",
        "name": "Ribs",
        "brand": "GARANT",
        "packageText": "445-495g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311043014842",
    "name": "Rostad Lök",
    "brands": "Eldorado",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 2516,
      "energyKcal": 610,
      "fat": 46,
      "saturatedFat": 23,
      "carbohydrates": 40,
      "sugars": 10,
      "fiber": 4,
      "proteins": 6,
      "salt": 1.0825,
      "sodium": 0.433
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043014842/rostad-lok-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043014842",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101662413_ST",
        "name": "Rostad lök",
        "brand": "ELDORADO",
        "packageText": "150g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311043015535",
    "name": "Skagenröra",
    "brands": "Redo Att Äta",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1883.5,
      "energyKcal": 450,
      "fat": 47,
      "saturatedFat": 3.4,
      "carbohydrates": 4.9,
      "sugars": 2.1,
      "fiber": null,
      "proteins": 3.6,
      "salt": 1.3775,
      "sodium": 0.551
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/301/5535/front_sv.8.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043015535/skagenrora-redo-att-ata",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043015535",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101677312_ST",
        "name": "Räksallad, skagenröra",
        "brand": "REDO",
        "packageText": "400g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311043020201",
    "name": "Stora limpan",
    "brands": "Garant",
    "quantity": "900 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breads",
      "en:sliced-breads"
    ],
    "labels": [
      "xx:fran-sverige",
      "sv:går-utmärkt-att-frysa"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1126,
      "energyKcal": 266,
      "fat": 2.2,
      "saturatedFat": 0.3,
      "carbohydrates": 50,
      "sugars": 8.1,
      "fiber": 3.4,
      "proteins": 9.8,
      "salt": 0.95,
      "sodium": 0.38
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/104/302/0201/front_sv.7.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311043020201/stora-limpan-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311043020201",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101736405_ST",
        "name": "Limpan, frölimpa",
        "brand": "GARANT",
        "packageText": "570-900g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311070003543",
    "name": "Hönökaka",
    "brands": "Pågen",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1103.1,
      "energyKcal": 263,
      "fat": 3.2,
      "saturatedFat": 0.5,
      "carbohydrates": 48,
      "sugars": 7.5,
      "fiber": 2.6,
      "proteins": 8.7,
      "salt": 0.885,
      "sodium": 0.354
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/000/3543/front_sv.6.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070003543/honokaka-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070003543",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101332488_ST",
        "name": "Hönökaka 4-pack",
        "brand": "Pågen",
        "packageText": "PÅGEN, 450g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311070003567",
    "name": "Hönö Färsk Jollekaka",
    "brands": "Pågen",
    "quantity": "400 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1287.7,
      "energyKcal": 295.889,
      "fat": 4.5,
      "saturatedFat": 0.5,
      "carbohydrates": 55.3,
      "sugars": 9.7,
      "fiber": 3.3,
      "proteins": 9.1,
      "salt": 0.75,
      "sodium": 0.3
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/000/3567/front_sv.9.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070003567/hono-farsk-jollekaka-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070003567",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101332489_ST",
        "name": "Jollekaka Hönö 6-pack",
        "brand": "Pågen",
        "packageText": "PÅGEN, 400g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311070004106",
    "name": "Grekiskt Lantbröd",
    "brands": "Pågen",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1096,
      "energyKcal": 259,
      "fat": 2.6,
      "saturatedFat": 0.4,
      "carbohydrates": 48,
      "sugars": 3.4,
      "fiber": 3,
      "proteins": 9.4,
      "salt": 1.2775,
      "sodium": 0.511
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070004106/grekiskt-lantbrod-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070004106",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101599065_ST",
        "name": "Grekiskt Lantbröd",
        "brand": "Pågen",
        "packageText": "PÅGEN, 560g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311070008159",
    "name": "Levain rustikt surdegsbröd",
    "brands": "Pågen",
    "quantity": "650 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:sliced-breads"
    ],
    "labels": [
      "xx:svenskt-mjol-fran-egen-kvarn",
      "sv:osötat"
    ],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 991.6,
      "energyKcal": 235,
      "fat": 1.3,
      "saturatedFat": 0.3,
      "carbohydrates": 44,
      "sugars": 3.2,
      "fiber": 3.4,
      "proteins": 9.9,
      "salt": 8.30375,
      "sodium": 3.3215
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/000/8159/front_sv.40.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070008159/levain-rustikt-surdegsbrod-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070008159",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101261349_ST",
        "name": "Levain",
        "brand": "Pågen",
        "packageText": "PÅGEN, 650g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101261349_ST",
        "name": "Levain",
        "brand": "Pågen",
        "packageText": "PÅGEN, 650g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311070008432",
    "name": "RågLevain",
    "brands": "Pågen",
    "quantity": "650 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:sliced-breads",
      "en:sourdough-breads",
      "en:sourdough-sliced-breads"
    ],
    "labels": [
      "en:no-preservatives",
      "en:no-sweeteners-added",
      "xx:svenskt-mjol-fran-egen-kvarn"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 985,
      "energyKcal": 235,
      "fat": 1.5,
      "saturatedFat": 0.3,
      "carbohydrates": 47.2,
      "sugars": 3.6,
      "fiber": 4.2,
      "proteins": 9.3,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/000/8432/front_sv.31.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070008432/raglevain-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070008432",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101275217_ST",
        "name": "Råglevain",
        "brand": "Pågen",
        "packageText": "PÅGEN, 650g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101275217_ST",
        "name": "Råglevain",
        "brand": "Pågen",
        "packageText": "PÅGEN, 650g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311070008463",
    "name": "JätteFranska",
    "brands": "Pågen",
    "quantity": "1.1 kg",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breads",
      "en:sliced-breads",
      "en:white-breads",
      "en:bread-loaves"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1139.5,
      "energyKcal": 269,
      "fat": 3.7,
      "saturatedFat": 0.4,
      "carbohydrates": 50,
      "sugars": 2.7,
      "fiber": 2.5,
      "proteins": 7.8,
      "salt": 1.3775,
      "sodium": 0.551
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/000/8463/front_sv.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070008463/jattefranska-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070008463",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101275233_ST",
        "name": "Jättefranska",
        "brand": "Pågen",
        "packageText": "PÅGEN, 1,1 kg",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311070330243",
    "name": "Lingon Grova Special",
    "brands": "Pagen, Pågen",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:rye-and-wheat-breads",
      "en:rye-breads"
    ],
    "labels": [
      "en:green-dot",
      "en:keyhole"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1167,
      "energyKcal": 279,
      "fat": 4.6,
      "saturatedFat": 0.6,
      "carbohydrates": 46,
      "sugars": 5,
      "fiber": 6,
      "proteins": 11,
      "salt": 0.9825,
      "sodium": 0.393
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/033/0243/front_en.38.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070330243/lingon-grova-special-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070330243",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7311070330243",
        "name": "Lingongrova Special",
        "brand": "Pågen",
        "packageText": "500 g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7311070330328",
    "name": "Guldkorn",
    "brands": "Pågen",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:rye-and-wheat-breads",
      "en:sliced-breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1160.8,
      "energyKcal": 272,
      "fat": 2.4,
      "saturatedFat": 0.4,
      "carbohydrates": 51,
      "sugars": 8.2,
      "fiber": 4.8,
      "proteins": 9.8,
      "salt": 1.1,
      "sodium": 0.433
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/033/0328/front_sv.18.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070330328/guldkorn-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070330328",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100168649_ST",
        "name": "Guldkorn",
        "brand": "Pågen",
        "packageText": "PÅGEN, 500g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "100168649_ST",
        "name": "Guldkorn",
        "brand": "Pågen",
        "packageText": "PÅGEN, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311070337297",
    "name": "Hönö Färsk Skärgårdskaka",
    "brands": "Pågen",
    "quantity": "750 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:flatbreads",
      "en:white-breads",
      "en:wheat-breads",
      "en:wheat-flatbreads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1238,
      "energyKcal": 296,
      "fat": 4.5,
      "saturatedFat": 0.5,
      "carbohydrates": 52,
      "sugars": 9.7,
      "fiber": 3.3,
      "proteins": 9.1,
      "salt": 0.7375,
      "sodium": 0.295
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/033/7297/front_en.12.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070337297/hono-farsk-skargardskaka-pagen",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070337297",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101203170_ST",
        "name": "Skärgårdskaka Hönö 18-pack",
        "brand": "Pågen",
        "packageText": "PÅGEN, 750g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101203170_ST",
        "name": "Skärgårdskaka Hönö 18-pack",
        "brand": "Pågen",
        "packageText": "PÅGEN, 750g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311070338188",
    "name": "Pågen Limpan",
    "brands": "Pågen",
    "quantity": "900 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:rye-and-wheat-breads",
      "en:sliced-breads",
      "en:white-breads",
      "sv:matbröd"
    ],
    "labels": [
      "en:no-preservatives"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1147.9,
      "energyKcal": 275,
      "fat": 1.9,
      "saturatedFat": 0.7,
      "carbohydrates": 52,
      "sugars": 11,
      "fiber": 3.8,
      "proteins": 9.6,
      "salt": 0,
      "sodium": 0.2149
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/107/033/8188/front_en.82.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311070338188/pagen-limpan",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311070338188",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100548542_ST",
        "name": "Pågenlimpan",
        "brand": "Pågen",
        "packageText": "PÅGEN, 900g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "100548542_ST",
        "name": "Pågenlimpan",
        "brand": "Pågen",
        "packageText": "PÅGEN, 900g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7311311014017",
    "name": "Grillkrydda",
    "brands": "Santa Maria",
    "quantity": "89 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:condiments",
      "en:spices",
      "en:groceries"
    ],
    "labels": [],
    "nutriscoreGrade": "not-applicable",
    "nutritionPer100g": {
      "energyKj": 194.401025,
      "energyKcal": 46.402125,
      "fat": 0.8925625,
      "saturatedFat": 0.321452625,
      "carbohydrates": 6.262485,
      "sugars": 1.8581975,
      "fiber": 3.14346875,
      "proteins": 1.73640125,
      "salt": 36.510645275,
      "sodium": 14.5967262925
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/131/101/4017/front_sv.30.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311311014017/grillkrydda-santa-maria",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311311014017",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101282283_ST",
        "name": "Grillkrydda",
        "brand": "SANTA MARIA",
        "packageText": "59-120g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7311870012202",
    "name": "Cherrylicious",
    "brands": "Yoggi",
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
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 317.1,
      "energyKcal": 79,
      "fat": 2,
      "saturatedFat": null,
      "carbohydrates": 11,
      "sugars": null,
      "fiber": null,
      "proteins": 3.3,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/187/001/2202/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311870012202/cherrylicious-yoggi",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311870012202",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101552868_ST",
        "name": "Cherry-licious Yoghurt 2%",
        "brand": "Yoggi",
        "packageText": "YOGGI, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=yoghurt",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7311870012257",
    "name": "Arla Yougurt",
    "brands": "Arla",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 270.6,
      "energyKcal": 68,
      "fat": 1.8,
      "saturatedFat": 1.2,
      "carbohydrates": 8.9,
      "sugars": 8.6,
      "fiber": null,
      "proteins": 3.1,
      "salt": 0.0775,
      "sodium": 0.031
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/187/001/2257/front_en.11.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7311870012257/arla-yougurt",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7311870012257",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101599593_ST",
        "name": "Jordgubb Familjefavoriter Yoghurt 1,8%",
        "brand": "Arla",
        "packageText": "ARLA, 1,5kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7312560057404",
    "name": "Svenska Havreringbar",
    "brands": "Fazer Kvarn, Frebaco, Frebaco Kvarn",
    "quantity": "350 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:breakfasts",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:breakfast-cereals",
      "en:extruded-cereals"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:keyhole",
      "en:no-added-sugar",
      "sv:fsc-c008592",
      "sv:from-sweden"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1674.5,
      "energyKcal": 370,
      "fat": 6.9,
      "saturatedFat": 1.3,
      "carbohydrates": 68,
      "sugars": 2.3,
      "fiber": 7.4,
      "proteins": 12,
      "salt": 2,
      "sodium": 0.8
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/256/005/7404/front_sv.21.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7312560057404/svenska-havreringbar-fazer-kvarn",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7312560057404",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101225562_ST",
        "name": "Havreflingor",
        "brand": "Frebaco Kvarn",
        "packageText": "350g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7313160020447",
    "name": "Delikatess Potatissallad Klassik",
    "brands": "Rydbergs",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1045.2,
      "energyKcal": 250,
      "fat": 22,
      "saturatedFat": 1.7,
      "carbohydrates": 12,
      "sugars": 1.1,
      "fiber": null,
      "proteins": 1.6,
      "salt": 0.885,
      "sodium": 0.354
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7313160020447/delikatess-potatissallad-klassik-rydbergs",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7313160020447",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101839908_ST",
        "name": "Potatissallad",
        "brand": "Rydbergs",
        "packageText": "750g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7314320041029",
    "name": "Hälsa",
    "brands": "Östras, Östras Stenugnsbageriet",
    "quantity": "600 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads",
      "en:sliced-breads",
      "en:multigrain-sliced-breads"
    ],
    "labels": [
      "en:no-preservatives",
      "en:keyhole"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1050,
      "energyKcal": 250,
      "fat": 6.7,
      "saturatedFat": 0.8,
      "carbohydrates": 36,
      "sugars": 1.7,
      "fiber": 5.2,
      "proteins": 10,
      "salt": 0.8,
      "sodium": 0.32
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/731/432/004/1029/front_sv.8.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7314320041029/halsa-ostras",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7314320041029",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101291350_ST",
        "name": "Hälsa Lågt Gi Bakad i Stenugn",
        "brand": "Östras Bröd",
        "packageText": "ÖSTRAS BRÖD, 600g",
        "sourceUrl": "https://www.hemkop.se/search?q=brod",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101291350_ST",
        "name": "Hälsa",
        "brand": "Östras",
        "packageText": "600g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7314873525014",
    "name": "Havssalt Lantbröd",
    "brands": "Fazer",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1080,
      "energyKcal": 260,
      "fat": 3.9,
      "saturatedFat": 0.5,
      "carbohydrates": 44,
      "sugars": 3.8,
      "fiber": 3.7,
      "proteins": 9.3,
      "salt": 1.18,
      "sodium": 0.472
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7314873525014/havssalt-lantbrod-fazer",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7314873525014",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7314873525014",
        "name": "Lantbröd Havssalt",
        "brand": "Fazer",
        "packageText": "600g",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7316110001886",
    "name": "Boston Gurka",
    "brands": "Felix",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 0,
      "energyKcal": 0,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 0,
      "sugars": 13,
      "fiber": null,
      "proteins": 0,
      "salt": 1.3775,
      "sodium": 0.551
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7316110001886/boston-gurka-felix",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7316110001886",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101802393_ST",
        "name": "Bostongurka",
        "brand": "FELIX",
        "packageText": "335ml",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7317370106588",
    "name": "Vannameiräkor",
    "brands": "Leroy",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 345.4,
      "energyKcal": 85,
      "fat": 0.1,
      "saturatedFat": 0.1,
      "carbohydrates": 0.1,
      "sugars": 0.1,
      "fiber": null,
      "proteins": 20,
      "salt": 2.4575,
      "sodium": 0.983
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7317370106588/vannameirakor-leroy",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7317370106588",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101692668_ST",
        "name": "Vannameiräkor",
        "brand": "Leröy",
        "packageText": "220g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7331044072573",
    "name": "Kalkon Bröstfilé",
    "brands": "Ingelsta Kalkon",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 502,
      "energyKcal": 120,
      "fat": 2.3,
      "saturatedFat": 0.7,
      "carbohydrates": 1.3,
      "sugars": 0.5,
      "fiber": null,
      "proteins": 23,
      "salt": 0.4925,
      "sodium": 0.197
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/733/104/407/2573/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7331044072573/kalkon-brostfile-ingelsta-kalkon",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7331044072573",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7331044072573",
        "name": "Kalkonbröstfilé",
        "brand": "Ingelsta Kalkon",
        "packageText": "400G",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7331494129971",
    "name": "Gräddost",
    "brands": "Wernerssons",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1737.5,
      "energyKcal": 418,
      "fat": 38,
      "saturatedFat": 25,
      "carbohydrates": 0.5,
      "sugars": 0,
      "fiber": 0,
      "proteins": 19,
      "salt": 1.475,
      "sodium": 0.59
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7331494129971/graddost-wernerssons",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7331494129971",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101817373_ST",
        "name": "Gräddost 38%",
        "brand": "Wernersson Ost",
        "packageText": "WERNERSSON OST, 400g",
        "sourceUrl": "https://www.willys.se/search?q=ost",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7340083402258",
    "name": "Boil-In-Bag jasminris",
    "brands": "Eldorado",
    "quantity": "500 g",
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
      "en:jasmine-rice"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1502,
      "energyKcal": 350,
      "fat": 0.7,
      "saturatedFat": 0.2,
      "carbohydrates": 79,
      "sugars": 0.2,
      "fiber": 2.4,
      "proteins": 6.7,
      "salt": 0.02,
      "sodium": 0.008
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/340/2258/front_sv.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083402258/boil-in-bag-jasminris-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083402258",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101191742_ST",
        "name": "Jasminris Boil-in-bag 4x125g",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7340083427299",
    "name": "Mellanmjölk",
    "brands": "Garant",
    "quantity": "1000ml",
    "categories": [
      "en:dairies",
      "en:milks"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 200,
      "energyKcal": 45,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.9,
      "sugars": 4.9,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/342/7299/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083427299/mellanmjolk-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083427299",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101205823_ST",
        "name": "Mellanmjölk 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101205823_ST",
        "name": "Mellanmjölk 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083427312",
    "name": "Mjölk",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 250.400004863739,
      "energyKcal": 60,
      "fat": 3,
      "saturatedFat": 1.89999997615814,
      "carbohydrates": 4.80000019073486,
      "sugars": 4.80000019073486,
      "fiber": null,
      "proteins": 3.40000009536743,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/342/7312/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083427312/mjolk-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083427312",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101205891_ST",
        "name": "Mjölk 3%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101205891_ST",
        "name": "Mjölk 3%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083427923",
    "name": "Prosciutto grudo",
    "brands": "Garant",
    "quantity": "",
    "categories": [
      "en:meats-and-their-products",
      "en:prepared-meats",
      "en:hams"
    ],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1033.1,
      "energyKcal": 250,
      "fat": 14,
      "saturatedFat": 5.2,
      "carbohydrates": 0.3,
      "sugars": 0.2,
      "fiber": null,
      "proteins": 30,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083427923/prosciutto-grudo-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083427923",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101206348_ST",
        "name": "Prosciutto Crudo",
        "brand": "Garant",
        "packageText": "80g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7340083434723",
    "name": "Kycklinginnerfilé",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 431,
      "energyKcal": 100,
      "fat": 2,
      "saturatedFat": 0.7,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": null,
      "proteins": 21,
      "salt": 0.00175,
      "sodium": 0.0007
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083434723/kycklinginnerfile-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083434723",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101222356_ST",
        "name": "Kycklinginnerfilé",
        "brand": "Garant",
        "packageText": "700g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7340083435232",
    "name": "Jasminris",
    "brands": "Eldorado",
    "quantity": "2 kg",
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
      "en:jasmine-rice"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1500,
      "energyKcal": 353,
      "fat": 0.7,
      "saturatedFat": 0,
      "carbohydrates": 79,
      "sugars": 0,
      "fiber": 2.4,
      "proteins": 6.7,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/343/5232/front_sv.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083435232/jasminris-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083435232",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101220577_ST",
        "name": "Jasminris",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 2kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101220577_ST",
        "name": "Jasminris",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 2kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083435539",
    "name": "Naturell Kvarg",
    "brands": "Eldorado",
    "quantity": "500g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:desserts",
      "en:dairy-desserts",
      "en:fermented-dairy-desserts",
      "en:yogurts",
      "en:quarks",
      "en:cream-cheeses",
      "en:lean-quark"
    ],
    "labels": [
      "en:keyhole"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 281.4,
      "energyKcal": 70,
      "fat": 0.3,
      "saturatedFat": 0.2,
      "carbohydrates": 3.9,
      "sugars": 3.9,
      "fiber": null,
      "proteins": 12,
      "salt": 0.00025,
      "sodium": 0.0001
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/343/5539/front_en.30.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083435539/naturell-kvarg-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083435539",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101232098_ST",
        "name": "Naturell kvarg",
        "brand": "ELDORADO",
        "packageText": "500g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083435645",
    "name": "Gouda Skivad",
    "brands": "Eldorado",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1444,
      "energyKcal": 350,
      "fat": 28,
      "saturatedFat": 20,
      "carbohydrates": 0,
      "sugars": null,
      "fiber": null,
      "proteins": 24,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083435645/gouda-skivad-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083435645",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101224548_ST",
        "name": "Skivad ost",
        "brand": "ELDORADO",
        "packageText": "400g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083443886",
    "name": "Mjölk med lite längre hållbarhet",
    "brands": "Garant",
    "quantity": "1.5 l",
    "categories": [
      "en:dairies",
      "en:milks-liquid-and-powder",
      "en:milks",
      "en:homogenized-milks",
      "en:pasteurised-products",
      "en:uht-milks",
      "en:pasteurised-milks",
      "en:whole-milks",
      "en:cow-milks",
      "en:whole-milk-uht"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "xx:mjolk-fran-sverige",
      "en:fsc-c081801",
      "sv:from-sweden"
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
      "salt": 0.0875,
      "sodium": 0.035
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/344/3886/front_sv.40.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083443886/mjolk-med-lite-langre-hallbarhet-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083443886",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101233931_ST",
        "name": "Mjölk Längre Hållbarhet 3%",
        "brand": "Garant",
        "packageText": "GARANT, 1,5l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101233931_ST",
        "name": "Mjölk Längre Hållbarhet 3%",
        "brand": "Garant",
        "packageText": "GARANT, 1,5l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083443893",
    "name": "Mellanmjölk med längre hållbarhet",
    "brands": "Garant",
    "quantity": "1.5 l",
    "categories": [
      "en:dairies",
      "en:milks",
      "en:homogenized-milks",
      "en:semi-skimmed-milks",
      "en:uht-milks",
      "en:pasteurised-milks",
      "en:cow-milks",
      "en:semi-skimmed-uht-milk-fortified-with-vitamins"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix",
      "en:fsc-c081801",
      "sv:from-sweden"
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
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/344/3893/front_sv.39.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083443893/mellanmjolk-med-langre-hallbarhet-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083443893",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101233933_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1,5l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101233933_ST",
        "name": "Mellanmjölk Längre Hållbarhet 1,5%",
        "brand": "Garant",
        "packageText": "GARANT, 1,5l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083444098",
    "name": "Långkornigt ris Parboiled",
    "brands": "Eldorado",
    "quantity": "1 kg",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:seeds",
      "en:cereals-and-their-products",
      "en:cereal-grains",
      "en:rices"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1495,
      "energyKcal": 352,
      "fat": 0.6,
      "saturatedFat": 0.2,
      "carbohydrates": 79,
      "sugars": 0.3,
      "fiber": 0.5,
      "proteins": 7.4,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/344/4098/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083444098/langkornigt-ris-parboiled-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083444098",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101234820_ST",
        "name": "Långkornigt Ris",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101234820_ST",
        "name": "Långkornigt Ris",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083444104",
    "name": "Långkornigt Ris",
    "brands": "Eldorado",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1495,
      "energyKcal": 352,
      "fat": 0.6,
      "saturatedFat": 0.2,
      "carbohydrates": 79,
      "sugars": null,
      "fiber": 0.5,
      "proteins": 7.4,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083444104/langkornigt-ris-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083444104",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101234821_ST",
        "name": "Ris Långkornigt",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 2kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101234821_ST",
        "name": "Ris Långkornigt",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 2kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083447549",
    "name": "Färskost Naturell",
    "brands": "Eldorado",
    "quantity": "300 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:cream-cheeses"
    ],
    "labels": [],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 993.8,
      "energyKcal": 241,
      "fat": 23,
      "saturatedFat": 15,
      "carbohydrates": 3,
      "sugars": 3,
      "fiber": 0,
      "proteins": 5.4,
      "salt": 0.8,
      "sodium": 0.32
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/344/7549/front_en.15.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083447549/farskost-naturell-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083447549",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101244012_ST",
        "name": "Naturell färskost",
        "brand": "ELDORADO",
        "packageText": "300g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083448638",
    "name": "Crème fraiche",
    "brands": "Garant",
    "quantity": "",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:creams",
      "en:fermented-creams",
      "en:sour-creams",
      "fr:cremes-fraiches"
    ],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1265.6,
      "energyKcal": 310,
      "fat": 32,
      "saturatedFat": 20,
      "carbohydrates": 2.4,
      "sugars": 2.4,
      "fiber": null,
      "proteins": 2.4,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/344/8638/front_sv.12.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083448638/creme-fraiche-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083448638",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101245383_ST",
        "name": "Crème fraiche",
        "brand": "Garant",
        "packageText": "5dl",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7340083451447",
    "name": "Långkornigt ris",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1428.5,
      "energyKcal": 346,
      "fat": 1.3,
      "saturatedFat": 0.4,
      "carbohydrates": 73,
      "sugars": null,
      "fiber": null,
      "proteins": 8.2,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083451447/langkornigt-ris-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083451447",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101254022_ST",
        "name": "Långkornigt Ris",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083456701",
    "name": "Äppel juice",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 180,
      "energyKcal": 43,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 11,
      "sugars": 10,
      "fiber": 0,
      "proteins": 0,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/345/6701/front_fr.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083456701/appel-juice-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083456701",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101263332_ST",
        "name": "Äpplejuice",
        "brand": "GARANT",
        "packageText": "1,75l",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083457593",
    "name": "Ekologisk Mellan Mjölk",
    "brands": "Garant",
    "quantity": "1,5 l",
    "categories": [
      "en:dairies",
      "en:milks-liquid-and-powder",
      "en:milks",
      "en:pasteurised-products",
      "en:semi-skimmed-milks",
      "en:pasteurised-milks"
    ],
    "labels": [
      "en:organic",
      "en:eu-organic",
      "en:se-eko-01"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 200,
      "energyKcal": 45,
      "fat": 1.5,
      "saturatedFat": 1,
      "carbohydrates": 4.9,
      "sugars": 4.9,
      "fiber": null,
      "proteins": 3.5,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/345/7593/front_sv.12.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083457593/ekologisk-mellan-mjolk-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083457593",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101266069_ST",
        "name": "Mellanmjölk Längre Hållbarhet Ekologisk 1,5%",
        "brand": "Garant Eko",
        "packageText": "GARANT EKO, 1,5l",
        "sourceUrl": "https://www.hemkop.se/search?q=mjolk",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083465017",
    "name": "Grillkorv",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1123,
      "energyKcal": 271,
      "fat": 23,
      "saturatedFat": null,
      "carbohydrates": 5,
      "sugars": null,
      "fiber": null,
      "proteins": 11,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083465017/grillkorv-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083465017",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101276779_ST",
        "name": "Grillkorv",
        "brand": "GARANT",
        "packageText": "400g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083465260",
    "name": "Basmatiris",
    "brands": "Eldorado",
    "quantity": "",
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
      "energyKj": 1496.7,
      "energyKcal": 353,
      "fat": 0.5,
      "saturatedFat": 0.1,
      "carbohydrates": 78,
      "sugars": 0,
      "fiber": 1.6,
      "proteins": 8.2,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/346/5260/front_sv.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083465260/basmatiris-eldorado",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083465260",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101277483_ST",
        "name": "Basmatiris",
        "brand": "Eldorado",
        "packageText": "ELDORADO, 2kg",
        "sourceUrl": "https://www.willys.se/search?q=ris",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7340083467875",
    "name": "Mjölk 3.0%",
    "brands": "Garant",
    "quantity": "",
    "categories": [
      "en:dairies",
      "en:milks-liquid-and-powder",
      "en:milks"
    ],
    "labels": [
      "en:fsc",
      "en:fsc-mix"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 250.4,
      "energyKcal": 60,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 4.8,
      "sugars": 4.8,
      "fiber": null,
      "proteins": 3.4,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/346/7875/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083467875/mjolk-3-0-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083467875",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101276728_ST",
        "name": "Mjölk Längre Hållbarhet 3%",
        "brand": "Garant",
        "packageText": "GARANT, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7340083478086",
    "name": "Snabbmakaroner",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1508,
      "energyKcal": 356,
      "fat": 1.6,
      "saturatedFat": null,
      "carbohydrates": 73,
      "sugars": null,
      "fiber": 2.6,
      "proteins": 11,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083478086/snabbmakaroner-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083478086",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101301621_ST",
        "name": "Snabbmakaroner Pasta",
        "brand": "Garant",
        "packageText": "GARANT, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7340083478581",
    "name": "Ekologiska Makaroner",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1504.6,
      "energyKcal": 355,
      "fat": 1.4,
      "saturatedFat": 0.3,
      "carbohydrates": 72,
      "sugars": 3.1,
      "fiber": 3.1,
      "proteins": 12,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083478581/ekologiska-makaroner-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083478581",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101302991_ST",
        "name": "Makaroner Pasta",
        "brand": "Garant Eko",
        "packageText": "GARANT EKO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101302991_ST",
        "name": "Makaroner Pasta",
        "brand": "Garant Eko",
        "packageText": "GARANT EKO, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083480140",
    "name": "Ekologisk Yoghurt",
    "brands": "Garant",
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
      "en:organic",
      "en:eu-organic",
      "en:se-eko-01"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 272,
      "energyKcal": 65,
      "fat": 4.2,
      "saturatedFat": 2.7,
      "carbohydrates": 3.6,
      "sugars": 3.6,
      "fiber": null,
      "proteins": 3.4,
      "salt": 0.08,
      "sodium": 0.032
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/348/0140/front_sv.9.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083480140/ekologisk-yoghurt-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083480140",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101285706_ST",
        "name": "Naturell Yoghurt 3,8-4,5%",
        "brand": "Garant Eko",
        "packageText": "GARANT EKO, 1,5kg",
        "sourceUrl": "https://www.hemkop.se/search?q=yoghurt",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083482106",
    "name": "Långkornigt Ris",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1494.2,
      "energyKcal": 352,
      "fat": 0.6,
      "saturatedFat": 0.2,
      "carbohydrates": 79,
      "sugars": 0.3,
      "fiber": 0.4,
      "proteins": 7.4,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/348/2106/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083482106/langkornigt-ris-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083482106",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101316058_ST",
        "name": "Långkornigt Ris",
        "brand": "Garant",
        "packageText": "GARANT, 2kg",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083486272",
    "name": "Kallrökt Lax",
    "brands": "Falkenberg",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 724.7,
      "energyKcal": 173,
      "fat": 9.8,
      "saturatedFat": 1.4,
      "carbohydrates": 1.3,
      "sugars": 0,
      "fiber": null,
      "proteins": 20,
      "salt": 2.25,
      "sodium": 1.062
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083486272/kallrokt-lax-falkenberg",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083486272",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101330534_ST",
        "name": "Kallrökt lax, gravad lax",
        "brand": "FALKENBERG",
        "packageText": "150g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7340083486920",
    "name": "Pasta",
    "brands": "Garant",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1506.4,
      "energyKcal": 358,
      "fat": 1.8,
      "saturatedFat": 0.4,
      "carbohydrates": 71,
      "sugars": 3.3,
      "fiber": 3.6,
      "proteins": 12,
      "salt": 0.02,
      "sodium": 0.008
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/348/6920/front_en.4.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083486920/pasta-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083486920",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101332229_ST",
        "name": "Fusilli Tricolore Pasta",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101332229_ST",
        "name": "Fusilli Tricolore Pasta",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083488511",
    "name": "ParmesanOst",
    "brands": "Garant",
    "quantity": "150 g",
    "categories": [],
    "labels": [
      "en:pdo"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1654,
      "energyKcal": 402,
      "fat": 30,
      "saturatedFat": 20,
      "carbohydrates": 0,
      "sugars": null,
      "fiber": null,
      "proteins": 32,
      "salt": 1.5725,
      "sodium": 0.629
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/348/8511/front_en.5.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083488511/parmesanost-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083488511",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101328356_ST",
        "name": "Parmigiano Reggiano",
        "brand": "Garant",
        "packageText": "150g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7340083494987",
    "name": "Gemelli Pasta",
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
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083494987/gemelli-pasta-garant",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083494987",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101358836_ST",
        "name": "Gemelli Pasta",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101358836_ST",
        "name": "Gemelli Pasta",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7340083496011",
    "name": "Långkornigt ris",
    "brands": "",
    "quantity": "4 x 125g",
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
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 1497,
      "energyKcal": 352,
      "fat": 0.6,
      "saturatedFat": 0.2,
      "carbohydrates": 79,
      "sugars": 0.3,
      "fiber": 0.5,
      "proteins": 7.4,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/734/008/349/6011/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7340083496011/langkornigt-ris",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7340083496011",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101361573_ST",
        "name": "Långkornigt Ris Boil-in-bag 4x125g",
        "brand": "Garant",
        "packageText": "GARANT, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=ris",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7350002400333",
    "name": "Olivolja",
    "brands": "Zeta",
    "quantity": "500 ml",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:fats",
      "en:vegetable-fats",
      "en:olive-tree-products",
      "en:vegetable-oils",
      "en:olive-oils",
      "en:extra-virgin-olive-oils"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 3404,
      "energyKcal": 823,
      "fat": 92,
      "saturatedFat": 12,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": null,
      "proteins": 0,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/735/000/240/0333/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7350002400333/olivolja-zeta",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7350002400333",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100364008_ST",
        "name": "Olivolja Classico",
        "brand": "Zeta",
        "packageText": "500ml",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7350002404546",
    "name": "Mezze Maniche",
    "brands": "Zeta",
    "quantity": "400g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:dry-pastas",
      "en:durum-wheat-pasta"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1537,
      "energyKcal": 367,
      "fat": 1.5,
      "saturatedFat": 0.5,
      "carbohydrates": 73,
      "sugars": 3,
      "fiber": 2.5,
      "proteins": 14,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/735/000/240/4546/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7350002404546/mezze-maniche-zeta",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7350002404546",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101175576_ST",
        "name": "Mezze Maniche Pasta",
        "brand": "Zeta",
        "packageText": "ZETA, 400g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7350027796077",
    "name": "Macaronetti",
    "brands": "Zeta",
    "quantity": "400 g",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1554.5,
      "energyKcal": 367,
      "fat": 1.5,
      "saturatedFat": 0.5,
      "carbohydrates": 73,
      "sugars": 3,
      "fiber": 2.5,
      "proteins": 14,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/735/002/779/6077/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7350027796077/macaronetti-zeta",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7350027796077",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101300044_ST",
        "name": "Maccaronetti Pasta",
        "brand": "Zeta",
        "packageText": "ZETA, 400g",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7350031135473",
    "name": "Bâtard Champagne-limpa",
    "brands": "La Lorraine",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1163,
      "energyKcal": 278,
      "fat": 1.3,
      "saturatedFat": 0.3,
      "carbohydrates": 57,
      "sugars": 0.6,
      "fiber": 1.9,
      "proteins": 8.6,
      "salt": 1.5725,
      "sodium": 0.629
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7350031135473/batard-champagne-limpa-la-lorraine",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7350031135473",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101261444_ST",
        "name": "Surdegsbröd",
        "brand": "La Lorraine",
        "packageText": "450g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7350051211164",
    "name": "Salami Milano No6",
    "brands": "Engelmans",
    "quantity": "",
    "categories": [
      "en:meats-and-their-products",
      "en:prepared-meats",
      "en:cured-sausages",
      "en:salami"
    ],
    "labels": [],
    "nutriscoreGrade": "e",
    "nutritionPer100g": {
      "energyKj": 1421,
      "energyKcal": 335.325047801147,
      "fat": 26,
      "saturatedFat": 26,
      "carbohydrates": 0,
      "sugars": null,
      "fiber": null,
      "proteins": 27,
      "salt": 4.6225,
      "sodium": 1.849
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/735/005/121/1164/front_es.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7350051211164/salami-milano-no6-engelmans",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7350051211164",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7350051211164",
        "name": "Salami Milano",
        "brand": "Engelmanns",
        "packageText": "80 gr",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "7391737007602",
    "name": "Osötat Medelhavs Levain",
    "brands": "Södervidinge",
    "quantity": "",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:breads"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 1099.5,
      "energyKcal": 256,
      "fat": 2.1,
      "saturatedFat": 0.4,
      "carbohydrates": 49,
      "sugars": 0.7,
      "fiber": 3.2,
      "proteins": 9.6,
      "salt": 1.2775,
      "sodium": 0.511
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/739/173/700/7602/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7391737007602/osotat-medelhavs-levain-sodervidinge",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7391737007602",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101514279_ST",
        "name": "Levain Medelhavs",
        "brand": "Södervidinge",
        "packageText": "SÖDERVIDINGE, 650g",
        "sourceUrl": "https://www.willys.se/search?q=brod",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7391814009109",
    "name": "Valnötter Naturella",
    "brands": "Exotic Snacks",
    "quantity": "250g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:nuts-and-their-products",
      "en:nuts",
      "en:walnuts"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 2847.6,
      "energyKcal": 680,
      "fat": 65,
      "saturatedFat": 5.7,
      "carbohydrates": 5.8,
      "sugars": 2.5,
      "fiber": 9,
      "proteins": 16,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/739/181/400/9109/front_sv.5.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7391814009109/valnotter-naturella-exotic-snacks",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7391814009109",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101649567_ST",
        "name": "Valnötter",
        "brand": "Exotic snacks",
        "packageText": "250g",
        "sourceUrl": "https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:40.482Z"
      }
    ]
  },
  {
    "barcode": "7393061001547",
    "name": "Mjölk",
    "brands": "Falköpings Mejeri",
    "quantity": "1 l",
    "categories": [
      "en:dairies",
      "en:milks",
      "en:whole-milks"
    ],
    "labels": [],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 250,
      "energyKcal": 60,
      "fat": 3,
      "saturatedFat": 1.9,
      "carbohydrates": 4.8,
      "sugars": 4.8,
      "fiber": 0,
      "proteins": 3.4,
      "salt": 0.1,
      "sodium": 0.04
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/739/306/100/1547/front_en.13.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7393061001547/mjolk-falkopings-mejeri",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7393061001547",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101125998_ST",
        "name": "Mjölk Färsk 3%",
        "brand": "Falköpings",
        "packageText": "FALKÖPINGS, 1l",
        "sourceUrl": "https://www.willys.se/search?q=mjolk",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7393720092770",
    "name": "Herrgård Mild",
    "brands": "Skånemejerier",
    "quantity": "",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:swedish-cheeses"
    ],
    "labels": [],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 1500,
      "energyKcal": 360,
      "fat": 28,
      "saturatedFat": 18,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": 0,
      "proteins": 27,
      "salt": 1.2,
      "sodium": 0.48
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7393720092770/herrgard-mild-skanemejerier",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7393720092770",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101511519_ST",
        "name": "Herrgård Mild 28%",
        "brand": "Skånemejerier",
        "packageText": "SKÅNEMEJERIER, 670g",
        "sourceUrl": "https://www.willys.se/search?q=ost",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7393720092794",
    "name": "Prästost",
    "brands": "Skånemejerier",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1669,
      "energyKcal": 400,
      "fat": 35,
      "saturatedFat": 22,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": 0,
      "proteins": 22,
      "salt": 1.18,
      "sodium": 0.472
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7393720092794/prastost-skanemejerier",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7393720092794",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101511521_ST",
        "name": "Präst 6månader 35%",
        "brand": "Skånemejerier",
        "packageText": "SKÅNEMEJERIER, 670g",
        "sourceUrl": "https://www.willys.se/search?q=ost",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7393720092800",
    "name": "Präst hårdost",
    "brands": "Skånemejerier",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1669,
      "energyKcal": 400,
      "fat": 35,
      "saturatedFat": 22,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": 0,
      "proteins": 22,
      "salt": 1.18,
      "sodium": 0.472
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7393720092800/prast-hardost-skanemejerier",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7393720092800",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101511522_ST",
        "name": "Präst Mild 35%",
        "brand": "Skånemejerier",
        "packageText": "SKÅNEMEJERIER, 670g",
        "sourceUrl": "https://www.willys.se/search?q=ost",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7394376616037",
    "name": "iKaffe",
    "brands": "Oatly",
    "quantity": "1 L",
    "categories": [
      "en:beverages-and-beverages-preparations",
      "en:plant-based-foods-and-beverages",
      "en:beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:dairy-substitutes",
      "en:cereals-and-their-products",
      "en:milk-substitutes",
      "en:plant-based-beverages",
      "en:plant-based-milk-alternatives",
      "en:cereal-based-drinks",
      "en:oat-based-drinks"
    ],
    "labels": [
      "en:vegetarian",
      "en:vegan",
      "en:fsc",
      "en:fsc-mix",
      "en:no-milk",
      "en:no-soy",
      "en:fsc-c014047"
    ],
    "nutriscoreGrade": "d",
    "nutritionPer100g": {
      "energyKj": 255,
      "energyKcal": 61,
      "fat": 3,
      "saturatedFat": 0.3,
      "carbohydrates": 7.1,
      "sugars": 3.4,
      "fiber": 0.8,
      "proteins": 1.1,
      "salt": 0.00025,
      "sodium": 0.0001
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/739/437/661/6037/front_fi.118.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7394376616037/ikaffe-oatly",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7394376616037",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101231662_ST",
        "name": "Ikaffe",
        "brand": "OATLY",
        "packageText": "1l",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "7611612150729",
    "name": "Fusilli",
    "brands": "EMD, Monte Castello",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:dry-pastas",
      "en:durum-wheat-pasta",
      "af:fusilli",
      "es:fusilli-de-trigo-duro",
      "en:dry-common-wheat-and-durum-wheat-pasta"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1523,
      "energyKcal": 364,
      "fat": 1.7,
      "saturatedFat": 0.3,
      "carbohydrates": 75,
      "sugars": 2.6,
      "fiber": 3.1,
      "proteins": 12,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/161/215/0729/front_en.23.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7611612150729/fusilli-emd",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7611612150729",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101240187_ST",
        "name": "Fusilli Pasta",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101240187_ST",
        "name": "Fusilli Pasta",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7611612150736",
    "name": "Penne Rigate",
    "brands": "Monte Castello",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1541.9,
      "energyKcal": 364,
      "fat": 1.7,
      "saturatedFat": 0.3,
      "carbohydrates": 75,
      "sugars": 2.6,
      "fiber": null,
      "proteins": 12,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/161/215/0736/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7611612150736/penne-rigate-monte-castello",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7611612150736",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101240218_ST",
        "name": "Penne Rigate Pasta",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7611612150750",
    "name": "Snabbmakaroner",
    "brands": "Monte Castello",
    "quantity": "1kg",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1566.7,
      "energyKcal": 364,
      "fat": 1.7,
      "saturatedFat": 0.3,
      "carbohydrates": 75,
      "sugars": 2.6,
      "fiber": 3.1,
      "proteins": 12,
      "salt": null,
      "sodium": null
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/161/215/0750/front_en.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7611612150750/snabbmakaroner-monte-castello",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7611612150750",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101240220_ST",
        "name": "Snabbmakaroner",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 1kg",
        "sourceUrl": "https://www.willys.se/search?q=makaroner",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101240220_ST",
        "name": "Snabbmakaroner",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=makaroner",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7611612150972",
    "name": "Conchiglie",
    "brands": "Monte Castello",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:pastas",
      "en:conchiglie"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1543,
      "energyKcal": 364,
      "fat": 1.7,
      "saturatedFat": 0.3,
      "carbohydrates": 75,
      "sugars": 2.6,
      "fiber": 3.1,
      "proteins": 12,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/161/215/0972/front_sv.9.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7611612150972/conchiglie-monte-castello",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7611612150972",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101550179_ST",
        "name": "Conchigle",
        "brand": "Monte Castello",
        "packageText": "MONTE CASTELLO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "7611612160841",
    "name": "Mozzarella",
    "brands": "Fresca d’oro",
    "quantity": "",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:italian-cheeses",
      "en:stretched-curd-cheeses",
      "en:mozzarella"
    ],
    "labels": [],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 935,
      "energyKcal": 225,
      "fat": 17,
      "saturatedFat": 12,
      "carbohydrates": 1,
      "sugars": 1,
      "fiber": 0,
      "proteins": 17,
      "salt": 0.59,
      "sodium": 0.236
    },
    "imageUrl": "",
    "productUrl": "http://world-en.openfoodfacts.org/product/7611612160841/mozzarella-fresca-d-oro",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7611612160841",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "101295235_ST",
        "name": "Mozzarella",
        "brand": "Fresca D´oro",
        "packageText": "FRESCA D´ORO, 125g",
        "sourceUrl": "https://www.hemkop.se/search?q=ost",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "7613031239436",
    "name": "Nescafe Mörkrost",
    "brands": "Nescafe",
    "quantity": "200",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:coffees"
    ],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 1608.15533980582,
      "energyKcal": 2,
      "fat": 14.9514563106796,
      "saturatedFat": null,
      "carbohydrates": 39.0291262135922,
      "sugars": null,
      "fiber": 19.2233009708738,
      "proteins": 0.1,
      "salt": 0.003,
      "sodium": 0.0012
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/303/123/9436/front_en.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7613031239436/nescafe-morkrost",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7613031239436",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7613031239436",
        "name": "Lyx Mörkrost Snabbkaffe Refill",
        "brand": "NESCAFÉ",
        "packageText": "200 G",
        "sourceUrl": "https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1",
        "retrievedAt": "2026-05-21T01:29:42.710Z"
      }
    ]
  },
  {
    "barcode": "7613032873691",
    "name": "Nescafé original",
    "brands": "Nescafé",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 8.5,
      "energyKcal": 1,
      "fat": 0,
      "saturatedFat": 0,
      "carbohydrates": 0.3,
      "sugars": 0,
      "fiber": null,
      "proteins": 0.2,
      "salt": 0,
      "sodium": 0
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/761/303/287/3691/front_fr.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7613032873691/nescafe-original",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7613032873691",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "7613032873691",
        "name": "Snabbkaffe original Refill",
        "brand": "NESCAFÉ",
        "packageText": "200 G",
        "sourceUrl": "https://external.api.coop.se/personalization/search/products?store=251300&device=desktop&direct=true&api-version=v1",
        "retrievedAt": "2026-05-21T01:29:42.710Z"
      }
    ]
  },
  {
    "barcode": "7622210697134",
    "name": "Hamburgeost",
    "brands": "Sottilette",
    "quantity": "",
    "categories": [],
    "labels": [],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 858.4,
      "energyKcal": 224,
      "fat": 13,
      "saturatedFat": 8.9,
      "carbohydrates": 7.2,
      "sugars": 5,
      "fiber": null,
      "proteins": 15,
      "salt": 3.17,
      "sodium": 1.268
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/762/221/069/7134/front_sv.3.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/7622210697134/hamburgeost-sottilette",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=7622210697134",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101262509_ST",
        "name": "Hamburgerost",
        "brand": "SOTTILETTE",
        "packageText": "200g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "8000139007095",
    "name": "Mezze Maniche Rigate",
    "brands": "Garofalo",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:dry-pastas",
      "en:durum-wheat-pasta",
      "en:italian-pasta",
      "hr:gragnano-tjestenina"
    ],
    "labels": [],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1489,
      "energyKcal": 351,
      "fat": 1,
      "saturatedFat": 0.2,
      "carbohydrates": 70,
      "sugars": 3,
      "fiber": 3,
      "proteins": 14,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/800/013/900/7095/front_it.24.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/8000139007095/mezze-maniche-rigate-garofalo",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=8000139007095",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101284620_ST",
        "name": "Mezze Maniche Rigate Pasta",
        "brand": "Garofalo",
        "packageText": "GAROFALO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      },
      {
        "chain": "hemkop",
        "productCode": "101284620_ST",
        "name": "Mezze Maniche Rigate Pasta",
        "brand": "Garofalo",
        "packageText": "GAROFALO, 500g",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "8000139910258",
    "name": "Mafalda corta",
    "brands": "Garofalo",
    "quantity": "500 g",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:cereals-and-potatoes",
      "en:cereals-and-their-products",
      "en:pastas",
      "en:cereal-pastas",
      "en:dry-pastas",
      "en:durum-wheat-pasta"
    ],
    "labels": [
      "en:pgi"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1489,
      "energyKcal": 351,
      "fat": 1,
      "saturatedFat": 0.2,
      "carbohydrates": 70,
      "sugars": 3,
      "fiber": 3,
      "proteins": 14,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/800/013/991/0258/front_es.27.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/8000139910258/mafalda-corta-garofalo",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=8000139910258",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101284490_ST",
        "name": "Mafalda Corta Pasta",
        "brand": "Garofalo",
        "packageText": "GAROFALO, 500g",
        "sourceUrl": "https://www.willys.se/search?q=pasta",
        "retrievedAt": "2026-05-20T23:54:12.788Z"
      }
    ]
  },
  {
    "barcode": "8000430133035",
    "name": "Mozzarella",
    "brands": "Galbani",
    "quantity": "225 g",
    "categories": [
      "en:dairies",
      "en:fermented-foods",
      "en:fermented-milk-products",
      "en:cheeses",
      "en:italian-cheeses",
      "en:stretched-curd-cheeses",
      "en:burrata",
      "en:mozzarella",
      "en:kaas",
      "en:kaas-voor-borrel"
    ],
    "labels": [
      "en:vegetarian"
    ],
    "nutriscoreGrade": "c",
    "nutritionPer100g": {
      "energyKj": 915,
      "energyKcal": 220,
      "fat": 16,
      "saturatedFat": 11,
      "carbohydrates": 2,
      "sugars": 1,
      "fiber": 0,
      "proteins": 17,
      "salt": 0.7,
      "sodium": 0.28
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/800/043/013/3035/front_en.235.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/8000430133035/mozzarella-galbani",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=8000430133035",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "100271983_ST",
        "name": "Mozzarella",
        "brand": "GALBANI",
        "packageText": "125g",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  },
  {
    "barcode": "80508816",
    "name": "Classic extra virgin oil",
    "brands": "Lesieur, Monini",
    "quantity": "750ml",
    "categories": [
      "en:plant-based-foods-and-beverages",
      "en:plant-based-foods",
      "en:fats",
      "en:vegetable-fats",
      "en:olive-tree-products",
      "en:vegetable-oils",
      "en:olive-oils",
      "en:extra-virgin-olive-oils",
      "en:virgin-olive-oils"
    ],
    "labels": [
      "en:green-dot"
    ],
    "nutriscoreGrade": "b",
    "nutritionPer100g": {
      "energyKj": 3700,
      "energyKcal": 900,
      "fat": 99.9,
      "saturatedFat": 15.2,
      "carbohydrates": 0,
      "sugars": 0,
      "fiber": 0,
      "proteins": 0.25,
      "salt": 0.0063,
      "sodium": 0.0025
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/000/008/050/8816/front_en.62.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/80508816/classic-extra-virgin-oil-lesieur",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=80508816",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "coop",
        "productCode": "80508816",
        "name": "Olivolja Classico",
        "brand": "Monini",
        "packageText": "750 ml",
        "sourceUrl": "https://proxy.api.coop.se/external/store/stores/251300?api-version=v5&includeFlyers=true&onlyVisibleOpeningHours=true",
        "retrievedAt": "2026-05-22T08:39:41.000Z"
      }
    ]
  },
  {
    "barcode": "8076804215058",
    "name": "Spaghetti",
    "brands": "Barilla",
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
      "en:spaghetti",
      "en:durum-wheat-spaghetti"
    ],
    "labels": [
      "en:made-in-italy"
    ],
    "nutriscoreGrade": "a",
    "nutritionPer100g": {
      "energyKj": 1522.6,
      "energyKcal": 353,
      "fat": 2,
      "saturatedFat": 0.5,
      "carbohydrates": 71,
      "sugars": 3.5,
      "fiber": 3,
      "proteins": 12.8,
      "salt": 0.01,
      "sodium": 0.004
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/807/680/421/5058/front_en.26.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/8076804215058/spaghetti-barilla",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=8076804215058",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "hemkop",
        "productCode": "100087978_ST",
        "name": "Spaghetti Pasta",
        "brand": "Barilla",
        "packageText": "BARILLA, 1kg",
        "sourceUrl": "https://www.hemkop.se/search?q=pasta",
        "retrievedAt": "2026-05-21T00:41:39.516Z"
      }
    ]
  },
  {
    "barcode": "8715700422046",
    "name": "Seriously good",
    "brands": "Heinz",
    "quantity": "460g",
    "categories": [
      "en:condiments",
      "en:sauces",
      "en:mayonnaises",
      "en:groceries"
    ],
    "labels": [
      "en:green-dot"
    ],
    "nutriscoreGrade": "unknown",
    "nutritionPer100g": {
      "energyKj": 2641,
      "energyKcal": 644,
      "fat": 70,
      "saturatedFat": 5.3,
      "carbohydrates": 3,
      "sugars": 1.5,
      "fiber": 0.00975,
      "proteins": 0,
      "salt": 0.785678,
      "sodium": 0.309436075
    },
    "imageUrl": "https://images.openfoodfacts.org/images/products/871/570/042/2046/front_en.10.400.jpg",
    "productUrl": "http://world-en.openfoodfacts.org/product/8715700422046/seriously-good-heinz",
    "sourceUrl": "https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz#code=8715700422046",
    "retrievedAt": "2026-05-22T09:07:37.774Z",
    "retailerMatches": [
      {
        "chain": "willys",
        "productCode": "101406960_ST",
        "name": "Majonnäs",
        "brand": "HEINZ",
        "packageText": "460g • 400ml",
        "sourceUrl": "https://www.willys.se/search/campaigns/offline?q=2110&type=PERSONAL_GENERAL&page=0&size=50",
        "retrievedAt": "2026-05-22T08:28:04.861Z"
      }
    ]
  }
];
