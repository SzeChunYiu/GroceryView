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
  "name": "Göteborg",
  "region": "",
  "index": 0.999,
  "stores": 26,
  "avgPrice": 49.18,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2975
 },
 {
  "name": "Linköping",
  "region": "",
  "index": 1.016,
  "stores": 13,
  "avgPrice": 50.02,
  "medianPrice": 46.64,
  "cheapestBasket": 1439,
  "dearestBasket": 3162
 },
 {
  "name": "Malmö",
  "region": "",
  "index": 0.982,
  "stores": 13,
  "avgPrice": 48.35,
  "medianPrice": 47.54,
  "cheapestBasket": 1625,
  "dearestBasket": 2706
 },
 {
  "name": "Uppsala",
  "region": "",
  "index": 1.024,
  "stores": 11,
  "avgPrice": 50.44,
  "medianPrice": 47.54,
  "cheapestBasket": 1521,
  "dearestBasket": 3415
 },
 {
  "name": "Helsingborg",
  "region": "",
  "index": 1.122,
  "stores": 10,
  "avgPrice": 55.27,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 3295
 },
 {
  "name": "Norrköping",
  "region": "",
  "index": 0.952,
  "stores": 8,
  "avgPrice": 46.91,
  "medianPrice": 46.64,
  "cheapestBasket": 1508,
  "dearestBasket": 2275
 },
 {
  "name": "Västerås",
  "region": "",
  "index": 0.965,
  "stores": 8,
  "avgPrice": 47.51,
  "medianPrice": 47.09,
  "cheapestBasket": 1627,
  "dearestBasket": 2275
 },
 {
  "name": "Örebro",
  "region": "",
  "index": 1.151,
  "stores": 7,
  "avgPrice": 56.71,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 3510
 },
 {
  "name": "Växjö",
  "region": "",
  "index": 1.068,
  "stores": 7,
  "avgPrice": 52.6,
  "medianPrice": 47.54,
  "cheapestBasket": 1712,
  "dearestBasket": 3174
 },
 {
  "name": "Sollentuna",
  "region": "",
  "index": 1.053,
  "stores": 7,
  "avgPrice": 51.84,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2804
 },
 {
  "name": "Stockholm",
  "region": "",
  "index": 1.04,
  "stores": 6,
  "avgPrice": 51.24,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 2897
 },
 {
  "name": "Motala",
  "region": "",
  "index": 1.051,
  "stores": 6,
  "avgPrice": 51.76,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 3058
 },
 {
  "name": "Järfälla",
  "region": "",
  "index": 1.164,
  "stores": 5,
  "avgPrice": 57.32,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 3054
 },
 {
  "name": "Kalmar",
  "region": "",
  "index": 1.189,
  "stores": 5,
  "avgPrice": 58.58,
  "medianPrice": 50.96,
  "cheapestBasket": 1866,
  "dearestBasket": 2968
 },
 {
  "name": "Kristianstad",
  "region": "",
  "index": 1.155,
  "stores": 5,
  "avgPrice": 56.9,
  "medianPrice": 48.82,
  "cheapestBasket": 1902,
  "dearestBasket": 3350
 },
 {
  "name": "Eskilstuna",
  "region": "",
  "index": 1.084,
  "stores": 5,
  "avgPrice": 53.41,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2882
 },
 {
  "name": "Nyköping",
  "region": "",
  "index": 1.093,
  "stores": 5,
  "avgPrice": 53.83,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2859
 },
 {
  "name": "Bromma",
  "region": "",
  "index": 0.992,
  "stores": 5,
  "avgPrice": 48.87,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Västra Frölunda",
  "region": "",
  "index": 0.979,
  "stores": 5,
  "avgPrice": 48.22,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2110
 },
 {
  "name": "Solna",
  "region": "",
  "index": 0.951,
  "stores": 5,
  "avgPrice": 46.82,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Lund",
  "region": "",
  "index": 0.958,
  "stores": 5,
  "avgPrice": 47.18,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Karlstad",
  "region": "",
  "index": 0.909,
  "stores": 5,
  "avgPrice": 44.77,
  "medianPrice": 46.64,
  "cheapestBasket": 1540,
  "dearestBasket": 1902
 },
 {
  "name": "Umeå",
  "region": "",
  "index": 0.988,
  "stores": 5,
  "avgPrice": 48.67,
  "medianPrice": 47.54,
  "cheapestBasket": 1738,
  "dearestBasket": 2292
 },
 {
  "name": "Täby",
  "region": "",
  "index": 0.912,
  "stores": 5,
  "avgPrice": 44.94,
  "medianPrice": 47.54,
  "cheapestBasket": 1418,
  "dearestBasket": 1902
 },
 {
  "name": "Borås",
  "region": "",
  "index": 1.199,
  "stores": 4,
  "avgPrice": 59.07,
  "medianPrice": 56.58,
  "cheapestBasket": 1902,
  "dearestBasket": 3023
 },
 {
  "name": "Skellefteå",
  "region": "",
  "index": 1.056,
  "stores": 4,
  "avgPrice": 52.03,
  "medianPrice": 47.54,
  "cheapestBasket": 1677,
  "dearestBasket": 2843
 },
 {
  "name": "Huddinge",
  "region": "",
  "index": 1.075,
  "stores": 4,
  "avgPrice": 52.95,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 2839
 },
 {
  "name": "Falun",
  "region": "",
  "index": 1.003,
  "stores": 4,
  "avgPrice": 49.42,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Vällingby",
  "region": "",
  "index": 0.952,
  "stores": 4,
  "avgPrice": 46.87,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Skövde",
  "region": "",
  "index": 0.952,
  "stores": 4,
  "avgPrice": 46.87,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Jönköping",
  "region": "",
  "index": 0.956,
  "stores": 4,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Enköping",
  "region": "",
  "index": 1.17,
  "stores": 3,
  "avgPrice": 57.63,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 3112
 },
 {
  "name": "Hägersten",
  "region": "",
  "index": 1.178,
  "stores": 3,
  "avgPrice": 58.01,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 3230
 },
 {
  "name": "Älvsjö",
  "region": "",
  "index": 1.163,
  "stores": 3,
  "avgPrice": 57.29,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 3108
 },
 {
  "name": "Trollhättan",
  "region": "",
  "index": 1.016,
  "stores": 3,
  "avgPrice": 50.05,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Karlskrona",
  "region": "",
  "index": 1.022,
  "stores": 3,
  "avgPrice": 50.35,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Gävle",
  "region": "",
  "index": 1.028,
  "stores": 3,
  "avgPrice": 50.65,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 2275
 },
 {
  "name": "Lidköping",
  "region": "",
  "index": 0.962,
  "stores": 3,
  "avgPrice": 47.37,
  "medianPrice": 46.64,
  "cheapestBasket": 1708,
  "dearestBasket": 2111
 },
 {
  "name": "Sundbyberg",
  "region": "",
  "index": 0.953,
  "stores": 3,
  "avgPrice": 46.94,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Sköndal",
  "region": "",
  "index": 0.953,
  "stores": 3,
  "avgPrice": 46.94,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Nacka",
  "region": "",
  "index": 0.953,
  "stores": 3,
  "avgPrice": 46.94,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Tyresö",
  "region": "",
  "index": 0.953,
  "stores": 3,
  "avgPrice": 46.94,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Haninge",
  "region": "",
  "index": 0.953,
  "stores": 3,
  "avgPrice": 46.94,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Södertälje",
  "region": "",
  "index": 0.959,
  "stores": 3,
  "avgPrice": 47.24,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Torslanda",
  "region": "",
  "index": 0.959,
  "stores": 3,
  "avgPrice": 47.24,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Borlänge",
  "region": "",
  "index": 0.959,
  "stores": 3,
  "avgPrice": 47.24,
  "medianPrice": 47.54,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Stenungsund",
  "region": "",
  "index": 1.174,
  "stores": 2,
  "avgPrice": 57.83,
  "medianPrice": 57.83,
  "cheapestBasket": 1902,
  "dearestBasket": 2725
 },
 {
  "name": "Lyckeby",
  "region": "",
  "index": 1.314,
  "stores": 2,
  "avgPrice": 64.73,
  "medianPrice": 64.73,
  "cheapestBasket": 1902,
  "dearestBasket": 3276
 },
 {
  "name": "Olofström",
  "region": "",
  "index": 1.302,
  "stores": 2,
  "avgPrice": 64.12,
  "medianPrice": 64.12,
  "cheapestBasket": 1902,
  "dearestBasket": 3228
 },
 {
  "name": "Bålsta",
  "region": "",
  "index": 1.201,
  "stores": 2,
  "avgPrice": 59.16,
  "medianPrice": 59.16,
  "cheapestBasket": 1866,
  "dearestBasket": 2867
 },
 {
  "name": "Farsta",
  "region": "",
  "index": 1.259,
  "stores": 2,
  "avgPrice": 62.02,
  "medianPrice": 62.02,
  "cheapestBasket": 1866,
  "dearestBasket": 3096
 },
 {
  "name": "Hässelby",
  "region": "",
  "index": 1.295,
  "stores": 2,
  "avgPrice": 63.77,
  "medianPrice": 63.77,
  "cheapestBasket": 1866,
  "dearestBasket": 3236
 },
 {
  "name": "Nynäshamn",
  "region": "",
  "index": 1.238,
  "stores": 2,
  "avgPrice": 60.96,
  "medianPrice": 60.96,
  "cheapestBasket": 1902,
  "dearestBasket": 2975
 },
 {
  "name": "Ronneby",
  "region": "",
  "index": 1.237,
  "stores": 2,
  "avgPrice": 60.9,
  "medianPrice": 60.9,
  "cheapestBasket": 1902,
  "dearestBasket": 2970
 },
 {
  "name": "Gustavsberg",
  "region": "",
  "index": 1.051,
  "stores": 2,
  "avgPrice": 51.76,
  "medianPrice": 51.76,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Halmstad",
  "region": "",
  "index": 1.051,
  "stores": 2,
  "avgPrice": 51.76,
  "medianPrice": 51.76,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Värnamo",
  "region": "",
  "index": 1.051,
  "stores": 2,
  "avgPrice": 51.76,
  "medianPrice": 51.76,
  "cheapestBasket": 1866,
  "dearestBasket": 2275
 },
 {
  "name": "Norrtälje",
  "region": "",
  "index": 1.055,
  "stores": 2,
  "avgPrice": 51.94,
  "medianPrice": 51.94,
  "cheapestBasket": 1902,
  "dearestBasket": 2253
 },
 {
  "name": "Nybro",
  "region": "",
  "index": 1.067,
  "stores": 2,
  "avgPrice": 52.54,
  "medianPrice": 52.54,
  "cheapestBasket": 1902,
  "dearestBasket": 2302
 },
 {
  "name": "Uddevalla",
  "region": "",
  "index": 1.06,
  "stores": 2,
  "avgPrice": 52.21,
  "medianPrice": 52.21,
  "cheapestBasket": 1902,
  "dearestBasket": 2275
 },
 {
  "name": "Karlshamn",
  "region": "",
  "index": 1.06,
  "stores": 2,
  "avgPrice": 52.21,
  "medianPrice": 52.21,
  "cheapestBasket": 1902,
  "dearestBasket": 2275
 },
 {
  "name": "Landskrona",
  "region": "",
  "index": 1.06,
  "stores": 2,
  "avgPrice": 52.21,
  "medianPrice": 52.21,
  "cheapestBasket": 1902,
  "dearestBasket": 2275
 },
 {
  "name": "Åhus",
  "region": "",
  "index": 1.028,
  "stores": 2,
  "avgPrice": 50.65,
  "medianPrice": 50.65,
  "cheapestBasket": 1902,
  "dearestBasket": 2150
 },
 {
  "name": "Visby",
  "region": "",
  "index": 0.984,
  "stores": 2,
  "avgPrice": 48.48,
  "medianPrice": 48.48,
  "cheapestBasket": 1902,
  "dearestBasket": 1976
 },
 {
  "name": "Säffle",
  "region": "",
  "index": 0.984,
  "stores": 2,
  "avgPrice": 48.46,
  "medianPrice": 48.46,
  "cheapestBasket": 1902,
  "dearestBasket": 1975
 },
 {
  "name": "Vadstena",
  "region": "",
  "index": 0.947,
  "stores": 2,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Vänersborg",
  "region": "",
  "index": 0.947,
  "stores": 2,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Kungsbacka",
  "region": "",
  "index": 0.947,
  "stores": 2,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Mellerud",
  "region": "",
  "index": 0.947,
  "stores": 2,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Mariestad",
  "region": "",
  "index": 0.913,
  "stores": 2,
  "avgPrice": 44.98,
  "medianPrice": 44.98,
  "cheapestBasket": 1696,
  "dearestBasket": 1902
 },
 {
  "name": "Vagnhärad",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Härnösand",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Limhamn",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Mjölby",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Tranås",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Lindesberg",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Lidingö",
  "region": "",
  "index": 0.956,
  "stores": 2,
  "avgPrice": 47.09,
  "medianPrice": 47.09,
  "cheapestBasket": 1866,
  "dearestBasket": 1902
 },
 {
  "name": "Luleå",
  "region": "",
  "index": 0.965,
  "stores": 2,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Sandviken",
  "region": "",
  "index": 0.944,
  "stores": 2,
  "avgPrice": 46.48,
  "medianPrice": 46.48,
  "cheapestBasket": 1817,
  "dearestBasket": 1902
 },
 {
  "name": "Sälen",
  "region": "",
  "index": 0.981,
  "stores": 2,
  "avgPrice": 48.31,
  "medianPrice": 48.31,
  "cheapestBasket": 1866,
  "dearestBasket": 1999
 },
 {
  "name": "Delsbo",
  "region": "",
  "index": 0.848,
  "stores": 2,
  "avgPrice": 41.77,
  "medianPrice": 41.77,
  "cheapestBasket": 1476,
  "dearestBasket": 1866
 },
 {
  "name": "Nödinge",
  "region": "",
  "index": 1.393,
  "stores": 1,
  "avgPrice": 68.61,
  "medianPrice": 68.61,
  "cheapestBasket": 2744,
  "dearestBasket": 2744
 },
 {
  "name": "Kristinehamn",
  "region": "",
  "index": 1.608,
  "stores": 1,
  "avgPrice": 79.21,
  "medianPrice": 79.21,
  "cheapestBasket": 3168,
  "dearestBasket": 3168
 },
 {
  "name": "Kumla",
  "region": "",
  "index": 1.434,
  "stores": 1,
  "avgPrice": 70.6,
  "medianPrice": 70.6,
  "cheapestBasket": 2824,
  "dearestBasket": 2824
 },
 {
  "name": "Mellbystrand",
  "region": "",
  "index": 1.697,
  "stores": 1,
  "avgPrice": 83.6,
  "medianPrice": 83.6,
  "cheapestBasket": 3344,
  "dearestBasket": 3344
 },
 {
  "name": "Löddeköpinge",
  "region": "",
  "index": 1.449,
  "stores": 1,
  "avgPrice": 71.37,
  "medianPrice": 71.37,
  "cheapestBasket": 2855,
  "dearestBasket": 2855
 },
 {
  "name": "Bromölla",
  "region": "",
  "index": 1.512,
  "stores": 1,
  "avgPrice": 74.47,
  "medianPrice": 74.47,
  "cheapestBasket": 2979,
  "dearestBasket": 2979
 },
 {
  "name": "Brottby",
  "region": "",
  "index": 1.529,
  "stores": 1,
  "avgPrice": 75.3,
  "medianPrice": 75.3,
  "cheapestBasket": 3012,
  "dearestBasket": 3012
 },
 {
  "name": "Vallentuna",
  "region": "",
  "index": 1.469,
  "stores": 1,
  "avgPrice": 72.37,
  "medianPrice": 72.37,
  "cheapestBasket": 2895,
  "dearestBasket": 2895
 },
 {
  "name": "Enskede",
  "region": "",
  "index": 1.466,
  "stores": 1,
  "avgPrice": 72.18,
  "medianPrice": 72.18,
  "cheapestBasket": 2887,
  "dearestBasket": 2887
 },
 {
  "name": "Löttorp",
  "region": "",
  "index": 1.49,
  "stores": 1,
  "avgPrice": 73.4,
  "medianPrice": 73.4,
  "cheapestBasket": 2936,
  "dearestBasket": 2936
 },
 {
  "name": "Asarum",
  "region": "",
  "index": 1.483,
  "stores": 1,
  "avgPrice": 73.04,
  "medianPrice": 73.04,
  "cheapestBasket": 2922,
  "dearestBasket": 2922
 },
 {
  "name": "Skogås",
  "region": "",
  "index": 1.155,
  "stores": 1,
  "avgPrice": 56.87,
  "medianPrice": 56.87,
  "cheapestBasket": 2275,
  "dearestBasket": 2275
 },
 {
  "name": "Ytterby",
  "region": "",
  "index": 1.155,
  "stores": 1,
  "avgPrice": 56.87,
  "medianPrice": 56.87,
  "cheapestBasket": 2275,
  "dearestBasket": 2275
 },
 {
  "name": "Höör",
  "region": "",
  "index": 1.155,
  "stores": 1,
  "avgPrice": 56.87,
  "medianPrice": 56.87,
  "cheapestBasket": 2275,
  "dearestBasket": 2275
 },
 {
  "name": "Arlöv",
  "region": "",
  "index": 1.155,
  "stores": 1,
  "avgPrice": 56.87,
  "medianPrice": 56.87,
  "cheapestBasket": 2275,
  "dearestBasket": 2275
 },
 {
  "name": "Mantorp",
  "region": "",
  "index": 1.155,
  "stores": 1,
  "avgPrice": 56.87,
  "medianPrice": 56.87,
  "cheapestBasket": 2275,
  "dearestBasket": 2275
 },
 {
  "name": "Skärhamn",
  "region": "",
  "index": 0.981,
  "stores": 1,
  "avgPrice": 48.33,
  "medianPrice": 48.33,
  "cheapestBasket": 1933,
  "dearestBasket": 1933
 },
 {
  "name": "Tomelilla",
  "region": "",
  "index": 1.027,
  "stores": 1,
  "avgPrice": 50.59,
  "medianPrice": 50.59,
  "cheapestBasket": 2024,
  "dearestBasket": 2024
 },
 {
  "name": "Klippan",
  "region": "",
  "index": 1.105,
  "stores": 1,
  "avgPrice": 54.42,
  "medianPrice": 54.42,
  "cheapestBasket": 2177,
  "dearestBasket": 2177
 },
 {
  "name": "Tidaholm",
  "region": "",
  "index": 0.995,
  "stores": 1,
  "avgPrice": 48.99,
  "medianPrice": 48.99,
  "cheapestBasket": 1960,
  "dearestBasket": 1960
 },
 {
  "name": "Götene",
  "region": "",
  "index": 0.92,
  "stores": 1,
  "avgPrice": 45.31,
  "medianPrice": 45.31,
  "cheapestBasket": 1812,
  "dearestBasket": 1812
 },
 {
  "name": "Kvissleby",
  "region": "",
  "index": 1.048,
  "stores": 1,
  "avgPrice": 51.61,
  "medianPrice": 51.61,
  "cheapestBasket": 2064,
  "dearestBasket": 2064
 },
 {
  "name": "Filipstad",
  "region": "",
  "index": 1.027,
  "stores": 1,
  "avgPrice": 50.6,
  "medianPrice": 50.6,
  "cheapestBasket": 2024,
  "dearestBasket": 2024
 },
 {
  "name": "Kisa",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Hedemora",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Upplands Väsby",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Leksand",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Lerum",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Valdemarsvik",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Domsjö",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Kinna",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Vendelsö",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Ljungbyhed",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Ljungsbro",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Vrigstad",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Herrljunga",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Insjön",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Ludvika",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Billdal",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Danderyd",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Dalby",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Tyringe",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Malmköping",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Dala-järna",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Malung",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Skänninge",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Gnesta",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Hisings Backa",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Tumba",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Särö",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Saltsjö-boo",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Stora Höga",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Mölndal",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Mölnlycke",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Västervik",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Tullinge",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Björklinge",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Bollebygd",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Köping",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Kolbäck",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Alfta",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Onsala",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Veddige",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Munkedal",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Rättvik",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Hudiksvall",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Östervåla",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Torshälla",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Grästorp",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Västerhaninge",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Oskarström",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Svanesund",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Svedala",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Borensberg",
  "region": "",
  "index": 0.947,
  "stores": 1,
  "avgPrice": 46.64,
  "medianPrice": 46.64,
  "cheapestBasket": 1866,
  "dearestBasket": 1866
 },
 {
  "name": "Sundsvall",
  "region": "",
  "index": 0.962,
  "stores": 1,
  "avgPrice": 47.38,
  "medianPrice": 47.38,
  "cheapestBasket": 1895,
  "dearestBasket": 1895
 },
 {
  "name": "Hammarö",
  "region": "",
  "index": 0.988,
  "stores": 1,
  "avgPrice": 48.66,
  "medianPrice": 48.66,
  "cheapestBasket": 1946,
  "dearestBasket": 1946
 },
 {
  "name": "Ängelholm",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Flen",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Finspång",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Hultsfred",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Huskvarna",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Kållered",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Fagersta",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Karlskoga",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Eslöv",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Kil",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Kramfors",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Landvetter",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Ljungby",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Lomma",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Märsta",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Mora",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Nässjö",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Norsborg",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Örnsköldsvik",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Östersund",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Partille",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Piteå",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Sävedalen",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Skene",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Båstad",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Avesta",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Skurup",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Åtvidaberg",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Askim",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Sölvesborg",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Staffanstorp",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Arboga",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Strängnäs",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Strömstad",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Gislaved",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Timrå",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Åmål",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Trelleborg",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Älvängen",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Ulricehamn",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Älmhult",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Vårgårda",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Åkersberga",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Vetlanda",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Gnosjö",
  "region": "",
  "index": 0.965,
  "stores": 1,
  "avgPrice": 47.54,
  "medianPrice": 47.54,
  "cheapestBasket": 1902,
  "dearestBasket": 1902
 },
 {
  "name": "Södra Sandby",
  "region": "",
  "index": 0.799,
  "stores": 1,
  "avgPrice": 39.34,
  "medianPrice": 39.34,
  "cheapestBasket": 1574,
  "dearestBasket": 1574
 },
 {
  "name": "Rimbo",
  "region": "",
  "index": 0.95,
  "stores": 1,
  "avgPrice": 46.81,
  "medianPrice": 46.81,
  "cheapestBasket": 1872,
  "dearestBasket": 1872
 },
 {
  "name": "Tanumshede",
  "region": "",
  "index": 1.027,
  "stores": 1,
  "avgPrice": 50.58,
  "medianPrice": 50.58,
  "cheapestBasket": 2023,
  "dearestBasket": 2023
 },
 {
  "name": "Alunda",
  "region": "",
  "index": 1.146,
  "stores": 1,
  "avgPrice": 56.46,
  "medianPrice": 56.46,
  "cheapestBasket": 2258,
  "dearestBasket": 2258
 },
 {
  "name": "Kiruna",
  "region": "",
  "index": 0.979,
  "stores": 1,
  "avgPrice": 48.23,
  "medianPrice": 48.23,
  "cheapestBasket": 1929,
  "dearestBasket": 1929
 },
 {
  "name": "Forshaga",
  "region": "",
  "index": 0.853,
  "stores": 1,
  "avgPrice": 42.03,
  "medianPrice": 42.03,
  "cheapestBasket": 1681,
  "dearestBasket": 1681
 },
 {
  "name": "Hörby",
  "region": "",
  "index": 0.807,
  "stores": 1,
  "avgPrice": 39.74,
  "medianPrice": 39.74,
  "cheapestBasket": 1590,
  "dearestBasket": 1590
 },
 {
  "name": "Lysekil",
  "region": "",
  "index": 0.851,
  "stores": 1,
  "avgPrice": 41.9,
  "medianPrice": 41.9,
  "cheapestBasket": 1676,
  "dearestBasket": 1676
 },
 {
  "name": "Matfors",
  "region": "",
  "index": 0.812,
  "stores": 1,
  "avgPrice": 39.99,
  "medianPrice": 39.99,
  "cheapestBasket": 1600,
  "dearestBasket": 1600
 },
 {
  "name": "Falköping",
  "region": "",
  "index": 1,
  "stores": 1,
  "avgPrice": 49.23,
  "medianPrice": 49.23,
  "cheapestBasket": 1969,
  "dearestBasket": 1969
 },
 {
  "name": "ALVESTA",
  "region": "",
  "index": 0.781,
  "stores": 1,
  "avgPrice": 38.47,
  "medianPrice": 38.47,
  "cheapestBasket": 1539,
  "dearestBasket": 1539
 },
 {
  "name": "Hamburgsund",
  "region": "",
  "index": 0.817,
  "stores": 1,
  "avgPrice": 40.23,
  "medianPrice": 40.23,
  "cheapestBasket": 1609,
  "dearestBasket": 1609
 },
 {
  "name": "Vimmerby",
  "region": "",
  "index": 1.098,
  "stores": 1,
  "avgPrice": 54.08,
  "medianPrice": 54.08,
  "cheapestBasket": 2163,
  "dearestBasket": 2163
 },
 {
  "name": "Frövi",
  "region": "",
  "index": 0.832,
  "stores": 1,
  "avgPrice": 41,
  "medianPrice": 41,
  "cheapestBasket": 1640,
  "dearestBasket": 1640
 },
 {
  "name": "Bräkne-Hoby",
  "region": "",
  "index": 0.837,
  "stores": 1,
  "avgPrice": 41.2,
  "medianPrice": 41.2,
  "cheapestBasket": 1648,
  "dearestBasket": 1648
 },
 {
  "name": "Osby",
  "region": "",
  "index": 0.936,
  "stores": 1,
  "avgPrice": 46.11,
  "medianPrice": 46.11,
  "cheapestBasket": 1845,
  "dearestBasket": 1845
 },
 {
  "name": "Munka-Ljungby",
  "region": "",
  "index": 0.788,
  "stores": 1,
  "avgPrice": 38.83,
  "medianPrice": 38.83,
  "cheapestBasket": 1553,
  "dearestBasket": 1553
 },
 {
  "name": "Lammhult",
  "region": "",
  "index": 0.776,
  "stores": 1,
  "avgPrice": 38.21,
  "medianPrice": 38.21,
  "cheapestBasket": 1528,
  "dearestBasket": 1528
 },
 {
  "name": "Svenstavik",
  "region": "",
  "index": 0.943,
  "stores": 1,
  "avgPrice": 46.44,
  "medianPrice": 46.44,
  "cheapestBasket": 1858,
  "dearestBasket": 1858
 },
 {
  "name": "Eksjö",
  "region": "",
  "index": 0.901,
  "stores": 1,
  "avgPrice": 44.36,
  "medianPrice": 44.36,
  "cheapestBasket": 1775,
  "dearestBasket": 1775
 },
 {
  "name": "Järvsö",
  "region": "",
  "index": 0.782,
  "stores": 1,
  "avgPrice": 38.5,
  "medianPrice": 38.5,
  "cheapestBasket": 1540,
  "dearestBasket": 1540
 },
 {
  "name": "Sollebrunn",
  "region": "",
  "index": 0.827,
  "stores": 1,
  "avgPrice": 40.71,
  "medianPrice": 40.71,
  "cheapestBasket": 1628,
  "dearestBasket": 1628
 },
 {
  "name": "Ljungskile",
  "region": "",
  "index": 0.866,
  "stores": 1,
  "avgPrice": 42.65,
  "medianPrice": 42.65,
  "cheapestBasket": 1706,
  "dearestBasket": 1706
 },
 {
  "name": "Vikbolandet",
  "region": "",
  "index": 0.883,
  "stores": 1,
  "avgPrice": 43.5,
  "medianPrice": 43.5,
  "cheapestBasket": 1740,
  "dearestBasket": 1740
 },
 {
  "name": "Alingsås",
  "region": "",
  "index": 0.907,
  "stores": 1,
  "avgPrice": 44.66,
  "medianPrice": 44.66,
  "cheapestBasket": 1786,
  "dearestBasket": 1786
 },
 {
  "name": "Nossebro",
  "region": "",
  "index": 0.866,
  "stores": 1,
  "avgPrice": 42.64,
  "medianPrice": 42.64,
  "cheapestBasket": 1705,
  "dearestBasket": 1705
 },
 {
  "name": "Laxå",
  "region": "",
  "index": 0.745,
  "stores": 1,
  "avgPrice": 36.68,
  "medianPrice": 36.68,
  "cheapestBasket": 1467,
  "dearestBasket": 1467
 },
 {
  "name": "Hofors",
  "region": "",
  "index": 0.789,
  "stores": 1,
  "avgPrice": 38.87,
  "medianPrice": 38.87,
  "cheapestBasket": 1555,
  "dearestBasket": 1555
 },
 {
  "name": "Ryd",
  "region": "",
  "index": 1.056,
  "stores": 1,
  "avgPrice": 52.03,
  "medianPrice": 52.03,
  "cheapestBasket": 2081,
  "dearestBasket": 2081
 },
 {
  "name": "Hovmantorp",
  "region": "",
  "index": 0.999,
  "stores": 1,
  "avgPrice": 49.18,
  "medianPrice": 49.18,
  "cheapestBasket": 1967,
  "dearestBasket": 1967
 },
 {
  "name": "Mörbylånga",
  "region": "",
  "index": 0.798,
  "stores": 1,
  "avgPrice": 39.29,
  "medianPrice": 39.29,
  "cheapestBasket": 1572,
  "dearestBasket": 1572
 },
 {
  "name": "Boxholm",
  "region": "",
  "index": 0.782,
  "stores": 1,
  "avgPrice": 38.49,
  "medianPrice": 38.49,
  "cheapestBasket": 1539,
  "dearestBasket": 1539
 },
 {
  "name": "Ålem",
  "region": "",
  "index": 0.768,
  "stores": 1,
  "avgPrice": 37.81,
  "medianPrice": 37.81,
  "cheapestBasket": 1512,
  "dearestBasket": 1512
 },
 {
  "name": "Braås",
  "region": "",
  "index": 0.828,
  "stores": 1,
  "avgPrice": 40.76,
  "medianPrice": 40.76,
  "cheapestBasket": 1630,
  "dearestBasket": 1630
 },
 {
  "name": "Järbo",
  "region": "",
  "index": 0.734,
  "stores": 1,
  "avgPrice": 36.16,
  "medianPrice": 36.16,
  "cheapestBasket": 1446,
  "dearestBasket": 1446
 },
 {
  "name": "Gällstad",
  "region": "",
  "index": 0.744,
  "stores": 1,
  "avgPrice": 36.64,
  "medianPrice": 36.64,
  "cheapestBasket": 1465,
  "dearestBasket": 1465
 },
 {
  "name": "Torsåker",
  "region": "",
  "index": 1.008,
  "stores": 1,
  "avgPrice": 49.65,
  "medianPrice": 49.65,
  "cheapestBasket": 1986,
  "dearestBasket": 1986
 },
 {
  "name": "Svappavaara",
  "region": "",
  "index": 0.747,
  "stores": 1,
  "avgPrice": 36.8,
  "medianPrice": 36.8,
  "cheapestBasket": 1472,
  "dearestBasket": 1472
 },
 {
  "name": "Anderstorp",
  "region": "",
  "index": 1.065,
  "stores": 1,
  "avgPrice": 52.45,
  "medianPrice": 52.45,
  "cheapestBasket": 2098,
  "dearestBasket": 2098
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
  "items": 7
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
 "bangerhead": {
  "id": "bangerhead",
  "name": "Bangerhead",
  "short": "B",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(56% 0.20 25)",
  "tier": "national"
 },
 "cocopanda": {
  "id": "cocopanda",
  "name": "Cocopanda",
  "short": "C",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(50% 0.20 25)",
  "tier": "national"
 },
 "eleven": {
  "id": "eleven",
  "name": "Eleven",
  "short": "E",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(48% 0.18 250)",
  "tier": "national"
 },
 "kicks": {
  "id": "kicks",
  "name": "Kicks",
  "short": "K",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(50% 0.16 250)",
  "tier": "national"
 },
 "lyko": {
  "id": "lyko",
  "name": "Lyko",
  "short": "L",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(54% 0.18 35)",
  "tier": "national"
 },
 "nordicfeel": {
  "id": "nordicfeel",
  "name": "Nordicfeel",
  "short": "N",
  "country": "SE",
  "sector": "beauty",
  "color": "oklch(52% 0.16 145)",
  "tier": "national"
 },
 "circle_k": {
  "id": "circle_k",
  "name": "Circle K",
  "short": "CK",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(58% 0.20 60)",
  "tier": "per_store"
 },
 "din_x": {
  "id": "din_x",
  "name": "Din X",
  "short": "DX",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(50% 0.14 60)",
  "tier": "per_store"
 },
 "ingo": {
  "id": "ingo",
  "name": "Ingo",
  "short": "I",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(54% 0.20 140)",
  "tier": "per_store"
 },
 "okq8": {
  "id": "okq8",
  "name": "OKQ8",
  "short": "O",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(56% 0.20 25)",
  "tier": "national"
 },
 "other_fuel": {
  "id": "other_fuel",
  "name": "Other Fuel",
  "short": "OF",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(50% 0.20 25)",
  "tier": "per_store"
 },
 "preem": {
  "id": "preem",
  "name": "Preem",
  "short": "P",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(48% 0.18 250)",
  "tier": "per_store"
 },
 "qstar": {
  "id": "qstar",
  "name": "Qstar",
  "short": "Q",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(50% 0.16 250)",
  "tier": "per_store"
 },
 "st1": {
  "id": "st1",
  "name": "St1",
  "short": "S",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(54% 0.18 35)",
  "tier": "national"
 },
 "tanka": {
  "id": "tanka",
  "name": "Tanka",
  "short": "T",
  "country": "SE",
  "sector": "fuel",
  "color": "oklch(52% 0.16 145)",
  "tier": "per_store"
 },
 "city_gross": {
  "id": "city_gross",
  "name": "City Gross",
  "short": "CG",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(58% 0.20 60)",
  "tier": "national"
 },
 "coop": {
  "id": "coop",
  "name": "Coop",
  "short": "C",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(50% 0.14 60)",
  "tier": "regional"
 },
 "hemkop": {
  "id": "hemkop",
  "name": "Hemkop",
  "short": "H",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(54% 0.20 140)",
  "tier": "national"
 },
 "ica": {
  "id": "ica",
  "name": "ICA",
  "short": "I",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(56% 0.20 25)",
  "tier": "per_store"
 },
 "lidl": {
  "id": "lidl",
  "name": "Lidl",
  "short": "L",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(50% 0.20 25)",
  "tier": "national"
 },
 "netto": {
  "id": "netto",
  "name": "Netto",
  "short": "N",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(48% 0.18 250)",
  "tier": "national"
 },
 "willys": {
  "id": "willys",
  "name": "Willys",
  "short": "W",
  "country": "SE",
  "sector": "groceries",
  "color": "oklch(50% 0.16 250)",
  "tier": "national"
 },
 "apohem": {
  "id": "apohem",
  "name": "Apohem",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(54% 0.18 35)",
  "tier": "national"
 },
 "apotea": {
  "id": "apotea",
  "name": "Apotea",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(52% 0.16 145)",
  "tier": "national"
 },
 "apoteket": {
  "id": "apoteket",
  "name": "Apoteket",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(58% 0.20 60)",
  "tier": "national"
 },
 "apotekhjartat": {
  "id": "apotekhjartat",
  "name": "Apotekhjartat",
  "short": "A",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(50% 0.14 60)",
  "tier": "national"
 },
 "kronansapotek": {
  "id": "kronansapotek",
  "name": "Kronansapotek",
  "short": "K",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(54% 0.20 140)",
  "tier": "national"
 },
 "meds": {
  "id": "meds",
  "name": "Meds",
  "short": "M",
  "country": "SE",
  "sector": "pharmacy",
  "color": "oklch(56% 0.20 25)",
  "tier": "national"
 }
};
const CATEGORIES = [
 {
  "slug": "grocery",
  "name": "grocery",
  "nameSv": "grocery",
  "emoji": "🛒",
  "count": 59
 },
 {
  "slug": "mjöl",
  "name": "mjöl",
  "nameSv": "mjöl",
  "emoji": "🛒",
  "count": 1
 }
];
const GROCERY_PRODUCTS = [
 {
  "slug": "p9199795b",
  "name": "Grillchips",
  "size": "",
  "brand": "Estrella",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 8.47
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 8.47
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 8.47,
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
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pca18d9a8",
  "name": "Guacamole Dip Mix",
  "size": "",
  "brand": "Santa Maria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 8.47
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 8.47
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 8.47,
    "coop": 9.42,
    "hemkop": 11.3,
    "willys": 8.99,
    "city_gross": 9.4
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47,
   8.47
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
   "SE": 8.9
  },
  "regular": {
   "SE": 11.3
  },
  "low52": {
   "SE": 8.9
  },
  "high52": {
   "SE": 11.3
  },
  "chains": {
   "SE": {
    "ica": 8.9,
    "coop": 10.36,
    "hemkop": 11.3,
    "willys": 9.36,
    "city_gross": 9.4
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p5fce7307",
  "name": "Gravy Delight Perle Kyckling Kattmat i Sås",
  "size": "",
  "brand": "Gourmet",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 8.9
  },
  "regular": {
   "SE": 10.95
  },
  "low52": {
   "SE": 8.9
  },
  "high52": {
   "SE": 10.95
  },
  "chains": {
   "SE": {
    "ica": 9.5,
    "coop": 9.5,
    "hemkop": 10.95,
    "willys": 8.9,
    "city_gross": 9.25
   }
  },
  "cheapest": {
   "SE": "willys"
  },
  "sparkline": [
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9,
   8.9
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
  "slug": "pf0b06ba4",
  "name": "Grönsaksgryta Kyckling & Vitlök Från 8 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 10.7
  },
  "regular": {
   "SE": 15.1
  },
  "low52": {
   "SE": 10.7
  },
  "high52": {
   "SE": 15.1
  },
  "chains": {
   "SE": {
    "ica": 10.7,
    "coop": 15.1,
    "hemkop": 14.14,
    "willys": 10.88,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7,
   10.7
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
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
   "SE": 11.9
  },
  "regular": {
   "SE": 14.14
  },
  "low52": {
   "SE": 11.9
  },
  "high52": {
   "SE": 14.14
  },
  "chains": {
   "SE": {
    "ica": 11.9,
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
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9,
   11.9
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p5e32abed",
  "name": "Gröt Päron Äpple Från 6 Månader",
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
    "ica": 12.75,
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
  "slug": "p6b6433ae",
  "name": "Gurksallad",
  "size": "",
  "brand": "Rydbergs",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.6
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 12.6
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 12.6,
    "coop": 13.72,
    "hemkop": 16.04,
    "willys": 12.77,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6,
   12.6
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pe5aa9bc9",
  "name": "Chili C Carne Kryddmix/3 Port",
  "size": "3 P",
  "brand": "Knorr",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 12.77
  },
  "regular": {
   "SE": 15.09
  },
  "low52": {
   "SE": 12.77
  },
  "high52": {
   "SE": 15.09
  },
  "chains": {
   "SE": {
    "ica": 14.14,
    "coop": 13.72,
    "hemkop": 15.09,
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
   "SE": 13.1
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.1
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.1,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.15,
    "city_gross": 14.1
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1,
   13.1
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "pb2637294",
  "name": "Mexicanasoppa Pulver/4 Port",
  "size": "4 P",
  "brand": "Knorr",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.15
  },
  "regular": {
   "SE": 19.36
  },
  "low52": {
   "SE": 13.15
  },
  "high52": {
   "SE": 19.36
  },
  "chains": {
   "SE": {
    "ica": 19.36,
    "coop": 14.15,
    "hemkop": 15.61,
    "willys": 13.15,
    "city_gross": 15.05
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
  "slug": "p88481571",
  "name": "Gryta Fisk Gröna Bönor Från 6 Månader",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.15
  },
  "regular": {
   "SE": 15.1
  },
  "low52": {
   "SE": 13.15
  },
  "high52": {
   "SE": 15.1
  },
  "chains": {
   "SE": {
    "ica": 13.15,
    "coop": 15.1,
    "hemkop": 15.09,
    "willys": 13.15,
    "city_gross": 13.2
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
  "slug": "p3007f508",
  "name": "Redd Grönsak Varma Koppen Pulver/3 Port",
  "size": "3 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.5
  },
  "regular": {
   "SE": 16.04
  },
  "low52": {
   "SE": 13.5
  },
  "high52": {
   "SE": 16.04
  },
  "chains": {
   "SE": {
    "ica": 13.5,
    "coop": 14.15,
    "hemkop": 16.04,
    "willys": 13.72,
    "city_gross": 14.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5,
   13.5
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
   "SE": 13.7
  },
  "regular": {
   "SE": 16.98
  },
  "low52": {
   "SE": 13.7
  },
  "high52": {
   "SE": 16.98
  },
  "chains": {
   "SE": {
    "ica": 13.7,
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
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7,
   13.7
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
   "SE": 14.1
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.1
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.1,
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
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1,
   14.1
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
   "SE": 14.14
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.14
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.14,
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
   "SE": 14.14
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.14
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.14,
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
  "slug": "pf41cb9d4",
  "name": "Gröt Persika Banan 1-3 År",
  "size": "",
  "brand": "Semper",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.14
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 14.14
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 14.14,
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
  "slug": "p612e5cb3",
  "name": "Gräddnougat Chokladkaka",
  "size": "",
  "brand": "Marabou",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 14.19
  },
  "regular": {
   "SE": 26.45
  },
  "low52": {
   "SE": 14.19
  },
  "high52": {
   "SE": 26.45
  },
  "chains": {
   "SE": {
    "ica": 14.19,
    "coop": 23.19,
    "hemkop": 26.45,
    "willys": 19.5,
    "city_gross": 23.6
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19,
   14.19
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
   "SE": 14.2
  },
  "regular": {
   "SE": 16.98
  },
  "low52": {
   "SE": 14.2
  },
  "high52": {
   "SE": 16.98
  },
  "chains": {
   "SE": {
    "ica": 14.2,
    "coop": 15.1,
    "hemkop": 16.98,
    "willys": 15.61,
    "city_gross": 15.05
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2,
   14.2
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
   "SE": 15
  },
  "regular": {
   "SE": 29.29
  },
  "low52": {
   "SE": 15
  },
  "high52": {
   "SE": 29.29
  },
  "chains": {
   "SE": {
    "ica": 15,
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
  "sector": "groceries"
 },
 {
  "slug": "p6a6955bb",
  "name": "Gräddkräm Vanilj",
  "size": "",
  "brand": "Podravka",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 15.04
  },
  "regular": {
   "SE": 17.5
  },
  "low52": {
   "SE": 15.04
  },
  "high52": {
   "SE": 17.5
  },
  "chains": {
   "SE": {
    "ica": 15.09,
    "coop": 17.5,
    "hemkop": 15.61,
    "willys": 15.04,
    "city_gross": 16.25
   }
  },
  "cheapest": {
   "SE": "willys"
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
  "slug": "p0152ead7",
  "name": "Grönsaklasagne Från 8 Månader",
  "size": "",
  "brand": "Hipp",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 15.09
  },
  "regular": {
   "SE": 16.56
  },
  "low52": {
   "SE": 15.09
  },
  "high52": {
   "SE": 16.56
  },
  "chains": {
   "SE": {
    "ica": 15.09,
    "coop": 16.04,
    "hemkop": 16.56,
    "willys": 15.99,
    "city_gross": 16
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09,
   15.09
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
   "SE": 15.7
  },
  "regular": {
   "SE": 20.34
  },
  "low52": {
   "SE": 15.7
  },
  "high52": {
   "SE": 20.34
  },
  "chains": {
   "SE": {
    "ica": 15.7,
    "coop": 16.99,
    "hemkop": 20.34,
    "willys": 15.9,
    "city_gross": 17.5
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7,
   15.7
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
   "SE": 24.3
  },
  "low52": {
   "SE": 16.1
  },
  "high52": {
   "SE": 24.3
  },
  "chains": {
   "SE": {
    "ica": 24.3,
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
   "SE": 16.7
  },
  "regular": {
   "SE": 23.61
  },
  "low52": {
   "SE": 16.7
  },
  "high52": {
   "SE": 23.61
  },
  "chains": {
   "SE": {
    "ica": 16.7,
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
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7,
   16.7
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
   "SE": 16.95
  },
  "regular": {
   "SE": 20.77
  },
  "low52": {
   "SE": 16.95
  },
  "high52": {
   "SE": 20.77
  },
  "chains": {
   "SE": {
    "ica": 16.95,
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
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95,
   16.95
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p0914d5bc",
  "name": "Gotler Skivad",
  "size": "",
  "brand": "Atria",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.1
  },
  "regular": {
   "SE": 21.22
  },
  "low52": {
   "SE": 17.1
  },
  "high52": {
   "SE": 21.22
  },
  "chains": {
   "SE": {
    "ica": 17.1,
    "coop": 20.77,
    "hemkop": 21.22,
    "willys": 17.88,
    "city_gross": 19.5
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1,
   17.1
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
   "SE": 17.3
  },
  "regular": {
   "SE": 18.88
  },
  "low52": {
   "SE": 17.3
  },
  "high52": {
   "SE": 18.88
  },
  "chains": {
   "SE": {
    "ica": 17.3,
    "coop": 18.46,
    "hemkop": 18.88,
    "willys": 17.5,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3
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
   "SE": 17.3
  },
  "regular": {
   "SE": 19.83
  },
  "low52": {
   "SE": 17.3
  },
  "high52": {
   "SE": 19.83
  },
  "chains": {
   "SE": {
    "ica": 17.3,
    "coop": 19.83,
    "hemkop": 18.88,
    "willys": 17.88,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3
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
   "SE": 17.3
  },
  "regular": {
   "SE": 19.8
  },
  "low52": {
   "SE": 17.3
  },
  "high52": {
   "SE": 19.8
  },
  "chains": {
   "SE": {
    "ica": 17.3,
    "coop": 18.88,
    "hemkop": 18.88,
    "willys": 17.5,
    "city_gross": 19.8
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3,
   17.3
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
   "SE": 17.4
  },
  "regular": {
   "SE": 20.77
  },
  "low52": {
   "SE": 17.4
  },
  "high52": {
   "SE": 20.77
  },
  "chains": {
   "SE": {
    "ica": 17.4,
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
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4,
   17.4
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 },
 {
  "slug": "p2991ce7b",
  "name": "Sparrissoppa Pulver/4 Port",
  "size": "4 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.5
  },
  "regular": {
   "SE": 21.95
  },
  "low52": {
   "SE": 17.5
  },
  "high52": {
   "SE": 21.95
  },
  "chains": {
   "SE": {
    "ica": 21.95,
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
  "slug": "p1610b74a",
  "name": "Champinjonsopp Pulver/4 Port",
  "size": "4 P",
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
    "ica": 17.9,
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
  "slug": "pfc7f8f05",
  "name": "Redd Grönsak Soppa Pulver/4 Port",
  "size": "4 P",
  "brand": "Blå Band",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 17.5
  },
  "regular": {
   "SE": 21.95
  },
  "low52": {
   "SE": 17.5
  },
  "high52": {
   "SE": 21.95
  },
  "chains": {
   "SE": {
    "ica": 21.95,
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
   "SE": 17.6
  },
  "regular": {
   "SE": 22.24
  },
  "low52": {
   "SE": 17.6
  },
  "high52": {
   "SE": 22.24
  },
  "chains": {
   "SE": {
    "ica": 17.6,
    "coop": 20.77,
    "hemkop": 22.24,
    "willys": 17.88,
    "city_gross": 20.75
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6
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
   "SE": 17.6
  },
  "regular": {
   "SE": 23.61
  },
  "low52": {
   "SE": 17.6
  },
  "high52": {
   "SE": 23.61
  },
  "chains": {
   "SE": {
    "ica": 17.6,
    "coop": 19.83,
    "hemkop": 23.61,
    "willys": 17.88,
    "city_gross": 18.85
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6,
   17.6
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
   "SE": 17.9
  },
  "regular": {
   "SE": 21.72
  },
  "low52": {
   "SE": 17.9
  },
  "high52": {
   "SE": 21.72
  },
  "chains": {
   "SE": {
    "ica": 17.9,
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
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9,
   17.9
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
   "SE": 18.5
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.5
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.5,
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
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5
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
   "SE": 18.5
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.5
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.5,
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
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5
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
   "SE": 18.5
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.5
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.5,
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
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5
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
   "SE": 18.5
  },
  "regular": {
   "SE": 23.95
  },
  "low52": {
   "SE": 18.5
  },
  "high52": {
   "SE": 23.95
  },
  "chains": {
   "SE": {
    "ica": 18.5,
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
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5,
   18.5
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
    "ica": 20.25,
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
  "slug": "p3ce8c1ef",
  "name": "Gräslök Light 11%",
  "size": "",
  "brand": "Philadelphia",
  "category": "grocery",
  "emoji": "🛒",
  "price": {
   "SE": 20.34
  },
  "regular": {
   "SE": 22.66
  },
  "low52": {
   "SE": 20.34
  },
  "high52": {
   "SE": 22.66
  },
  "chains": {
   "SE": {
    "ica": 20.34,
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
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34,
   20.34
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
   "SE": 20.4
  },
  "regular": {
   "SE": 25.08
  },
  "low52": {
   "SE": 20.4
  },
  "high52": {
   "SE": 25.08
  },
  "chains": {
   "SE": {
    "ica": 20.4,
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
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4
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
   "SE": 20.4
  },
  "regular": {
   "SE": 24.55
  },
  "low52": {
   "SE": 20.4
  },
  "high52": {
   "SE": 24.55
  },
  "chains": {
   "SE": {
    "ica": 20.4,
    "coop": 21.72,
    "hemkop": 24.55,
    "willys": 20.72,
    "city_gross": 21.7
   }
  },
  "cheapest": {
   "SE": "ica"
  },
  "sparkline": [
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4,
   20.4
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "groceries"
 }
];
const FUEL_PRODUCTS = [
 {
  "slug": "fuel-bensin-95",
  "name": "Bensin 95",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 16.34
  },
  "regular": {
   "SE": 17.37
  },
  "low52": {
   "SE": 16.34
  },
  "high52": {
   "SE": 21
  },
  "stations": 102,
  "sparkline": [
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37,
   17.37
  ],
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-diesel",
  "name": "Diesel",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 18.69
  },
  "regular": {
   "SE": 19.67
  },
  "low52": {
   "SE": 18.69
  },
  "high52": {
   "SE": 21.34
  },
  "stations": 98,
  "sparkline": [
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67,
   19.67
  ],
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-98-blyfri-98",
  "name": "98 / Blyfri 98",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 20.49
  },
  "regular": {
   "SE": 20.49
  },
  "low52": {
   "SE": 20.49
  },
  "high52": {
   "SE": 20.49
  },
  "stations": 1,
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
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-95-e10-blyfri-95",
  "name": "95 E10 / Blyfri 95",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 18.89
  },
  "regular": {
   "SE": 18.89
  },
  "low52": {
   "SE": 18.89
  },
  "high52": {
   "SE": 18.89
  },
  "stations": 1,
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
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-e85",
  "name": "E85",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 15.84
  },
  "regular": {
   "SE": 15.84
  },
  "low52": {
   "SE": 15.84
  },
  "high52": {
   "SE": 15.84
  },
  "stations": 1,
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
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-fuel-undefined",
  "name": "Fuel undefined",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 20.19
  },
  "regular": {
   "SE": 20.19
  },
  "low52": {
   "SE": 20.19
  },
  "high52": {
   "SE": 20.19
  },
  "stations": 1,
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
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
 },
 {
  "slug": "fuel-hvo100",
  "name": "HVO100",
  "emoji": "⛽",
  "unit": "kr/L",
  "price": {
   "SE": 29.89
  },
  "regular": {
   "SE": 29.89
  },
  "low52": {
   "SE": 29.89
  },
  "high52": {
   "SE": 29.89
  },
  "stations": 1,
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
  "sector": "fuel",
  "confidence": "medium",
  "verdict": "buy"
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
   "SE": "apohem"
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
   "SE": "meds"
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
   "SE": "apohem"
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
   "SE": "meds"
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
   "SE": "apoteket"
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
  "slug": "p1ba3f76c",
  "name": "Björn Axén Fixing Hairspray Travel Size 80 ml",
  "size": "80 ml",
  "brand": "Björn Axén",
  "category": "hår/styling/hårspray/veganskt/hjälpmedel & tillbehör/reseförpackningar/professionell skönhet/professionell hårvård",
  "emoji": "✨",
  "price": {
   "SE": 71
  },
  "regular": {
   "SE": 90
  },
  "low52": {
   "SE": 71
  },
  "high52": {
   "SE": 90
  },
  "chains": {
   "SE": {
    "meds": 80,
    "kicks": 90,
    "eleven": 90,
    "cocopanda": 71,
    "nordicfeel": 90
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71,
   71
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p277b99cf",
  "name": "Beauty of Joseon Revive Eye Serum Ginseng + Retinal 30 ml",
  "size": "30 ml",
  "brand": "Beauty of Joseon",
  "category": "ansikte/ögonkräm/veganskt/k-beauty/anti-age/retinol",
  "emoji": "✨",
  "price": {
   "SE": 159
  },
  "regular": {
   "SE": 249
  },
  "low52": {
   "SE": 159
  },
  "high52": {
   "SE": 249
  },
  "chains": {
   "SE": {
    "meds": 189,
    "kicks": 249,
    "eleven": 174.3,
    "cocopanda": 159,
    "nordicfeel": 199
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159,
   159
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p3eba0766",
  "name": "Dr. Ceuracle Hyal Reyouth Toner 120 ml",
  "size": "120 ml",
  "brand": "Dr. Ceuracle",
  "category": "ansikte/ansiktsvatten/k-beauty",
  "emoji": "✨",
  "price": {
   "SE": 184
  },
  "regular": {
   "SE": 220
  },
  "low52": {
   "SE": 184
  },
  "high52": {
   "SE": 220
  },
  "chains": {
   "SE": {
    "meds": 184,
    "kicks": 189,
    "eleven": 209.3,
    "cocopanda": 220,
    "nordicfeel": 199
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184,
   184
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pdc790207",
  "name": "Biotherm Day Control Roll-On 48H 75 ml",
  "size": "75 ml",
  "brand": "Biotherm",
  "category": "hudvård/nice price hudvård",
  "emoji": "✨",
  "price": {
   "SE": 189
  },
  "regular": {
   "SE": 219
  },
  "low52": {
   "SE": 189
  },
  "high52": {
   "SE": 219
  },
  "chains": {
   "SE": {
    "lyko": 189,
    "kicks": 209,
    "eleven": 189,
    "cocopanda": 200,
    "nordicfeel": 219
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189,
   189
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pbcf40963",
  "name": "Yves Saint Laurent L'Homme Deodorant Stick 75 g",
  "size": "75 g",
  "brand": "Yves Saint Laurent",
  "category": "parfym/man/deodorant",
  "emoji": "✨",
  "price": {
   "SE": 367.5
  },
  "regular": {
   "SE": 549
  },
  "low52": {
   "SE": 367.5
  },
  "high52": {
   "SE": 549
  },
  "chains": {
   "SE": {
    "lyko": 545,
    "kicks": 549,
    "eleven": 367.5,
    "cocopanda": 419,
    "nordicfeel": 499
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5,
   367.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p42c763e7",
  "name": "Hugo Boss Boss Bottled Infinite EdP 100 ml",
  "size": "100 ml",
  "brand": "Hugo Boss",
  "category": "parfym/man/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 642
  },
  "regular": {
   "SE": 1395
  },
  "low52": {
   "SE": 642
  },
  "high52": {
   "SE": 1395
  },
  "chains": {
   "SE": {
    "lyko": 642,
    "kicks": 1395,
    "eleven": 976.5,
    "cocopanda": 897,
    "nordicfeel": 959
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642,
   642
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p53fcf62f",
  "name": "Zadig & Voltaire This Is Her! EdP 50 ml",
  "size": "50 ml",
  "brand": "Zadig & Voltaire",
  "category": "parfym/dam/parfym",
  "emoji": "✨",
  "price": {
   "SE": 644
  },
  "regular": {
   "SE": 1130
  },
  "low52": {
   "SE": 644
  },
  "high52": {
   "SE": 1130
  },
  "chains": {
   "SE": {
    "lyko": 732,
    "kicks": 1130,
    "eleven": 815.5,
    "cocopanda": 644,
    "nordicfeel": 837
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644,
   644
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pbf4c881b",
  "name": "Versace Yellow Diamond EdT 50 ml",
  "size": "50 ml",
  "brand": "Versace",
  "category": "parfym/dam/parfym/eau de toilette",
  "emoji": "✨",
  "price": {
   "SE": 647
  },
  "regular": {
   "SE": 791.25
  },
  "low52": {
   "SE": 647
  },
  "high52": {
   "SE": 791.25
  },
  "chains": {
   "SE": {
    "lyko": 702,
    "kicks": 791.25,
    "eleven": 780.5,
    "cocopanda": 647,
    "nordicfeel": 769
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647,
   647
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pf00d0919",
  "name": "Lancôme La Vie est Belle Eau de Parfum 30 ml",
  "size": "30 ml",
  "brand": "Lancôme",
  "category": "parfym/nice price parfym",
  "emoji": "✨",
  "price": {
   "SE": 665
  },
  "regular": {
   "SE": 729
  },
  "low52": {
   "SE": 665
  },
  "high52": {
   "SE": 729
  },
  "chains": {
   "SE": {
    "lyko": 665,
    "kicks": 729,
    "eleven": 665,
    "cocopanda": 707,
    "nordicfeel": 699
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665,
   665
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p25bbf472",
  "name": "Marc Jacobs Daisy Love EdT 50 ml",
  "size": "50 ml",
  "brand": "Marc Jacobs",
  "category": "parfym/dam/parfym/eau de toilette",
  "emoji": "✨",
  "price": {
   "SE": 689
  },
  "regular": {
   "SE": 852
  },
  "low52": {
   "SE": 689
  },
  "high52": {
   "SE": 852
  },
  "chains": {
   "SE": {
    "lyko": 852,
    "kicks": 851.25,
    "eleven": 794.5,
    "cocopanda": 757,
    "nordicfeel": 689
   }
  },
  "cheapest": {
   "SE": "nordicfeel"
  },
  "sparkline": [
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689,
   689
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p2631c7d7",
  "name": "Dolce & Gabbana K by Dolce&Gabbana Parfum 50 ml",
  "size": "50 ml",
  "brand": "Dolce & Gabbana",
  "category": "parfym/man/parfym/parfum",
  "emoji": "✨",
  "price": {
   "SE": 699
  },
  "regular": {
   "SE": 1285
  },
  "low52": {
   "SE": 699
  },
  "high52": {
   "SE": 1285
  },
  "chains": {
   "SE": {
    "lyko": 742,
    "kicks": 1285,
    "eleven": 1015,
    "cocopanda": 740,
    "nordicfeel": 699
   }
  },
  "cheapest": {
   "SE": "nordicfeel"
  },
  "sparkline": [
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699,
   699
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p85b06794",
  "name": "Versace Dylan Purple Pour Femme EdP 50 ml",
  "size": "50 ml",
  "brand": "Versace",
  "category": "parfym/nice price parfym",
  "emoji": "✨",
  "price": {
   "SE": 752
  },
  "regular": {
   "SE": 861
  },
  "low52": {
   "SE": 752
  },
  "high52": {
   "SE": 861
  },
  "chains": {
   "SE": {
    "lyko": 752,
    "kicks": 849,
    "eleven": 861,
    "cocopanda": 752,
    "nordicfeel": 839
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752,
   752
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p5f09d3b9",
  "name": "Dolce & Gabbana Light Blue Pour Homme EdP 50 ml",
  "size": "50 ml",
  "brand": "Dolce & Gabbana",
  "category": "parfym/man/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 762
  },
  "regular": {
   "SE": 1270
  },
  "low52": {
   "SE": 762
  },
  "high52": {
   "SE": 1270
  },
  "chains": {
   "SE": {
    "lyko": 975,
    "kicks": 1270,
    "eleven": 889,
    "cocopanda": 762,
    "nordicfeel": 975
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762,
   762
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p7ebad5f3",
  "name": "Rabanne Million Gold For Him EdP Intense 50 ml",
  "size": "50 ml",
  "brand": "Rabanne",
  "category": "parfym/man/parfym/parfum",
  "emoji": "✨",
  "price": {
   "SE": 785
  },
  "regular": {
   "SE": 1150
  },
  "low52": {
   "SE": 785
  },
  "high52": {
   "SE": 1150
  },
  "chains": {
   "SE": {
    "lyko": 785,
    "kicks": 1150,
    "eleven": 805,
    "cocopanda": 922,
    "nordicfeel": 920
   }
  },
  "cheapest": {
   "SE": "lyko"
  },
  "sparkline": [
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785,
   785
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p8315de6b",
  "name": "Emporio Armani Stronger With You Eau de Toilette 100 ml",
  "size": "100 ml",
  "brand": "Armani",
  "category": "parfym/man/parfym/eau de toilette",
  "emoji": "✨",
  "price": {
   "SE": 910
  },
  "regular": {
   "SE": 1199
  },
  "low52": {
   "SE": 910
  },
  "high52": {
   "SE": 1199
  },
  "chains": {
   "SE": {
    "lyko": 980,
    "kicks": 999,
    "eleven": 910,
    "cocopanda": 1013,
    "nordicfeel": 1199
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910,
   910
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p8b7a5745",
  "name": "Juliette Has A Gun Ex Vetiver EdP 100 ml",
  "size": "100 ml",
  "brand": "Juliette Has A Gun",
  "category": "parfym/dam/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 925
  },
  "regular": {
   "SE": 1599
  },
  "low52": {
   "SE": 925
  },
  "high52": {
   "SE": 1599
  },
  "chains": {
   "SE": {
    "lyko": 1176,
    "kicks": 1199.25,
    "eleven": 1599,
    "cocopanda": 925,
    "nordicfeel": 1599
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925,
   925
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p66dd0026",
  "name": "Yves Saint Laurent Black Opium EdP 50 ml",
  "size": "50 ml",
  "brand": "Yves Saint Laurent",
  "category": "parfym/nice price parfym",
  "emoji": "✨",
  "price": {
   "SE": 980
  },
  "regular": {
   "SE": 1299
  },
  "low52": {
   "SE": 980
  },
  "high52": {
   "SE": 1299
  },
  "chains": {
   "SE": {
    "lyko": 980,
    "kicks": 1199,
    "eleven": 980,
    "cocopanda": 1011,
    "nordicfeel": 1299
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980,
   980
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pef0a4ce1",
  "name": "Yves Saint Laurent MYSLF Le Parfum 60 ml",
  "size": "60 ml",
  "brand": "Yves Saint Laurent",
  "category": "parfym/man/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 997.5
  },
  "regular": {
   "SE": 1519
  },
  "low52": {
   "SE": 997.5
  },
  "high52": {
   "SE": 1519
  },
  "chains": {
   "SE": {
    "lyko": 1115,
    "kicks": 1519,
    "eleven": 997.5,
    "cocopanda": 1010,
    "nordicfeel": 1115
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5,
   997.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p46233494",
  "name": "Dolce & Gabbana Devotion Pour Homme Parfum 100 ml",
  "size": "100 ml",
  "brand": "Dolce & Gabbana",
  "category": "parfym/man/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 1065
  },
  "regular": {
   "SE": 1765
  },
  "low52": {
   "SE": 1065
  },
  "high52": {
   "SE": 1765
  },
  "chains": {
   "SE": {
    "lyko": 1175,
    "kicks": 1765,
    "eleven": 1379,
    "cocopanda": 1065,
    "nordicfeel": 1345
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065,
   1065
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pf0907518",
  "name": "Lancôme Idôle Power EdP Intense 100 ml",
  "size": "100 ml",
  "brand": "Lancôme",
  "category": "parfym/dam/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 1190
  },
  "regular": {
   "SE": 1274.25
  },
  "low52": {
   "SE": 1190
  },
  "high52": {
   "SE": 1274.25
  },
  "chains": {
   "SE": {
    "lyko": 1270,
    "kicks": 1274.25,
    "eleven": 1190,
    "cocopanda": 1269,
    "nordicfeel": 1270
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190,
   1190
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pc40c6ec2",
  "name": "Jean Paul Gaultier Gaultier Divine Couture EdP Natural Spray 100 ml",
  "size": "100 ml",
  "brand": "Jean Paul Gaultier",
  "category": "parfym/dam/parfym/eau de parfum",
  "emoji": "✨",
  "price": {
   "SE": 1246
  },
  "regular": {
   "SE": 1780
  },
  "low52": {
   "SE": 1246
  },
  "high52": {
   "SE": 1780
  },
  "chains": {
   "SE": {
    "lyko": 1695,
    "kicks": 1780,
    "eleven": 1246,
    "cocopanda": 1296,
    "nordicfeel": 1695
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246,
   1246
  ],
  "confidence": "high",
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
   "SE": 29.25
  },
  "regular": {
   "SE": 39
  },
  "low52": {
   "SE": 29.25
  },
  "high52": {
   "SE": 39
  },
  "chains": {
   "SE": {
    "lyko": 39,
    "meds": 32,
    "eleven": 29.25,
    "nordicfeel": 36
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25,
   29.25
  ],
  "confidence": "high",
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
   "SE": 218.7
  },
  "low52": {
   "SE": 31.5
  },
  "high52": {
   "SE": 218.7
  },
  "chains": {
   "SE": {
    "lyko": 31.5,
    "kicks": 55.3,
    "eleven": 182.25,
    "nordicfeel": 218.7
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
  "confidence": "high",
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
   "SE": 159.3
  },
  "low52": {
   "SE": 31.5
  },
  "high52": {
   "SE": 159.3
  },
  "chains": {
   "SE": {
    "lyko": 31.5,
    "kicks": 55.3,
    "eleven": 44.25,
    "nordicfeel": 159.3
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
  "confidence": "high",
  "verdict": "buy",
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
   "SE": 34.3
  },
  "regular": {
   "SE": 47
  },
  "low52": {
   "SE": 34.3
  },
  "high52": {
   "SE": 47
  },
  "chains": {
   "SE": {
    "meds": 36,
    "kicks": 36.75,
    "eleven": 34.3,
    "nordicfeel": 47
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3,
   34.3
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p402ed12b",
  "name": "NIVEA Hydrocare Shaving Foam For Men 200 ml",
  "size": "200 ml",
  "brand": "NIVEA",
  "category": "man/rakning/rakgel & rakskum",
  "emoji": "✨",
  "price": {
   "SE": 39.2
  },
  "regular": {
   "SE": 56
  },
  "low52": {
   "SE": 39.2
  },
  "high52": {
   "SE": 56
  },
  "chains": {
   "SE": {
    "kicks": 56,
    "eleven": 39.2,
    "cocopanda": 44,
    "nordicfeel": 56
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2,
   39.2
  ],
  "confidence": "high",
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
   "SE": 65
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 65
  },
  "chains": {
   "SE": {
    "meds": 49,
    "kicks": 49,
    "eleven": 65,
    "nordicfeel": 50
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
  "confidence": "high",
  "verdict": "buy",
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
   "SE": 65
  },
  "low52": {
   "SE": 49
  },
  "high52": {
   "SE": 65
  },
  "chains": {
   "SE": {
    "meds": 54,
    "kicks": 49,
    "eleven": 65,
    "nordicfeel": 49
   }
  },
  "cheapest": {
   "SE": "nordicfeel"
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
  "confidence": "high",
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
    "kicks": 129,
    "eleven": 129,
    "nordicfeel": 94
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
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pa97fd0f7",
  "name": "OSiS Session 100 ml",
  "size": "100 ml",
  "brand": "Schwarzkopf Professional",
  "category": "hår/professionell hårvård/professionell skönhet/styling/hårspray/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 67
  },
  "regular": {
   "SE": 169
  },
  "low52": {
   "SE": 67
  },
  "high52": {
   "SE": 169
  },
  "chains": {
   "SE": {
    "meds": 115,
    "eleven": 169,
    "cocopanda": 67,
    "nordicfeel": 115
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67,
   67
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pab3f033c",
  "name": "Garnier Vitamin C* Fresh & Bright Hydrating Sorbet Cream 85 ml",
  "size": "85 ml",
  "brand": "Garnier",
  "category": "ansikte/ansiktskräm/dagkräm",
  "emoji": "✨",
  "price": {
   "SE": 67.15
  },
  "regular": {
   "SE": 105
  },
  "low52": {
   "SE": 67.15
  },
  "high52": {
   "SE": 105
  },
  "chains": {
   "SE": {
    "meds": 79,
    "kicks": 79,
    "eleven": 67.15,
    "cocopanda": 105
   }
  },
  "cheapest": {
   "SE": "eleven"
  },
  "sparkline": [
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15,
   67.15
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p7d3ea377",
  "name": "L'Oréal Paris Elvital Bond Repair Conditioner 150 ml",
  "size": "150 ml",
  "brand": "L'Oréal Paris",
  "category": "hår/balsam",
  "emoji": "✨",
  "price": {
   "SE": 73.5
  },
  "regular": {
   "SE": 260.25
  },
  "low52": {
   "SE": 73.5
  },
  "high52": {
   "SE": 260.25
  },
  "chains": {
   "SE": {
    "meds": 99,
    "kicks": 73.5,
    "eleven": 260.25,
    "cocopanda": 77
   }
  },
  "cheapest": {
   "SE": "kicks"
  },
  "sparkline": [
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5,
   73.5
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p87389fff",
  "name": "L'Oréal Paris Magic Retouch Direct Color Dark Blonde",
  "size": "",
  "brand": "L'Oréal Paris",
  "category": "hår/hårfärg/hårtoning",
  "emoji": "✨",
  "price": {
   "SE": 79
  },
  "regular": {
   "SE": 119
  },
  "low52": {
   "SE": 79
  },
  "high52": {
   "SE": 119
  },
  "chains": {
   "SE": {
    "kicks": 90.3,
    "eleven": 119,
    "cocopanda": 79,
    "nordicfeel": 107
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79,
   79
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p32e922c3",
  "name": "IsaDora The Matte Eyeshadow Stick Longwear & Water-Resistant 63 Cool Taupe 1,2 g",
  "size": "1,2 g",
  "brand": "IsaDora",
  "category": "smink & makeup/ögon/ögonskugga/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 91
  },
  "regular": {
   "SE": 149
  },
  "low52": {
   "SE": 91
  },
  "high52": {
   "SE": 149
  },
  "chains": {
   "SE": {
    "meds": 91,
    "kicks": 149,
    "cocopanda": 111,
    "nordicfeel": 102
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p1c74f00b",
  "name": "IsaDora The Shimmer Eyeshadow Stick Longwear & Water-Resistant 40 Silver Highlight 1,2 g",
  "size": "1,2 g",
  "brand": "IsaDora",
  "category": "smink & makeup/ögon/ögonskugga/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 91
  },
  "regular": {
   "SE": 149
  },
  "low52": {
   "SE": 91
  },
  "high52": {
   "SE": 149
  },
  "chains": {
   "SE": {
    "meds": 91,
    "kicks": 149,
    "cocopanda": 100,
    "nordicfeel": 109
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91,
   91
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pdab6ce6c",
  "name": "Löwengrip Good To Go Dry Shampoo 250 ml",
  "size": "250 ml",
  "brand": "Löwengrip",
  "category": "hår/torrschampo/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 97
  },
  "regular": {
   "SE": 175
  },
  "low52": {
   "SE": 97
  },
  "high52": {
   "SE": 175
  },
  "chains": {
   "SE": {
    "meds": 97,
    "kicks": 175,
    "eleven": 175,
    "nordicfeel": 106
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97,
   97
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pc5d247e6",
  "name": "Lumene Eyebrow Shaping Pencil - 1 Blonde",
  "size": "",
  "brand": "Lumene",
  "category": "smink & makeup/ögonbryn/ögonbrynspenna/veganskt",
  "emoji": "✨",
  "price": {
   "SE": 103
  },
  "regular": {
   "SE": 129
  },
  "low52": {
   "SE": 103
  },
  "high52": {
   "SE": 129
  },
  "chains": {
   "SE": {
    "meds": 103,
    "kicks": 129,
    "eleven": 129,
    "cocopanda": 113
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103,
   103
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "p404fdb19",
  "name": "Raw Naturals Beard Shampoo & Conditioner 250 ml",
  "size": "250 ml",
  "brand": "Raw Naturals",
  "category": "man/skägg & mustasch/skäggvård",
  "emoji": "✨",
  "price": {
   "SE": 113
  },
  "regular": {
   "SE": 159
  },
  "low52": {
   "SE": 113
  },
  "high52": {
   "SE": 159
  },
  "chains": {
   "SE": {
    "kicks": 155,
    "eleven": 159,
    "cocopanda": 113,
    "nordicfeel": 144
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113,
   113
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pb4cc7035",
  "name": "Wella Professionals SP Classic LuxeOil 30 ml",
  "size": "30 ml",
  "brand": "Wella Professionals",
  "category": "hår/hårolja & hårserum",
  "emoji": "✨",
  "price": {
   "SE": 120
  },
  "regular": {
   "SE": 205
  },
  "low52": {
   "SE": 120
  },
  "high52": {
   "SE": 205
  },
  "chains": {
   "SE": {
    "meds": 120,
    "kicks": 199,
    "eleven": 205,
    "nordicfeel": 139
   }
  },
  "cheapest": {
   "SE": "meds"
  },
  "sparkline": [
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 },
 {
  "slug": "pd3fa72cf",
  "name": "Snøløs Stay Hydrated Conditioner 250 ml",
  "size": "250 ml",
  "brand": "Snøløs",
  "category": "hår/hårvård/balsam",
  "emoji": "✨",
  "price": {
   "SE": 120
  },
  "regular": {
   "SE": 249
  },
  "low52": {
   "SE": 120
  },
  "high52": {
   "SE": 249
  },
  "chains": {
   "SE": {
    "kicks": 249,
    "eleven": 249,
    "cocopanda": 120,
    "nordicfeel": 189
   }
  },
  "cheapest": {
   "SE": "cocopanda"
  },
  "sparkline": [
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120,
   120
  ],
  "confidence": "high",
  "verdict": "buy",
  "sector": "beauty"
 }
];
const FUEL_STATIONS = {};
const STORES = [
 {
  "slug": "sdf1f1f61",
  "name": "ICA Nära Alléns",
  "chain": "ica",
  "city": "Täby",
  "country": "SE",
  "district": "Täby",
  "distance": 0,
  "basketCost": 1418,
  "basketDiff": -448,
  "percentile": 0,
  "openTill": "",
  "coords": [
   18.0852,
   59.4272
  ],
  "lat": 59.4272,
  "lng": 18.0852,
  "priceBasis": "per_store"
 },
 {
  "slug": "s747748d6",
  "name": "ICA Supermarket Berga Centrum, Linköping",
  "chain": "ica",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1439,
  "basketDiff": -427,
  "percentile": 1,
  "openTill": "",
  "coords": [
   15.6435,
   58.3923
  ],
  "lat": 58.3923,
  "lng": 15.6435,
  "priceBasis": "per_store"
 },
 {
  "slug": "sb351a467",
  "name": "ICA Nära Järbo",
  "chain": "ica",
  "city": "Järbo",
  "country": "SE",
  "district": "Järbo",
  "distance": 0,
  "basketCost": 1446,
  "basketDiff": -420,
  "percentile": 1,
  "openTill": "",
  "coords": [
   16.5978,
   60.7151
  ],
  "lat": 60.7151,
  "lng": 16.5978,
  "priceBasis": "per_store"
 },
 {
  "slug": "sc687bcd6",
  "name": "ICA Nära Gällstad",
  "chain": "ica",
  "city": "Gällstad",
  "country": "SE",
  "district": "Gällstad",
  "distance": 0,
  "basketCost": 1465,
  "basketDiff": -401,
  "percentile": 1,
  "openTill": "",
  "coords": [
   13.4342,
   57.6686
  ],
  "lat": 57.6686,
  "lng": 13.4342,
  "priceBasis": "per_store"
 },
 {
  "slug": "s5e280dd4",
  "name": "ICA Supermarket Laxå",
  "chain": "ica",
  "city": "Laxå",
  "country": "SE",
  "district": "Laxå",
  "distance": 0,
  "basketCost": 1467,
  "basketDiff": -399,
  "percentile": 1,
  "openTill": "",
  "coords": [
   14.6199,
   58.9852
  ],
  "lat": 58.9852,
  "lng": 14.6199,
  "priceBasis": "per_store"
 },
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
  "percentile": 2,
  "openTill": "",
  "coords": [
   21.046,
   67.6484
  ],
  "lat": 67.6484,
  "lng": 21.046,
  "priceBasis": "regional"
 },
 {
  "slug": "s430e6684",
  "name": "ICA Supermarket Delsbohallen",
  "chain": "ica",
  "city": "Delsbo",
  "country": "SE",
  "district": "Delsbo",
  "distance": 0,
  "basketCost": 1476,
  "basketDiff": -390,
  "percentile": 2,
  "openTill": "",
  "coords": [
   16.5533,
   61.7998
  ],
  "lat": 61.7998,
  "lng": 16.5533,
  "priceBasis": "per_store"
 },
 {
  "slug": "s28c46f8a",
  "name": "ICA Supermarket Eneby",
  "chain": "ica",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1508,
  "basketDiff": -358,
  "percentile": 2,
  "openTill": "",
  "coords": [
   16.1443,
   58.6038
  ],
  "lat": 58.6038,
  "lng": 16.1443,
  "priceBasis": "per_store"
 },
 {
  "slug": "sad6ea40f",
  "name": "ICA Nära Ålem",
  "chain": "ica",
  "city": "Ålem",
  "country": "SE",
  "district": "Ålem",
  "distance": 0,
  "basketCost": 1512,
  "basketDiff": -354,
  "percentile": 2,
  "openTill": "",
  "coords": [
   16.3819,
   56.9551
  ],
  "lat": 56.9551,
  "lng": 16.3819,
  "priceBasis": "per_store"
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
  "percentile": 3,
  "openTill": "",
  "coords": [
   17.6846,
   59.8655
  ],
  "lat": 59.8655,
  "lng": 17.6846,
  "priceBasis": "per_store"
 },
 {
  "slug": "sb985f71c",
  "name": "ICA Supermarket Lammhult",
  "chain": "ica",
  "city": "Lammhult",
  "country": "SE",
  "district": "Lammhult",
  "distance": 0,
  "basketCost": 1528,
  "basketDiff": -338,
  "percentile": 3,
  "openTill": "",
  "coords": [
   14.5838,
   57.1697
  ],
  "lat": 57.1697,
  "lng": 14.5838,
  "priceBasis": "per_store"
 },
 {
  "slug": "sef9e02c3",
  "name": "ICA Supermarket Alvesta",
  "chain": "ica",
  "city": "ALVESTA",
  "country": "SE",
  "district": "ALVESTA",
  "distance": 0,
  "basketCost": 1539,
  "basketDiff": -327,
  "percentile": 3,
  "openTill": "",
  "coords": [
   14.5525,
   56.9002
  ],
  "lat": 56.9002,
  "lng": 14.5525,
  "priceBasis": "per_store"
 },
 {
  "slug": "s9b83f8e0",
  "name": "ICA Nära Boxholm",
  "chain": "ica",
  "city": "Boxholm",
  "country": "SE",
  "district": "Boxholm",
  "distance": 0,
  "basketCost": 1539,
  "basketDiff": -327,
  "percentile": 3,
  "openTill": "",
  "coords": [
   15.0547,
   58.1968
  ],
  "lat": 58.1968,
  "lng": 15.0547,
  "priceBasis": "per_store"
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
  "percentile": 4,
  "openTill": "",
  "coords": [
   13.4403,
   59.4348
  ],
  "lat": 59.4348,
  "lng": 13.4403,
  "priceBasis": "per_store"
 },
 {
  "slug": "sde0a3674",
  "name": "ICA Supermarket Järvsö",
  "chain": "ica",
  "city": "Järvsö",
  "country": "SE",
  "district": "Järvsö",
  "distance": 0,
  "basketCost": 1540,
  "basketDiff": -326,
  "percentile": 4,
  "openTill": "",
  "coords": [
   16.1696,
   61.7178
  ],
  "lat": 61.7178,
  "lng": 16.1696,
  "priceBasis": "per_store"
 },
 {
  "slug": "s105e2b69",
  "name": "ICA Supermarket Munka Ljungby",
  "chain": "ica",
  "city": "Munka-Ljungby",
  "country": "SE",
  "district": "Munka-Ljungby",
  "distance": 0,
  "basketCost": 1553,
  "basketDiff": -313,
  "percentile": 4,
  "openTill": "",
  "coords": [
   12.9688,
   56.2597
  ],
  "lat": 56.2597,
  "lng": 12.9688,
  "priceBasis": "per_store"
 },
 {
  "slug": "s8cd260b0",
  "name": "ICA Supermarket Hofors",
  "chain": "ica",
  "city": "Hofors",
  "country": "SE",
  "district": "Hofors",
  "distance": 0,
  "basketCost": 1555,
  "basketDiff": -311,
  "percentile": 4,
  "openTill": "",
  "coords": [
   16.2843,
   60.5462
  ],
  "lat": 60.5462,
  "lng": 16.2843,
  "priceBasis": "per_store"
 },
 {
  "slug": "s3e0cff50",
  "name": "ICA Skansen",
  "chain": "ica",
  "city": "Mörbylånga",
  "country": "SE",
  "district": "Mörbylånga",
  "distance": 0,
  "basketCost": 1572,
  "basketDiff": -294,
  "percentile": 5,
  "openTill": "",
  "coords": [
   16.3856,
   56.5256
  ],
  "lat": 56.5256,
  "lng": 16.3856,
  "priceBasis": "per_store"
 },
 {
  "slug": "s33a7a439",
  "name": "ICA Kvantum Södra Sandby",
  "chain": "ica",
  "city": "Södra Sandby",
  "country": "SE",
  "district": "Södra Sandby",
  "distance": 0,
  "basketCost": 1574,
  "basketDiff": -292,
  "percentile": 5,
  "openTill": "",
  "coords": [
   13.3432,
   55.7168
  ],
  "lat": 55.7168,
  "lng": 13.3432,
  "priceBasis": "per_store"
 },
 {
  "slug": "s79e096ab",
  "name": "ICA Kvantum Hörby",
  "chain": "ica",
  "city": "Hörby",
  "country": "SE",
  "district": "Hörby",
  "distance": 0,
  "basketCost": 1590,
  "basketDiff": -276,
  "percentile": 5,
  "openTill": "",
  "coords": [
   13.6476,
   55.8491
  ],
  "lat": 55.8491,
  "lng": 13.6476,
  "priceBasis": "per_store"
 },
 {
  "slug": "sd8fcfc1b",
  "name": "ICA Supermarket Matfors",
  "chain": "ica",
  "city": "Matfors",
  "country": "SE",
  "district": "Matfors",
  "distance": 0,
  "basketCost": 1600,
  "basketDiff": -266,
  "percentile": 5,
  "openTill": "",
  "coords": [
   17.0203,
   62.3476
  ],
  "lat": 62.3476,
  "lng": 17.0203,
  "priceBasis": "per_store"
 },
 {
  "slug": "s71907953",
  "name": "ICA Supermarket Skutan",
  "chain": "ica",
  "city": "Hamburgsund",
  "country": "SE",
  "district": "Hamburgsund",
  "distance": 0,
  "basketCost": 1609,
  "basketDiff": -257,
  "percentile": 6,
  "openTill": "",
  "coords": [
   11.2709,
   58.5521
  ],
  "lat": 58.5521,
  "lng": 11.2709,
  "priceBasis": "per_store"
 },
 {
  "slug": "s11b248bb",
  "name": "ICA Kvantum Malmborgs Caroli",
  "chain": "ica",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1625,
  "basketDiff": -241,
  "percentile": 6,
  "openTill": "",
  "coords": [
   13.0079,
   55.6062
  ],
  "lat": 55.6062,
  "lng": 13.0079,
  "priceBasis": "per_store"
 },
 {
  "slug": "s2bbe4d13",
  "name": "ICA Supermarket Ettan",
  "chain": "ica",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1627,
  "basketDiff": -239,
  "percentile": 6,
  "openTill": "",
  "coords": [
   16.559,
   59.6227
  ],
  "lat": 59.6227,
  "lng": 16.559,
  "priceBasis": "per_store"
 },
 {
  "slug": "s5c637874",
  "name": "ICA Supermarket Sollebrunn",
  "chain": "ica",
  "city": "Sollebrunn",
  "country": "SE",
  "district": "Sollebrunn",
  "distance": 0,
  "basketCost": 1628,
  "basketDiff": -238,
  "percentile": 6,
  "openTill": "",
  "coords": [
   12.532,
   58.12
  ],
  "lat": 58.12,
  "lng": 12.532,
  "priceBasis": "per_store"
 },
 {
  "slug": "sfcc33e90",
  "name": "ICA Nära Braås",
  "chain": "ica",
  "city": "Braås",
  "country": "SE",
  "district": "Braås",
  "distance": 0,
  "basketCost": 1630,
  "basketDiff": -236,
  "percentile": 7,
  "openTill": "",
  "coords": [
   15.0516,
   57.0626
  ],
  "lat": 57.0626,
  "lng": 15.0516,
  "priceBasis": "per_store"
 },
 {
  "slug": "sed9e3eb2",
  "name": "ICA Supermarket Näsbyhallen",
  "chain": "ica",
  "city": "Frövi",
  "country": "SE",
  "district": "Frövi",
  "distance": 0,
  "basketCost": 1640,
  "basketDiff": -226,
  "percentile": 7,
  "openTill": "",
  "coords": [
   15.3601,
   59.4674
  ],
  "lat": 59.4674,
  "lng": 15.3601,
  "priceBasis": "per_store"
 },
 {
  "slug": "s7c88e938",
  "name": "ICA Nära Bräkne-Hoby",
  "chain": "ica",
  "city": "Bräkne-Hoby",
  "country": "SE",
  "district": "Bräkne-Hoby",
  "distance": 0,
  "basketCost": 1648,
  "basketDiff": -218,
  "percentile": 7,
  "openTill": "",
  "coords": [
   15.1165,
   56.2329
  ],
  "lat": 56.2329,
  "lng": 15.1165,
  "priceBasis": "per_store"
 },
 {
  "slug": "s910a88a9",
  "name": "ICA Folkes Livs",
  "chain": "ica",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1675,
  "basketDiff": -191,
  "percentile": 7,
  "openTill": "",
  "coords": [
   17.6184,
   59.8558
  ],
  "lat": 59.8558,
  "lng": 17.6184,
  "priceBasis": "per_store"
 },
 {
  "slug": "sf1fdb121",
  "name": "ICA Supermarket Lysekil",
  "chain": "ica",
  "city": "Lysekil",
  "country": "SE",
  "district": "Lysekil",
  "distance": 0,
  "basketCost": 1676,
  "basketDiff": -190,
  "percentile": 8,
  "openTill": "",
  "coords": [
   11.4406,
   58.2762
  ],
  "lat": 58.2762,
  "lng": 11.4406,
  "priceBasis": "per_store"
 },
 {
  "slug": "sa99c77e2",
  "name": "ICA Kvantum Skellefteå",
  "chain": "ica",
  "city": "Skellefteå",
  "country": "SE",
  "district": "Skellefteå",
  "distance": 0,
  "basketCost": 1677,
  "basketDiff": -189,
  "percentile": 8,
  "openTill": "",
  "coords": [
   21.0256,
   64.7659
  ],
  "lat": 64.7659,
  "lng": 21.0256,
  "priceBasis": "per_store"
 },
 {
  "slug": "sf89d951b",
  "name": "ICA Supermarket Forshaga",
  "chain": "ica",
  "city": "Forshaga",
  "country": "SE",
  "district": "Forshaga",
  "distance": 0,
  "basketCost": 1681,
  "basketDiff": -185,
  "percentile": 8,
  "openTill": "",
  "coords": [
   13.4809,
   59.5324
  ],
  "lat": 59.5324,
  "lng": 13.4809,
  "priceBasis": "per_store"
 },
 {
  "slug": "s9d83aab3",
  "name": "ICA Kvantum Mariestad",
  "chain": "ica",
  "city": "Mariestad",
  "country": "SE",
  "district": "Mariestad",
  "distance": 0,
  "basketCost": 1696,
  "basketDiff": -170,
  "percentile": 8,
  "openTill": "",
  "coords": [
   13.8278,
   58.71
  ],
  "lat": 58.71,
  "lng": 13.8278,
  "priceBasis": "per_store"
 },
 {
  "slug": "sad500b74",
  "name": "ICA Supermarket Nossebro",
  "chain": "ica",
  "city": "Nossebro",
  "country": "SE",
  "district": "Nossebro",
  "distance": 0,
  "basketCost": 1705,
  "basketDiff": -161,
  "percentile": 9,
  "openTill": "",
  "coords": [
   12.7171,
   58.1902
  ],
  "lat": 58.1902,
  "lng": 12.7171,
  "priceBasis": "per_store"
 },
 {
  "slug": "s06293613",
  "name": "ICA Supermarket Ljungskile",
  "chain": "ica",
  "city": "Ljungskile",
  "country": "SE",
  "district": "Ljungskile",
  "distance": 0,
  "basketCost": 1706,
  "basketDiff": -160,
  "percentile": 9,
  "openTill": "",
  "coords": [
   11.9189,
   58.2258
  ],
  "lat": 58.2258,
  "lng": 11.9189,
  "priceBasis": "per_store"
 },
 {
  "slug": "s72159eb1",
  "name": "ICA Supermarket Margretelund",
  "chain": "ica",
  "city": "Lidköping",
  "country": "SE",
  "district": "Lidköping",
  "distance": 0,
  "basketCost": 1708,
  "basketDiff": -158,
  "percentile": 9,
  "openTill": "",
  "coords": [
   13.1685,
   58.4954
  ],
  "lat": 58.4954,
  "lng": 13.1685,
  "priceBasis": "per_store"
 },
 {
  "slug": "sb0626747",
  "name": "ICA Kvantum Teleborg",
  "chain": "ica",
  "city": "Växjö",
  "country": "SE",
  "district": "Växjö",
  "distance": 0,
  "basketCost": 1712,
  "basketDiff": -154,
  "percentile": 9,
  "openTill": "",
  "coords": [
   14.8225,
   56.8574
  ],
  "lat": 56.8574,
  "lng": 14.8225,
  "priceBasis": "per_store"
 },
 {
  "slug": "s6d311a47",
  "name": "ICA Nära Börsen",
  "chain": "ica",
  "city": "Umeå",
  "country": "SE",
  "district": "Umeå",
  "distance": 0,
  "basketCost": 1738,
  "basketDiff": -128,
  "percentile": 10,
  "openTill": "",
  "coords": [
   20.3929,
   64.0044
  ],
  "lat": 64.0044,
  "lng": 20.3929,
  "priceBasis": "per_store"
 },
 {
  "slug": "s2769a690",
  "name": "ICA Supermarket Östra Husby",
  "chain": "ica",
  "city": "Vikbolandet",
  "country": "SE",
  "district": "Vikbolandet",
  "distance": 0,
  "basketCost": 1740,
  "basketDiff": -126,
  "percentile": 10,
  "openTill": "",
  "coords": [
   16.5679,
   58.5764
  ],
  "lat": 58.5764,
  "lng": 16.5679,
  "priceBasis": "per_store"
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
  "percentile": 10,
  "openTill": "",
  "coords": [
   12.701,
   59.0596
  ],
  "lat": 59.0596,
  "lng": 12.701,
  "priceBasis": "regional"
 },
 {
  "slug": "sa6331739",
  "name": "ICA Supermarket Eksjö",
  "chain": "ica",
  "city": "Eksjö",
  "country": "SE",
  "district": "Eksjö",
  "distance": 0,
  "basketCost": 1775,
  "basketDiff": -91,
  "percentile": 10,
  "openTill": "",
  "coords": [
   14.9767,
   57.6655
  ],
  "lat": 57.6655,
  "lng": 14.9767,
  "priceBasis": "per_store"
 },
 {
  "slug": "se46ae01c",
  "name": "ICA Supermarket Noltorp",
  "chain": "ica",
  "city": "Alingsås",
  "country": "SE",
  "district": "Alingsås",
  "distance": 0,
  "basketCost": 1786,
  "basketDiff": -80,
  "percentile": 11,
  "openTill": "",
  "coords": [
   12.5219,
   57.9379
  ],
  "lat": 57.9379,
  "lng": 12.5219,
  "priceBasis": "per_store"
 },
 {
  "slug": "sca53f672",
  "name": "ICA Kvantum Götene",
  "chain": "ica",
  "city": "Götene",
  "country": "SE",
  "district": "Götene",
  "distance": 0,
  "basketCost": 1812,
  "basketDiff": -54,
  "percentile": 11,
  "openTill": "",
  "coords": [
   13.4946,
   58.5289
  ],
  "lat": 58.5289,
  "lng": 13.4946,
  "priceBasis": "per_store"
 },
 {
  "slug": "s99d9d613",
  "name": "ICA Supermarket Björksätra",
  "chain": "ica",
  "city": "Sandviken",
  "country": "SE",
  "district": "Sandviken",
  "distance": 0,
  "basketCost": 1817,
  "basketDiff": -49,
  "percentile": 11,
  "openTill": "",
  "coords": [
   16.7499,
   60.6056
  ],
  "lat": 60.6056,
  "lng": 16.7499,
  "priceBasis": "per_store"
 },
 {
  "slug": "sb0a7d363",
  "name": "ICA Supermarket Osby",
  "chain": "ica",
  "city": "Osby",
  "country": "SE",
  "district": "Osby",
  "distance": 0,
  "basketCost": 1845,
  "basketDiff": -21,
  "percentile": 11,
  "openTill": "",
  "coords": [
   13.9935,
   56.3807
  ],
  "lat": 56.3807,
  "lng": 13.9935,
  "priceBasis": "per_store"
 },
 {
  "slug": "s19fc71ef",
  "name": "ICA Supermarket Svenstavik",
  "chain": "ica",
  "city": "Svenstavik",
  "country": "SE",
  "district": "Svenstavik",
  "distance": 0,
  "basketCost": 1858,
  "basketDiff": -8,
  "percentile": 12,
  "openTill": "",
  "coords": [
   14.4348,
   62.7677
  ],
  "lat": 62.7677,
  "lng": 14.4348,
  "priceBasis": "per_store"
 },
 {
  "slug": "sccd77d54",
  "name": "Hemköp Garpes",
  "chain": "hemkop",
  "city": "Bromma",
  "country": "SE",
  "district": "Bromma",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9564,
   59.329
  ],
  "lat": 59.329,
  "lng": 17.9564,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0899,
   60.6754
  ],
  "lat": 60.6754,
  "lng": 15.0899,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.1864,
   60.1506
  ],
  "lat": 60.1506,
  "lng": 15.1864,
  "priceBasis": "national"
 },
 {
  "slug": "s98c30ccc",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Sköndal",
  "country": "SE",
  "district": "Sköndal",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1217,
   59.2632
  ],
  "lat": 59.2632,
  "lng": 18.1217,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.968,
   57.6986
  ],
  "lat": 57.6986,
  "lng": 11.968,
  "priceBasis": "national"
 },
 {
  "slug": "s65552a4c",
  "name": "Hemköp Trollhättan Hjortmossen",
  "chain": "hemkop",
  "city": "Trollhättan",
  "country": "SE",
  "district": "Trollhättan",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.2946,
   58.2758
  ],
  "lat": 58.2758,
  "lng": 12.2946,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.4412,
   60.4711
  ],
  "lat": 60.4711,
  "lng": 15.4412,
  "priceBasis": "national"
 },
 {
  "slug": "s5d73eab1",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Falun",
  "country": "SE",
  "district": "Falun",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6344,
   60.6051
  ],
  "lat": 60.6051,
  "lng": 15.6344,
  "priceBasis": "national"
 },
 {
  "slug": "se39b3a75",
  "name": "Hemköp Skövde Hentorpshallen",
  "chain": "hemkop",
  "city": "Skövde",
  "country": "SE",
  "district": "Skövde",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.8245,
   58.369
  ],
  "lat": 58.369,
  "lng": 13.8245,
  "priceBasis": "national"
 },
 {
  "slug": "s8864205c",
  "name": "Hemköp Västerås Malmaberg",
  "chain": "hemkop",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.5808,
   59.6268
  ],
  "lat": 59.6268,
  "lng": 16.5808,
  "priceBasis": "national"
 },
 {
  "slug": "sf59a418d",
  "name": "Hemköp Norrköping Lindö",
  "chain": "hemkop",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.2458,
   58.6018
  ],
  "lat": 58.6018,
  "lng": 16.2458,
  "priceBasis": "national"
 },
 {
  "slug": "sa238ae10",
  "name": "Hemköp Norrköping Ljura",
  "chain": "hemkop",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.1972,
   58.5807
  ],
  "lat": 58.5807,
  "lng": 16.1972,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.294,
   58.287
  ],
  "lat": 58.287,
  "lng": 12.294,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1142,
   59.2555
  ],
  "lat": 59.2555,
  "lng": 18.1142,
  "priceBasis": "national"
 },
 {
  "slug": "sd7c09a0d",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Svanesund",
  "country": "SE",
  "district": "Svanesund",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.8212,
   58.1424
  ],
  "lat": 58.1424,
  "lng": 11.8212,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9992,
   59.3808
  ],
  "lat": 59.3808,
  "lng": 17.9992,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9431,
   57.6984
  ],
  "lat": 57.6984,
  "lng": 11.9431,
  "priceBasis": "national"
 },
 {
  "slug": "s1f452655",
  "name": "Hemköp Bromma Ängby Torg",
  "chain": "hemkop",
  "city": "Bromma",
  "country": "SE",
  "district": "Bromma",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9086,
   59.347
  ],
  "lat": 59.347,
  "lng": 17.9086,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.6044,
   56.1613
  ],
  "lat": 56.1613,
  "lng": 13.6044,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.1141,
   57.6581
  ],
  "lat": 57.6581,
  "lng": 12.1141,
  "priceBasis": "national"
 },
 {
  "slug": "scca1073c",
  "name": "Hemköp Tyresö Trollbäcken C",
  "chain": "hemkop",
  "city": "Tyresö",
  "country": "SE",
  "district": "Tyresö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.2007,
   59.2237
  ],
  "lat": 59.2237,
  "lng": 18.2007,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8377,
   59.4236
  ],
  "lat": 59.4236,
  "lng": 17.8377,
  "priceBasis": "national"
 },
 {
  "slug": "sce8a26c9",
  "name": "Hemköp Motala Verkstan Östenssons",
  "chain": "hemkop",
  "city": "Motala",
  "country": "SE",
  "district": "Motala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0587,
   58.5486
  ],
  "lat": 58.5486,
  "lng": 15.0587,
  "priceBasis": "national"
 },
 {
  "slug": "s1b8a146d",
  "name": "Hemköp Motala Väster Östenssons",
  "chain": "hemkop",
  "city": "Motala",
  "country": "SE",
  "district": "Motala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0033,
   58.5353
  ],
  "lat": 58.5353,
  "lng": 15.0033,
  "priceBasis": "national"
 },
 {
  "slug": "sbd8b15c4",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Ljungbyhed",
  "country": "SE",
  "district": "Ljungbyhed",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.2351,
   56.0736
  ],
  "lat": 56.0736,
  "lng": 13.2351,
  "priceBasis": "national"
 },
 {
  "slug": "se323c2fd",
  "name": "Hemköp Vadstena Mima Östenssons",
  "chain": "hemkop",
  "city": "Vadstena",
  "country": "SE",
  "district": "Vadstena",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.9016,
   58.45
  ],
  "lat": 58.45,
  "lng": 14.9016,
  "priceBasis": "national"
 },
 {
  "slug": "s9ff3bc16",
  "name": "Hemköp Nyköping Spelhagen",
  "chain": "hemkop",
  "city": "Nyköping",
  "country": "SE",
  "district": "Nyköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.007,
   58.7454
  ],
  "lat": 58.7454,
  "lng": 17.007,
  "priceBasis": "national"
 },
 {
  "slug": "sd538a4ef",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Upplands Väsby",
  "country": "SE",
  "district": "Upplands Väsby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8882,
   59.5161
  ],
  "lat": 59.5161,
  "lng": 17.8882,
  "priceBasis": "national"
 },
 {
  "slug": "sd6ea6653",
  "name": "Hemköp Torshälla",
  "chain": "hemkop",
  "city": "Torshälla",
  "country": "SE",
  "district": "Torshälla",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.4848,
   59.4184
  ],
  "lat": 59.4184,
  "lng": 16.4848,
  "priceBasis": "national"
 },
 {
  "slug": "s03d03591",
  "name": "Hemköp Linköping Ullstämma Östenssons",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6933,
   58.367
  ],
  "lat": 58.367,
  "lng": 15.6933,
  "priceBasis": "national"
 },
 {
  "slug": "s6eadda72",
  "name": "Hemköp Ljungsbro C",
  "chain": "hemkop",
  "city": "Ljungsbro",
  "country": "SE",
  "district": "Ljungsbro",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.5016,
   58.5097
  ],
  "lat": 58.5097,
  "lng": 15.5016,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.1802,
   60.1814
  ],
  "lat": 60.1814,
  "lng": 17.1802,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.775,
   55.9663
  ],
  "lat": 55.9663,
  "lng": 12.775,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.0034,
   55.5955
  ],
  "lat": 55.5955,
  "lng": 13.0034,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.844,
   58.3885
  ],
  "lat": 58.3885,
  "lng": 13.844,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.2152,
   59.2765
  ],
  "lat": 59.2765,
  "lng": 15.2152,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.4765,
   57.3551
  ],
  "lat": 57.3551,
  "lng": 14.4765,
  "priceBasis": "national"
 },
 {
  "slug": "s006045ce",
  "name": "Hemköp Lindesberg",
  "chain": "hemkop",
  "city": "Lindesberg",
  "country": "SE",
  "district": "Lindesberg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.221,
   59.599
  ],
  "lat": 59.599,
  "lng": 15.221,
  "priceBasis": "national"
 },
 {
  "slug": "sf0293bf6",
  "name": "Hemköp Hedemora",
  "chain": "hemkop",
  "city": "Hedemora",
  "country": "SE",
  "district": "Hedemora",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.9897,
   60.2834
  ],
  "lat": 60.2834,
  "lng": 15.9897,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8119,
   59.4693
  ],
  "lat": 59.4693,
  "lng": 17.8119,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.233,
   59.5654
  ],
  "lat": 59.5654,
  "lng": 16.233,
  "priceBasis": "national"
 },
 {
  "slug": "s2f05bf2e",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Malmköping",
  "country": "SE",
  "district": "Malmköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.7293,
   59.1331
  ],
  "lat": 59.1331,
  "lng": 16.7293,
  "priceBasis": "national"
 },
 {
  "slug": "safd28226",
  "name": "Hemköp Falun Hosjö",
  "chain": "hemkop",
  "city": "Falun",
  "country": "SE",
  "district": "Falun",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.7328,
   60.5901
  ],
  "lat": 60.5901,
  "lng": 15.7328,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9678,
   59.2931
  ],
  "lat": 59.2931,
  "lng": 17.9678,
  "priceBasis": "national"
 },
 {
  "slug": "s4641a648",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Vänersborg",
  "country": "SE",
  "district": "Vänersborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.3356,
   58.3635
  ],
  "lat": 58.3635,
  "lng": 12.3356,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.1032,
   61.7294
  ],
  "lat": 61.7294,
  "lng": 17.1032,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9406,
   59.376
  ],
  "lat": 59.376,
  "lng": 17.9406,
  "priceBasis": "national"
 },
 {
  "slug": "s80fac58d",
  "name": "Hemköp Borensberg Östenssons",
  "chain": "hemkop",
  "city": "Borensberg",
  "country": "SE",
  "district": "Borensberg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.2771,
   58.5625
  ],
  "lat": 58.5625,
  "lng": 15.2771,
  "priceBasis": "national"
 },
 {
  "slug": "s5136f0c2",
  "name": "Hemköp Kinna",
  "chain": "hemkop",
  "city": "Kinna",
  "country": "SE",
  "district": "Kinna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.6958,
   57.5074
  ],
  "lat": 57.5074,
  "lng": 12.6958,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.7671,
   57.7238
  ],
  "lat": 57.7238,
  "lng": 11.7671,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9184,
   57.6929
  ],
  "lat": 57.6929,
  "lng": 11.9184,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9615,
   57.5607
  ],
  "lat": 57.5607,
  "lng": 11.9615,
  "priceBasis": "national"
 },
 {
  "slug": "s038ff023",
  "name": "Hemköp Skänninge Östenssons",
  "chain": "hemkop",
  "city": "Skänninge",
  "country": "SE",
  "district": "Skänninge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0881,
   58.3876
  ],
  "lat": 58.3876,
  "lng": 15.0881,
  "priceBasis": "national"
 },
 {
  "slug": "s6f97c87e",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Valdemarsvik",
  "country": "SE",
  "district": "Valdemarsvik",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.5779,
   58.2163
  ],
  "lat": 58.2163,
  "lng": 16.5779,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.3848,
   59.3241
  ],
  "lat": 59.3241,
  "lng": 18.3848,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6331,
   57.9886
  ],
  "lat": 57.9886,
  "lng": 15.6331,
  "priceBasis": "national"
 },
 {
  "slug": "sb31b3306",
  "name": "Hemköp Alfta Västanågatan",
  "chain": "hemkop",
  "city": "Alfta",
  "country": "SE",
  "district": "Alfta",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.0542,
   61.3461
  ],
  "lat": 61.3461,
  "lng": 16.0542,
  "priceBasis": "national"
 },
 {
  "slug": "safb4be46",
  "name": "Hemköp Munkedal",
  "chain": "hemkop",
  "city": "Munkedal",
  "country": "SE",
  "district": "Munkedal",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.6573,
   58.479
  ],
  "lat": 58.479,
  "lng": 11.6573,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9129,
   57.6732
  ],
  "lat": 57.6732,
  "lng": 11.9129,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.1538,
   58.5031
  ],
  "lat": 58.5031,
  "lng": 13.1538,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9118,
   59.4768
  ],
  "lat": 59.4768,
  "lng": 17.9118,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.7112,
   60.6847
  ],
  "lat": 60.6847,
  "lng": 13.7112,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.6548,
   56.0911
  ],
  "lat": 56.0911,
  "lng": 12.6548,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8729,
   59.3635
  ],
  "lat": 59.3635,
  "lng": 17.8729,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.6433,
   59.8583
  ],
  "lat": 59.8583,
  "lng": 17.6433,
  "priceBasis": "national"
 },
 {
  "slug": "s78ec7e26",
  "name": "Hemköp Oskarström Blåklintsvägen",
  "chain": "hemkop",
  "city": "Oskarström",
  "country": "SE",
  "district": "Oskarström",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.96,
   56.8057
  ],
  "lat": 56.8057,
  "lng": 12.96,
  "priceBasis": "national"
 },
 {
  "slug": "sadc125a7",
  "name": "Hemköp Grästorp Södergatan",
  "chain": "hemkop",
  "city": "Grästorp",
  "country": "SE",
  "district": "Grästorp",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.6766,
   58.3336
  ],
  "lat": 58.3336,
  "lng": 12.6766,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.4642,
   58.6977
  ],
  "lat": 58.6977,
  "lng": 12.4642,
  "priceBasis": "national"
 },
 {
  "slug": "sc592f3d8",
  "name": "Hemköp Norrköping Björkalund Östenssons",
  "chain": "hemkop",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.1696,
   58.5595
  ],
  "lat": 58.5595,
  "lng": 16.1696,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.8723,
   58.4263
  ],
  "lat": 58.4263,
  "lng": 13.8723,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9735,
   59.3612
  ],
  "lat": 59.3612,
  "lng": 17.9735,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6785,
   58.4265
  ],
  "lat": 58.4265,
  "lng": 15.6785,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.3339,
   57.2669
  ],
  "lat": 57.2669,
  "lng": 12.3339,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.0876,
   57.4847
  ],
  "lat": 57.4847,
  "lng": 12.0876,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.8798,
   57.6719
  ],
  "lat": 57.6719,
  "lng": 11.8798,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6209,
   58.4107
  ],
  "lat": 58.4107,
  "lng": 15.6209,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.512,
   59.577
  ],
  "lat": 59.577,
  "lng": 17.512,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.0033,
   58.7526
  ],
  "lat": 58.7526,
  "lng": 17.0033,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.976,
   58.0377
  ],
  "lat": 58.0377,
  "lng": 14.976,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0023,
   59.2788
  ],
  "lat": 59.2788,
  "lng": 18.0023,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.602,
   59.8411
  ],
  "lat": 59.8411,
  "lng": 17.602,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6117,
   58.4189
  ],
  "lat": 58.4189,
  "lng": 15.6117,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.9975,
   60.7332
  ],
  "lat": 60.7332,
  "lng": 14.9975,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9999,
   59.3606
  ],
  "lat": 59.3606,
  "lng": 17.9999,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1033,
   59.3463
  ],
  "lat": 59.3463,
  "lng": 18.1033,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.0458,
   57.1846
  ],
  "lat": 57.1846,
  "lng": 14.0458,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9866,
   59.3498
  ],
  "lat": 59.3498,
  "lng": 17.9866,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.3233,
   58.3792
  ],
  "lat": 58.3792,
  "lng": 12.3233,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1649,
   59.3109
  ],
  "lat": 59.3109,
  "lng": 18.1649,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.2367,
   55.5089
  ],
  "lat": 55.5089,
  "lng": 13.2367,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9522,
   57.6956
  ],
  "lat": 57.6956,
  "lng": 11.9522,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9509,
   57.6928
  ],
  "lat": 57.6928,
  "lng": 11.9509,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8844,
   59.3475
  ],
  "lat": 59.3475,
  "lng": 17.8844,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9646,
   59.2857
  ],
  "lat": 59.2857,
  "lng": 17.9646,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0863,
   59.343
  ],
  "lat": 59.343,
  "lng": 18.0863,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8327,
   59.3606
  ],
  "lat": 59.3606,
  "lng": 17.8327,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.3638,
   56.6651
  ],
  "lat": 56.6651,
  "lng": 16.3638,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0161,
   59.3719
  ],
  "lat": 59.3719,
  "lng": 18.0161,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.1565,
   57.7711
  ],
  "lat": 57.7711,
  "lng": 14.1565,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6282,
   58.4115
  ],
  "lat": 58.4115,
  "lng": 15.6282,
  "priceBasis": "national"
 },
 {
  "slug": "s4792c8a3",
  "name": "Hemköp Vagnhärad C",
  "chain": "hemkop",
  "city": "Vagnhärad",
  "country": "SE",
  "district": "Vagnhärad",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.4868,
   58.9464
  ],
  "lat": 58.9464,
  "lng": 17.4868,
  "priceBasis": "national"
 },
 {
  "slug": "s839e916e",
  "name": "Hemköp Örebro Svampen",
  "chain": "hemkop",
  "city": "Örebro",
  "country": "SE",
  "district": "Örebro",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.225,
   59.2893
  ],
  "lat": 59.2893,
  "lng": 15.225,
  "priceBasis": "national"
 },
 {
  "slug": "seaba678b",
  "name": "Hemköp Stenungsund Stora Höga",
  "chain": "hemkop",
  "city": "Stora Höga",
  "country": "SE",
  "district": "Stora Höga",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.8332,
   58.0153
  ],
  "lat": 58.0153,
  "lng": 11.8332,
  "priceBasis": "national"
 },
 {
  "slug": "se616e949",
  "name": "Hemköp Onsala",
  "chain": "hemkop",
  "city": "Onsala",
  "country": "SE",
  "district": "Onsala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.0194,
   57.4135
  ],
  "lat": 57.4135,
  "lng": 12.0194,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9135,
   57.6525
  ],
  "lat": 57.6525,
  "lng": 11.9135,
  "priceBasis": "national"
 },
 {
  "slug": "s8b91bf3f",
  "name": "Hemköp Mjölby Lundby",
  "chain": "hemkop",
  "city": "Mjölby",
  "country": "SE",
  "district": "Mjölby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.1195,
   58.3193
  ],
  "lat": 58.3193,
  "lng": 15.1195,
  "priceBasis": "national"
 },
 {
  "slug": "s4e0321e6",
  "name": "Hemköp Lerum Solkatten",
  "chain": "hemkop",
  "city": "Lerum",
  "country": "SE",
  "district": "Lerum",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.2689,
   57.7695
  ],
  "lat": 57.7695,
  "lng": 12.2689,
  "priceBasis": "national"
 },
 {
  "slug": "s20f09d9f",
  "name": "Hemköp Sickla Köpkvarter",
  "chain": "hemkop",
  "city": "Nacka",
  "country": "SE",
  "district": "Nacka",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1234,
   59.3061
  ],
  "lat": 59.3061,
  "lng": 18.1234,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.1915,
   55.6945
  ],
  "lat": 55.6945,
  "lng": 13.1915,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.5882,
   56.1622
  ],
  "lat": 56.1622,
  "lng": 15.5882,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.2048,
   59.3481
  ],
  "lat": 59.3481,
  "lng": 18.2048,
  "priceBasis": "national"
 },
 {
  "slug": "s0d672af6",
  "name": "Hemköp 4677 Rondellen",
  "chain": "hemkop",
  "city": "Växjö",
  "country": "SE",
  "district": "Växjö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.8349,
   56.8792
  ],
  "lat": 56.8792,
  "lng": 14.8349,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.5696,
   57.6679
  ],
  "lat": 57.6679,
  "lng": 12.5696,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.6346,
   57.7572
  ],
  "lat": 57.7572,
  "lng": 16.6346,
  "priceBasis": "national"
 },
 {
  "slug": "se656ddc7",
  "name": "Hemköp Malmö Elinegård",
  "chain": "hemkop",
  "city": "Limhamn",
  "country": "SE",
  "district": "Limhamn",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.9468,
   55.5687
  ],
  "lat": 55.5687,
  "lng": 12.9468,
  "priceBasis": "national"
 },
 {
  "slug": "s088ec135",
  "name": "Hemköp Helsingborg Söder",
  "chain": "hemkop",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.7018,
   56.0399
  ],
  "lat": 56.0399,
  "lng": 12.7018,
  "priceBasis": "national"
 },
 {
  "slug": "sbb5669f0",
  "name": "Hemköp Västerhaninge C",
  "chain": "hemkop",
  "city": "Västerhaninge",
  "country": "SE",
  "district": "Västerhaninge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1064,
   59.1227
  ],
  "lat": 59.1227,
  "lng": 18.1064,
  "priceBasis": "national"
 },
 {
  "slug": "sb65ccc30",
  "name": "Hemköp Vendelsö",
  "chain": "hemkop",
  "city": "Vendelsö",
  "country": "SE",
  "district": "Vendelsö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1915,
   59.1998
  ],
  "lat": 59.1998,
  "lng": 18.1915,
  "priceBasis": "national"
 },
 {
  "slug": "sc7bc1125",
  "name": "Hemköp Tyresö Granängsringen",
  "chain": "hemkop",
  "city": "Tyresö",
  "country": "SE",
  "district": "Tyresö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.2295,
   59.238
  ],
  "lat": 59.238,
  "lng": 18.2295,
  "priceBasis": "national"
 },
 {
  "slug": "sb7100112",
  "name": "Hemköp Farsta",
  "chain": "hemkop",
  "city": "Farsta",
  "country": "SE",
  "district": "Farsta",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0934,
   59.242
  ],
  "lat": 59.242,
  "lng": 18.0934,
  "priceBasis": "national"
 },
 {
  "slug": "s10bbda33",
  "name": "Hemköp Södertälje Ellbe Livs",
  "chain": "hemkop",
  "city": "Södertälje",
  "country": "SE",
  "district": "Södertälje",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.6314,
   59.2108
  ],
  "lat": 59.2108,
  "lng": 17.6314,
  "priceBasis": "national"
 },
 {
  "slug": "s473f35d0",
  "name": "Hemköp Haninge C",
  "chain": "hemkop",
  "city": "Haninge",
  "country": "SE",
  "district": "Haninge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1397,
   59.1687
  ],
  "lat": 59.1687,
  "lng": 18.1397,
  "priceBasis": "national"
 },
 {
  "slug": "sac4d0ec5",
  "name": "Hemköp Motala Luxor Center",
  "chain": "hemkop",
  "city": "Motala",
  "country": "SE",
  "district": "Motala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0174,
   58.5457
  ],
  "lat": 58.5457,
  "lng": 15.0174,
  "priceBasis": "national"
 },
 {
  "slug": "s4ae90a51",
  "name": "Hemköp Björklinge",
  "chain": "hemkop",
  "city": "Björklinge",
  "country": "SE",
  "district": "Björklinge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.552,
   60.0294
  ],
  "lat": 60.0294,
  "lng": 17.552,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9717,
   57.684
  ],
  "lat": 57.684,
  "lng": 11.9717,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.121,
   60.8829
  ],
  "lat": 60.8829,
  "lng": 15.121,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.4529,
   58.6994
  ],
  "lat": 58.6994,
  "lng": 12.4529,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.701,
   56.0571
  ],
  "lat": 56.0571,
  "lng": 12.701,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.3491,
   55.6644
  ],
  "lat": 55.6644,
  "lng": 13.3491,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.0261,
   55.6073
  ],
  "lat": 55.6073,
  "lng": 13.0261,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.9901,
   61.1795
  ],
  "lat": 61.1795,
  "lng": 12.9901,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0359,
   59.349
  ],
  "lat": 59.349,
  "lng": 18.0359,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9591,
   57.6931
  ],
  "lat": 57.6931,
  "lng": 11.9591,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.1632,
   57.7829
  ],
  "lat": 57.7829,
  "lng": 14.1632,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.9844,
   55.5986
  ],
  "lat": 55.5986,
  "lng": 12.9844,
  "priceBasis": "national"
 },
 {
  "slug": "s9ad6450f",
  "name": "Hemköp Herrljunga",
  "chain": "hemkop",
  "city": "Herrljunga",
  "country": "SE",
  "district": "Herrljunga",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.021,
   58.0776
  ],
  "lat": 58.0776,
  "lng": 13.021,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.5625,
   58.4089
  ],
  "lat": 58.4089,
  "lng": 15.5625,
  "priceBasis": "national"
 },
 {
  "slug": "s264fa56a",
  "name": "Hemköp Linköping Folkungavallen Östenssons",
  "chain": "hemkop",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.6321,
   58.4047
  ],
  "lat": 58.4047,
  "lng": 15.6321,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9813,
   59.2366
  ],
  "lat": 59.2366,
  "lng": 17.9813,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.9981,
   59.5136
  ],
  "lat": 59.5136,
  "lng": 15.9981,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   15.0367,
   58.5362
  ],
  "lat": 58.5362,
  "lng": 15.0367,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9716,
   59.2541
  ],
  "lat": 59.2541,
  "lng": 17.9716,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.0767,
   57.4865
  ],
  "lat": 57.4865,
  "lng": 12.0767,
  "priceBasis": "national"
 },
 {
  "slug": "s485fd863",
  "name": "Hemköp Lund Brunnshög",
  "chain": "hemkop",
  "city": "Lund",
  "country": "SE",
  "district": "Lund",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.2323,
   55.7188
  ],
  "lat": 55.7188,
  "lng": 13.2323,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9394,
   62.6317
  ],
  "lat": 62.6317,
  "lng": 17.9394,
  "priceBasis": "national"
 },
 {
  "slug": "s334f217e",
  "name": "Hemköp Storvreten",
  "chain": "hemkop",
  "city": "Tumba",
  "country": "SE",
  "district": "Tumba",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8364,
   59.1917
  ],
  "lat": 59.1917,
  "lng": 17.8364,
  "priceBasis": "national"
 },
 {
  "slug": "s705baf10",
  "name": "Hemköp Delsbo Edevägen",
  "chain": "hemkop",
  "city": "Delsbo",
  "country": "SE",
  "district": "Delsbo",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.5538,
   61.8007
  ],
  "lat": 61.8007,
  "lng": 16.5538,
  "priceBasis": "national"
 },
 {
  "slug": "s189b5adb",
  "name": "Hemköp Dala-järna",
  "chain": "hemkop",
  "city": "Dala-järna",
  "country": "SE",
  "district": "Dala-järna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.3665,
   60.5474
  ],
  "lat": 60.5474,
  "lng": 14.3665,
  "priceBasis": "national"
 },
 {
  "slug": "s45feacef",
  "name": "Hemköp Vadstena Starby Östenssons",
  "chain": "hemkop",
  "city": "Vadstena",
  "country": "SE",
  "district": "Vadstena",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   14.8812,
   58.4408
  ],
  "lat": 58.4408,
  "lng": 14.8812,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.0314,
   57.7521
  ],
  "lat": 57.7521,
  "lng": 12.0314,
  "priceBasis": "national"
 },
 {
  "slug": "s6663046a",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Vällingby",
  "country": "SE",
  "district": "Vällingby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8658,
   59.3836
  ],
  "lat": 59.3836,
  "lng": 17.8658,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0949,
   59.4305
  ],
  "lat": 59.4305,
  "lng": 18.0949,
  "priceBasis": "national"
 },
 {
  "slug": "sed61c9a7",
  "name": "Hemköp Eskilstuna City",
  "chain": "hemkop",
  "city": "Eskilstuna",
  "country": "SE",
  "district": "Eskilstuna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.5162,
   59.3706
  ],
  "lat": 59.3706,
  "lng": 16.5162,
  "priceBasis": "national"
 },
 {
  "slug": "s494ec82d",
  "name": "Hemköp Haninge Vega",
  "chain": "hemkop",
  "city": "Haninge",
  "country": "SE",
  "district": "Haninge",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.1446,
   59.1868
  ],
  "lat": 59.1868,
  "lng": 18.1446,
  "priceBasis": "national"
 },
 {
  "slug": "se3a2e30d",
  "name": "Hemköp Råcksta",
  "chain": "hemkop",
  "city": "Vällingby",
  "country": "SE",
  "district": "Vällingby",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.8837,
   59.3553
  ],
  "lat": 59.3553,
  "lng": 17.8837,
  "priceBasis": "national"
 },
 {
  "slug": "s6ee17433",
  "name": "Hemköp Särö C",
  "chain": "hemkop",
  "city": "Särö",
  "country": "SE",
  "district": "Särö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9659,
   57.5205
  ],
  "lat": 57.5205,
  "lng": 11.9659,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.0367,
   59.3985
  ],
  "lat": 59.3985,
  "lng": 18.0367,
  "priceBasis": "national"
 },
 {
  "slug": "s77c5dcaa",
  "name": "Hemköp",
  "chain": "hemkop",
  "city": "Hisings Backa",
  "country": "SE",
  "district": "Hisings Backa",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9818,
   57.7496
  ],
  "lat": 57.7496,
  "lng": 11.9818,
  "priceBasis": "national"
 },
 {
  "slug": "s732385ae",
  "name": "Hemköp Saltsjö-boo Lännersta",
  "chain": "hemkop",
  "city": "Saltsjö-boo",
  "country": "SE",
  "district": "Saltsjö-boo",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.2595,
   59.3145
  ],
  "lat": 59.3145,
  "lng": 18.2595,
  "priceBasis": "national"
 },
 {
  "slug": "s18696072",
  "name": "Hemköp Domsjö",
  "chain": "hemkop",
  "city": "Domsjö",
  "country": "SE",
  "district": "Domsjö",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.691,
   63.2672
  ],
  "lat": 63.2672,
  "lng": 18.691,
  "priceBasis": "national"
 },
 {
  "slug": "s2fc7d3b1",
  "name": "Hemköp Västerås Öster Mälarstrand",
  "chain": "hemkop",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.5708,
   59.6072
  ],
  "lat": 59.6072,
  "lng": 16.5708,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9349,
   57.6989
  ],
  "lat": 57.6989,
  "lng": 11.9349,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   12.8567,
   56.6748
  ],
  "lat": 56.6748,
  "lng": 12.8567,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.1793,
   58.5839
  ],
  "lat": 58.5839,
  "lng": 16.1793,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.54,
   59.6086
  ],
  "lat": 59.6086,
  "lng": 16.54,
  "priceBasis": "national"
 },
 {
  "slug": "se7ba92ad",
  "name": "Hemköp Gnesta Dansutvägen",
  "chain": "hemkop",
  "city": "Gnesta",
  "country": "SE",
  "district": "Gnesta",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.3265,
   59.0399
  ],
  "lat": 59.0399,
  "lng": 17.3265,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9915,
   57.6618
  ],
  "lat": 57.6618,
  "lng": 11.9915,
  "priceBasis": "national"
 },
 {
  "slug": "sda1fa2a9",
  "name": "Hemköp Uppsala Rosendal",
  "chain": "hemkop",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.6391,
   59.8392
  ],
  "lat": 59.8392,
  "lng": 17.6391,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   16.1783,
   58.5916
  ],
  "lat": 58.5916,
  "lng": 16.1783,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9025,
   59.206
  ],
  "lat": 59.206,
  "lng": 17.9025,
  "priceBasis": "national"
 },
 {
  "slug": "s2f215ce4",
  "name": "Hemköp Göteborg Lundby Park",
  "chain": "hemkop",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   11.9254,
   57.7189
  ],
  "lat": 57.7189,
  "lng": 11.9254,
  "priceBasis": "national"
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
  "percentile": 55,
  "openTill": "",
  "coords": [
   13.4977,
   59.3792
  ],
  "lat": 59.3792,
  "lng": 13.4977,
  "priceBasis": "national"
 },
 {
  "slug": "s944af120",
  "name": "Hemköp Sollentuna Sjöbergshallen",
  "chain": "hemkop",
  "city": "Sollentuna",
  "country": "SE",
  "district": "Sollentuna",
  "distance": 0,
  "basketCost": 1866,
  "basketDiff": 0,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.9992,
   59.4309
  ],
  "lat": 59.4309,
  "lng": 17.9992,
  "priceBasis": "national"
 },
 {
  "slug": "s8b0054a3",
  "name": "ICA Kvantum Rimbo",
  "chain": "ica",
  "city": "Rimbo",
  "country": "SE",
  "district": "Rimbo",
  "distance": 0,
  "basketCost": 1872,
  "basketDiff": 6,
  "percentile": 55,
  "openTill": "",
  "coords": [
   18.3781,
   59.7446
  ],
  "lat": 59.7446,
  "lng": 18.3781,
  "priceBasis": "per_store"
 },
 {
  "slug": "sebc5ece2",
  "name": "Coop Sundsvall",
  "chain": "coop",
  "city": "Sundsvall",
  "country": "SE",
  "district": "Sundsvall",
  "distance": 0,
  "basketCost": 1895,
  "basketDiff": 29,
  "percentile": 55,
  "openTill": "",
  "coords": [
   17.2653,
   62.4015
  ],
  "lat": 62.4015,
  "lng": 17.2653,
  "priceBasis": "regional"
 },
 {
  "slug": "sc055d7e5",
  "name": "ICA Supermarket Hovshaga",
  "chain": "ica",
  "city": "Växjö",
  "country": "SE",
  "district": "Växjö",
  "distance": 0,
  "basketCost": 1899,
  "basketDiff": 33,
  "percentile": 56,
  "openTill": "",
  "coords": [
   14.7973,
   56.9094
  ],
  "lat": 56.9094,
  "lng": 14.7973,
  "priceBasis": "per_store"
 },
 {
  "slug": "s5f3b3343",
  "name": "Willys Borlänge Kupolen",
  "chain": "willys",
  "city": "Borlänge",
  "country": "SE",
  "district": "Borlänge",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.4153,
   60.4862
  ],
  "lat": 60.4862,
  "lng": 15.4153,
  "priceBasis": "national"
 },
 {
  "slug": "s80807b6f",
  "name": "Willys Hemma Stockholm Torsplan",
  "chain": "willys",
  "city": "Stockholm",
  "country": "SE",
  "district": "Stockholm",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.0346,
   59.3495
  ],
  "lat": 59.3495,
  "lng": 18.0346,
  "priceBasis": "national"
 },
 {
  "slug": "s368796c8",
  "name": "Willys Gävle Gestrike",
  "chain": "willys",
  "city": "Gävle",
  "country": "SE",
  "district": "Gävle",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.1357,
   60.6824
  ],
  "lat": 60.6824,
  "lng": 17.1357,
  "priceBasis": "national"
 },
 {
  "slug": "s23931e69",
  "name": "Willys Göteborg Wieselgrensplatsen",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9374,
   57.7215
  ],
  "lat": 57.7215,
  "lng": 11.9374,
  "priceBasis": "national"
 },
 {
  "slug": "s578f3688",
  "name": "Willys",
  "chain": "willys",
  "city": "Sundbyberg",
  "country": "SE",
  "district": "Sundbyberg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9467,
   59.3798
  ],
  "lat": 59.3798,
  "lng": 17.9467,
  "priceBasis": "national"
 },
 {
  "slug": "sf7e546fe",
  "name": "Willys Göteborg Elisedal",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.0005,
   57.6824
  ],
  "lat": 57.6824,
  "lng": 12.0005,
  "priceBasis": "national"
 },
 {
  "slug": "se7bf91a0",
  "name": "Willys Göteborg Sisjön",
  "chain": "willys",
  "city": "Askim",
  "country": "SE",
  "district": "Askim",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9525,
   57.6401
  ],
  "lat": 57.6401,
  "lng": 11.9525,
  "priceBasis": "national"
 },
 {
  "slug": "s92fb9baa",
  "name": "Willys Hemma Göteborg Vårväderstorget",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.8926,
   57.7119
  ],
  "lat": 57.7119,
  "lng": 11.8926,
  "priceBasis": "national"
 },
 {
  "slug": "se38de588",
  "name": "Willys Hemma Göteborg Kaverös",
  "chain": "willys",
  "city": "Västra Frölunda",
  "country": "SE",
  "district": "Västra Frölunda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9205,
   57.6649
  ],
  "lat": 57.6649,
  "lng": 11.9205,
  "priceBasis": "national"
 },
 {
  "slug": "s90816da7",
  "name": "Willys Hemma Jönköping Torpa",
  "chain": "willys",
  "city": "Jönköping",
  "country": "SE",
  "district": "Jönköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.1521,
   57.7718
  ],
  "lat": 57.7718,
  "lng": 14.1521,
  "priceBasis": "national"
 },
 {
  "slug": "s882df330",
  "name": "Willys Stockholm Älvsjö",
  "chain": "willys",
  "city": "Älvsjö",
  "country": "SE",
  "district": "Älvsjö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.0132,
   59.2753
  ],
  "lat": 59.2753,
  "lng": 18.0132,
  "priceBasis": "national"
 },
 {
  "slug": "s826017d4",
  "name": "Willys",
  "chain": "willys",
  "city": "Mora",
  "country": "SE",
  "district": "Mora",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.5879,
   61.0089
  ],
  "lat": 61.0089,
  "lng": 14.5879,
  "priceBasis": "national"
 },
 {
  "slug": "s0ad1977a",
  "name": "Willys",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9474,
   57.6934
  ],
  "lat": 57.6934,
  "lng": 11.9474,
  "priceBasis": "national"
 },
 {
  "slug": "s2c5e0cc1",
  "name": "Willys Karlskrona Pantarholmen",
  "chain": "willys",
  "city": "Karlskrona",
  "country": "SE",
  "district": "Karlskrona",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.5881,
   56.1737
  ],
  "lat": 56.1737,
  "lng": 15.5881,
  "priceBasis": "national"
 },
 {
  "slug": "s607bb07f",
  "name": "Willys",
  "chain": "willys",
  "city": "Täby",
  "country": "SE",
  "district": "Täby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.133,
   59.4642
  ],
  "lat": 59.4642,
  "lng": 18.133,
  "priceBasis": "national"
 },
 {
  "slug": "sce2904c6",
  "name": "Willys Hemma Göteborg Påvelund",
  "chain": "willys",
  "city": "Västra Frölunda",
  "country": "SE",
  "district": "Västra Frölunda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.8745,
   57.6647
  ],
  "lat": 57.6647,
  "lng": 11.8745,
  "priceBasis": "national"
 },
 {
  "slug": "s9a75eea9",
  "name": "Willys",
  "chain": "willys",
  "city": "Borlänge",
  "country": "SE",
  "district": "Borlänge",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.4755,
   60.4626
  ],
  "lat": 60.4626,
  "lng": 15.4755,
  "priceBasis": "national"
 },
 {
  "slug": "s5de762a4",
  "name": "Willys Stockholm Mariahallen",
  "chain": "willys",
  "city": "Stockholm",
  "country": "SE",
  "district": "Stockholm",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.0573,
   59.3184
  ],
  "lat": 59.3184,
  "lng": 18.0573,
  "priceBasis": "national"
 },
 {
  "slug": "s86a93258",
  "name": "Willys Hemma Tuve",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9274,
   57.7554
  ],
  "lat": 57.7554,
  "lng": 11.9274,
  "priceBasis": "national"
 },
 {
  "slug": "sfdd77734",
  "name": "Willy:s Kristianstad 2108",
  "chain": "willys",
  "city": "Kristianstad",
  "country": "SE",
  "district": "Kristianstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.1409,
   56.0238
  ],
  "lat": 56.0238,
  "lng": 14.1409,
  "priceBasis": "national"
 },
 {
  "slug": "s5b613d26",
  "name": "Willys Malmö Katrinelund",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0335,
   55.5995
  ],
  "lat": 55.5995,
  "lng": 13.0335,
  "priceBasis": "national"
 },
 {
  "slug": "s43c29028",
  "name": "Willys Hemma",
  "chain": "willys",
  "city": "Örebro",
  "country": "SE",
  "district": "Örebro",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.2165,
   59.2714
  ],
  "lat": 59.2714,
  "lng": 15.2165,
  "priceBasis": "national"
 },
 {
  "slug": "sb844cf15",
  "name": "Willys Uppsala Gränby",
  "chain": "willys",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.6608,
   59.8861
  ],
  "lat": 59.8861,
  "lng": 17.6608,
  "priceBasis": "national"
 },
 {
  "slug": "s75986765",
  "name": "Willys Hemma Utlandagatan",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9901,
   57.6898
  ],
  "lat": 57.6898,
  "lng": 11.9901,
  "priceBasis": "national"
 },
 {
  "slug": "sbad1b087",
  "name": "Willys Växjö Teleborg",
  "chain": "willys",
  "city": "Växjö",
  "country": "SE",
  "district": "Växjö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.8193,
   56.86
  ],
  "lat": 56.86,
  "lng": 14.8193,
  "priceBasis": "national"
 },
 {
  "slug": "s1f3a5236",
  "name": "Willys Norrtälje",
  "chain": "willys",
  "city": "Norrtälje",
  "country": "SE",
  "district": "Norrtälje",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.6937,
   59.7668
  ],
  "lat": 59.7668,
  "lng": 18.6937,
  "priceBasis": "national"
 },
 {
  "slug": "s15f11eca",
  "name": "Willys Karlstad",
  "chain": "willys",
  "city": "Karlstad",
  "country": "SE",
  "district": "Karlstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.4818,
   59.3877
  ],
  "lat": 59.3877,
  "lng": 13.4818,
  "priceBasis": "national"
 },
 {
  "slug": "s0ef3e85c",
  "name": "Willys Hemma Malmö Möllevången",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0081,
   55.5897
  ],
  "lat": 55.5897,
  "lng": 13.0081,
  "priceBasis": "national"
 },
 {
  "slug": "s125d034c",
  "name": "Willys Hemma Lindesberg",
  "chain": "willys",
  "city": "Lindesberg",
  "country": "SE",
  "district": "Lindesberg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.2242,
   59.5945
  ],
  "lat": 59.5945,
  "lng": 15.2242,
  "priceBasis": "national"
 },
 {
  "slug": "s850bce60",
  "name": "Willys Södertälje Weda",
  "chain": "willys",
  "city": "Södertälje",
  "country": "SE",
  "district": "Södertälje",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.6443,
   59.2054
  ],
  "lat": 59.2054,
  "lng": 17.6443,
  "priceBasis": "national"
 },
 {
  "slug": "s957d5337",
  "name": "Willys Motala",
  "chain": "willys",
  "city": "Motala",
  "country": "SE",
  "district": "Motala",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.0336,
   58.5565
  ],
  "lat": 58.5565,
  "lng": 15.0336,
  "priceBasis": "national"
 },
 {
  "slug": "s549f63a3",
  "name": "Willys Örnsköldsvik",
  "chain": "willys",
  "city": "Örnsköldsvik",
  "country": "SE",
  "district": "Örnsköldsvik",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.7433,
   63.305
  ],
  "lat": 63.305,
  "lng": 18.7433,
  "priceBasis": "national"
 },
 {
  "slug": "s60c1315e",
  "name": "Willys Borås Knalleland",
  "chain": "willys",
  "city": "Borås",
  "country": "SE",
  "district": "Borås",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.934,
   57.7318
  ],
  "lat": 57.7318,
  "lng": 12.934,
  "priceBasis": "national"
 },
 {
  "slug": "s4315cf6e",
  "name": "Willys Göteborg Hvitfeldtsplatsen",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9609,
   57.7014
  ],
  "lat": 57.7014,
  "lng": 11.9609,
  "priceBasis": "national"
 },
 {
  "slug": "s00120267",
  "name": "Willys",
  "chain": "willys",
  "city": "Uddevalla",
  "country": "SE",
  "district": "Uddevalla",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9328,
   58.3508
  ],
  "lat": 58.3508,
  "lng": 11.9328,
  "priceBasis": "national"
 },
 {
  "slug": "s0b6a81bd",
  "name": "Willys Hemma Helsingborg",
  "chain": "willys",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.7268,
   56.0501
  ],
  "lat": 56.0501,
  "lng": 12.7268,
  "priceBasis": "national"
 },
 {
  "slug": "sa3fa8027",
  "name": "Willys",
  "chain": "willys",
  "city": "Strängnäs",
  "country": "SE",
  "district": "Strängnäs",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.0203,
   59.335
  ],
  "lat": 59.335,
  "lng": 17.0203,
  "priceBasis": "national"
 },
 {
  "slug": "sf7bb0806",
  "name": "Willys Hemma Solna Hagahallen",
  "chain": "willys",
  "city": "Solna",
  "country": "SE",
  "district": "Solna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.011,
   59.3629
  ],
  "lat": 59.3629,
  "lng": 18.011,
  "priceBasis": "national"
 },
 {
  "slug": "sf23d7fb7",
  "name": "Willys Umeå Ersboda",
  "chain": "willys",
  "city": "Umeå",
  "country": "SE",
  "district": "Umeå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   20.3004,
   63.8543
  ],
  "lat": 63.8543,
  "lng": 20.3004,
  "priceBasis": "national"
 },
 {
  "slug": "sf014ded2",
  "name": "Willys",
  "chain": "willys",
  "city": "Arboga",
  "country": "SE",
  "district": "Arboga",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.8407,
   59.3956
  ],
  "lat": 59.3956,
  "lng": 15.8407,
  "priceBasis": "national"
 },
 {
  "slug": "s24f2ef00",
  "name": "Willys Hemma",
  "chain": "willys",
  "city": "Sävedalen",
  "country": "SE",
  "district": "Sävedalen",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.0769,
   57.7333
  ],
  "lat": 57.7333,
  "lng": 12.0769,
  "priceBasis": "national"
 },
 {
  "slug": "s2e4d8142",
  "name": "Willys Mjölby Centrum",
  "chain": "willys",
  "city": "Mjölby",
  "country": "SE",
  "district": "Mjölby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.1249,
   58.3264
  ],
  "lat": 58.3264,
  "lng": 15.1249,
  "priceBasis": "national"
 },
 {
  "slug": "s085749d9",
  "name": "Willys Nyköping",
  "chain": "willys",
  "city": "Nyköping",
  "country": "SE",
  "district": "Nyköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.973,
   58.7474
  ],
  "lat": 58.7474,
  "lng": 16.973,
  "priceBasis": "national"
 },
 {
  "slug": "sd8f52ec4",
  "name": "Willys Luleå Storheden",
  "chain": "willys",
  "city": "Luleå",
  "country": "SE",
  "district": "Luleå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   22.0533,
   65.6205
  ],
  "lat": 65.6205,
  "lng": 22.0533,
  "priceBasis": "national"
 },
 {
  "slug": "s2b417555",
  "name": "Willy's Hemma",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9758,
   57.701
  ],
  "lat": 57.701,
  "lng": 11.9758,
  "priceBasis": "national"
 },
 {
  "slug": "s640d6ce6",
  "name": "Willys Luleå Hamn",
  "chain": "willys",
  "city": "Luleå",
  "country": "SE",
  "district": "Luleå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   22.1616,
   65.5812
  ],
  "lat": 65.5812,
  "lng": 22.1616,
  "priceBasis": "national"
 },
 {
  "slug": "scf85c01d",
  "name": "Willys",
  "chain": "willys",
  "city": "Partille",
  "country": "SE",
  "district": "Partille",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.1064,
   57.7399
  ],
  "lat": 57.7399,
  "lng": 12.1064,
  "priceBasis": "national"
 },
 {
  "slug": "s05d3d9ee",
  "name": "Willys Stockholm Port 73",
  "chain": "willys",
  "city": "Haninge",
  "country": "SE",
  "district": "Haninge",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.1475,
   59.1788
  ],
  "lat": 59.1788,
  "lng": 18.1475,
  "priceBasis": "national"
 },
 {
  "slug": "sfab7564f",
  "name": "Willys Karlskoga C",
  "chain": "willys",
  "city": "Karlskoga",
  "country": "SE",
  "district": "Karlskoga",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.525,
   59.326
  ],
  "lat": 59.326,
  "lng": 14.525,
  "priceBasis": "national"
 },
 {
  "slug": "s931f02d3",
  "name": "Willys Norrköping Ingelsta",
  "chain": "willys",
  "city": "Norrköping",
  "country": "SE",
  "district": "Norrköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.164,
   58.6122
  ],
  "lat": 58.6122,
  "lng": 16.164,
  "priceBasis": "national"
 },
 {
  "slug": "se04092d8",
  "name": "Willys Hemma Timrå",
  "chain": "willys",
  "city": "Timrå",
  "country": "SE",
  "district": "Timrå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.3255,
   62.4875
  ],
  "lat": 62.4875,
  "lng": 17.3255,
  "priceBasis": "national"
 },
 {
  "slug": "s1a5f9a85",
  "name": "Willys Landvetter",
  "chain": "willys",
  "city": "Landvetter",
  "country": "SE",
  "district": "Landvetter",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.2101,
   57.6871
  ],
  "lat": 57.6871,
  "lng": 12.2101,
  "priceBasis": "national"
 },
 {
  "slug": "sb5e2e8f8",
  "name": "Willys Hemma Lomma Centrum",
  "chain": "willys",
  "city": "Lomma",
  "country": "SE",
  "district": "Lomma",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0701,
   55.6735
  ],
  "lat": 55.6735,
  "lng": 13.0701,
  "priceBasis": "national"
 },
 {
  "slug": "se2702057",
  "name": "Willys Hemma Göteborg Sten Sturegatan",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9842,
   57.7009
  ],
  "lat": 57.7009,
  "lng": 11.9842,
  "priceBasis": "national"
 },
 {
  "slug": "s8207c890",
  "name": "Willys Råslätt",
  "chain": "willys",
  "city": "Jönköping",
  "country": "SE",
  "district": "Jönköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.1516,
   57.7395
  ],
  "lat": 57.7395,
  "lng": 14.1516,
  "priceBasis": "national"
 },
 {
  "slug": "s606d0ea3",
  "name": "Willys Märsta C",
  "chain": "willys",
  "city": "Märsta",
  "country": "SE",
  "district": "Märsta",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.8548,
   59.6208
  ],
  "lat": 59.6208,
  "lng": 17.8548,
  "priceBasis": "national"
 },
 {
  "slug": "sffa8a7ab",
  "name": "Willys",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0053,
   55.5825
  ],
  "lat": 55.5825,
  "lng": 13.0053,
  "priceBasis": "national"
 },
 {
  "slug": "s3fa3937c",
  "name": "WiLLY:S",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.9728,
   55.5645
  ],
  "lat": 55.5645,
  "lng": 12.9728,
  "priceBasis": "national"
 },
 {
  "slug": "se2cd6329",
  "name": "Willys Stenungsund Strandvägen",
  "chain": "willys",
  "city": "Stenungsund",
  "country": "SE",
  "district": "Stenungsund",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.8212,
   58.0746
  ],
  "lat": 58.0746,
  "lng": 11.8212,
  "priceBasis": "national"
 },
 {
  "slug": "s384c9117",
  "name": "Willys Kramfors",
  "chain": "willys",
  "city": "Kramfors",
  "country": "SE",
  "district": "Kramfors",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.7791,
   62.9309
  ],
  "lat": 62.9309,
  "lng": 17.7791,
  "priceBasis": "national"
 },
 {
  "slug": "s5dd7f0ec",
  "name": "Willys Göteborg Gamlestaden",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.0089,
   57.7433
  ],
  "lat": 57.7433,
  "lng": 12.0089,
  "priceBasis": "national"
 },
 {
  "slug": "sd42d9302",
  "name": "Willys Västerås Hälla",
  "chain": "willys",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.6194,
   59.6081
  ],
  "lat": 59.6081,
  "lng": 16.6194,
  "priceBasis": "national"
 },
 {
  "slug": "seae134cf",
  "name": "Willys Härnösand Härnön",
  "chain": "willys",
  "city": "Härnösand",
  "country": "SE",
  "district": "Härnösand",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9585,
   62.6279
  ],
  "lat": 62.6279,
  "lng": 17.9585,
  "priceBasis": "national"
 },
 {
  "slug": "s197a1990",
  "name": "Willys Eslöv",
  "chain": "willys",
  "city": "Eslöv",
  "country": "SE",
  "district": "Eslöv",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.3233,
   55.8418
  ],
  "lat": 55.8418,
  "lng": 13.3233,
  "priceBasis": "national"
 },
 {
  "slug": "sb81422f3",
  "name": "Willys Båstad",
  "chain": "willys",
  "city": "Båstad",
  "country": "SE",
  "district": "Båstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.8865,
   56.4263
  ],
  "lat": 56.4263,
  "lng": 12.8865,
  "priceBasis": "national"
 },
 {
  "slug": "s0cdee85f",
  "name": "Willys Avesta",
  "chain": "willys",
  "city": "Avesta",
  "country": "SE",
  "district": "Avesta",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.1975,
   60.1528
  ],
  "lat": 60.1528,
  "lng": 16.1975,
  "priceBasis": "national"
 },
 {
  "slug": "scff1ab76",
  "name": "Willys Eskilstuna Folkesta",
  "chain": "willys",
  "city": "Eskilstuna",
  "country": "SE",
  "district": "Eskilstuna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.4255,
   59.4026
  ],
  "lat": 59.4026,
  "lng": 16.4255,
  "priceBasis": "national"
 },
 {
  "slug": "s988217a3",
  "name": "Willy:s",
  "chain": "willys",
  "city": "Älmhult",
  "country": "SE",
  "district": "Älmhult",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.1603,
   56.5526
  ],
  "lat": 56.5526,
  "lng": 14.1603,
  "priceBasis": "national"
 },
 {
  "slug": "sf9698a17",
  "name": "Willys",
  "chain": "willys",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.5645,
   59.8493
  ],
  "lat": 59.8493,
  "lng": 17.5645,
  "priceBasis": "national"
 },
 {
  "slug": "sea447480",
  "name": "Willys Linköping Skäggetorp",
  "chain": "willys",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.5799,
   58.4266
  ],
  "lat": 58.4266,
  "lng": 15.5799,
  "priceBasis": "national"
 },
 {
  "slug": "sf7e308ae",
  "name": "Willys Hemma Kil",
  "chain": "willys",
  "city": "Kil",
  "country": "SE",
  "district": "Kil",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.3173,
   59.4999
  ],
  "lat": 59.4999,
  "lng": 13.3173,
  "priceBasis": "national"
 },
 {
  "slug": "s87214d76",
  "name": "Willys Karlshamn",
  "chain": "willys",
  "city": "Karlshamn",
  "country": "SE",
  "district": "Karlshamn",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.8641,
   56.1704
  ],
  "lat": 56.1704,
  "lng": 14.8641,
  "priceBasis": "national"
 },
 {
  "slug": "s6f800fba",
  "name": "Willys Åtvidaberg C",
  "chain": "willys",
  "city": "Åtvidaberg",
  "country": "SE",
  "district": "Åtvidaberg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.9995,
   58.2018
  ],
  "lat": 58.2018,
  "lng": 15.9995,
  "priceBasis": "national"
 },
 {
  "slug": "sb443ba21",
  "name": "Willys Visby",
  "chain": "willys",
  "city": "Visby",
  "country": "SE",
  "district": "Visby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.3275,
   57.6352
  ],
  "lat": 57.6352,
  "lng": 18.3275,
  "priceBasis": "national"
 },
 {
  "slug": "s7560fe15",
  "name": "Willys Johanneberg",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9859,
   57.6874
  ],
  "lat": 57.6874,
  "lng": 11.9859,
  "priceBasis": "national"
 },
 {
  "slug": "s43269a0b",
  "name": "Willys Sollentuna Rotebro",
  "chain": "willys",
  "city": "Sollentuna",
  "country": "SE",
  "district": "Sollentuna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.916,
   59.4711
  ],
  "lat": 59.4711,
  "lng": 17.916,
  "priceBasis": "national"
 },
 {
  "slug": "s86effee9",
  "name": "Willys Hemma Stockholm Nacka",
  "chain": "willys",
  "city": "Nacka",
  "country": "SE",
  "district": "Nacka",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.1653,
   59.3089
  ],
  "lat": 59.3089,
  "lng": 18.1653,
  "priceBasis": "national"
 },
 {
  "slug": "s43b973d9",
  "name": "Willys Hultsfred Knekten",
  "chain": "willys",
  "city": "Hultsfred",
  "country": "SE",
  "district": "Hultsfred",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.8261,
   57.4997
  ],
  "lat": 57.4997,
  "lng": 15.8261,
  "priceBasis": "national"
 },
 {
  "slug": "s38226c86",
  "name": "Willys Landskrona Infarten",
  "chain": "willys",
  "city": "Landskrona",
  "country": "SE",
  "district": "Landskrona",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.8484,
   55.8708
  ],
  "lat": 55.8708,
  "lng": 12.8484,
  "priceBasis": "national"
 },
 {
  "slug": "s5796586d",
  "name": "Willys",
  "chain": "willys",
  "city": "Helsingborg",
  "country": "SE",
  "district": "Helsingborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.7499,
   56.0919
  ],
  "lat": 56.0919,
  "lng": 12.7499,
  "priceBasis": "national"
 },
 {
  "slug": "s80adae43",
  "name": "Willys Skene C",
  "chain": "willys",
  "city": "Skene",
  "country": "SE",
  "district": "Skene",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.6482,
   57.4858
  ],
  "lat": 57.4858,
  "lng": 12.6482,
  "priceBasis": "national"
 },
 {
  "slug": "s8d5f9117",
  "name": "Willys Karlstad Bryggudden",
  "chain": "willys",
  "city": "Karlstad",
  "country": "SE",
  "district": "Karlstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.5082,
   59.3774
  ],
  "lat": 59.3774,
  "lng": 13.5082,
  "priceBasis": "national"
 },
 {
  "slug": "scd561099",
  "name": "Willys Kållered Eken",
  "chain": "willys",
  "city": "Kållered",
  "country": "SE",
  "district": "Kållered",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.0482,
   57.6009
  ],
  "lat": 57.6009,
  "lng": 12.0482,
  "priceBasis": "national"
 },
 {
  "slug": "sceab867a",
  "name": "Willys Torslanda",
  "chain": "willys",
  "city": "Torslanda",
  "country": "SE",
  "district": "Torslanda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.7789,
   57.7088
  ],
  "lat": 57.7088,
  "lng": 11.7789,
  "priceBasis": "national"
 },
 {
  "slug": "s3adc0031",
  "name": "Willys",
  "chain": "willys",
  "city": "Sollentuna",
  "country": "SE",
  "district": "Sollentuna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9282,
   59.4373
  ],
  "lat": 59.4373,
  "lng": 17.9282,
  "priceBasis": "national"
 },
 {
  "slug": "se4d51228",
  "name": "Willys Västerås Erikslund",
  "chain": "willys",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.4645,
   59.6093
  ],
  "lat": 59.6093,
  "lng": 16.4645,
  "priceBasis": "national"
 },
 {
  "slug": "sf978ea39",
  "name": "Willys",
  "chain": "willys",
  "city": "Linköping",
  "country": "SE",
  "district": "Linköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.5897,
   58.4342
  ],
  "lat": 58.4342,
  "lng": 15.5897,
  "priceBasis": "national"
 },
 {
  "slug": "s8f77a1c7",
  "name": "Willys Älvängen Handelsplats",
  "chain": "willys",
  "city": "Älvängen",
  "country": "SE",
  "district": "Älvängen",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.1297,
   57.9628
  ],
  "lat": 57.9628,
  "lng": 12.1297,
  "priceBasis": "national"
 },
 {
  "slug": "sb0944e81",
  "name": "Willys",
  "chain": "willys",
  "city": "Tranås",
  "country": "SE",
  "district": "Tranås",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.9736,
   58.0363
  ],
  "lat": 58.0363,
  "lng": 14.9736,
  "priceBasis": "national"
 },
 {
  "slug": "sb4bce5f4",
  "name": "Willy:s Hemma Kristianstad 2819",
  "chain": "willys",
  "city": "Kristianstad",
  "country": "SE",
  "district": "Kristianstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.1592,
   56.0353
  ],
  "lat": 56.0353,
  "lng": 14.1592,
  "priceBasis": "national"
 },
 {
  "slug": "s2c652f57",
  "name": "Willys Hemma Göteborg Första Långg",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.9486,
   57.6996
  ],
  "lat": 57.6996,
  "lng": 11.9486,
  "priceBasis": "national"
 },
 {
  "slug": "s3315ae40",
  "name": "Willys Huddinge Flemingsberg",
  "chain": "willys",
  "city": "Huddinge",
  "country": "SE",
  "district": "Huddinge",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9393,
   59.223
  ],
  "lat": 59.223,
  "lng": 17.9393,
  "priceBasis": "national"
 },
 {
  "slug": "s958d32ea",
  "name": "Willys Hemma Malmö Lindängen",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0149,
   55.5589
  ],
  "lat": 55.5589,
  "lng": 13.0149,
  "priceBasis": "national"
 },
 {
  "slug": "sd77d3d2d",
  "name": "Willys Hemma Malmö Söderkulla",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0089,
   55.5704
  ],
  "lat": 55.5704,
  "lng": 13.0089,
  "priceBasis": "national"
 },
 {
  "slug": "s6a10e0ce",
  "name": "Willy:s Åhus Rondellen 2286",
  "chain": "willys",
  "city": "Åhus",
  "country": "SE",
  "district": "Åhus",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.2885,
   55.9305
  ],
  "lat": 55.9305,
  "lng": 14.2885,
  "priceBasis": "national"
 },
 {
  "slug": "s1720ddac",
  "name": "Willys Umeå Klockarbäcken",
  "chain": "willys",
  "city": "Umeå",
  "country": "SE",
  "district": "Umeå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   20.1515,
   63.8479
  ],
  "lat": 63.8479,
  "lng": 20.1515,
  "priceBasis": "national"
 },
 {
  "slug": "sc6fc53f5",
  "name": "Willys Täby Centrum",
  "chain": "willys",
  "city": "Täby",
  "country": "SE",
  "district": "Täby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.0737,
   59.4455
  ],
  "lat": 59.4455,
  "lng": 18.0737,
  "priceBasis": "national"
 },
 {
  "slug": "s7aa8f3ed",
  "name": "Willys Trelleborg Väst",
  "chain": "willys",
  "city": "Trelleborg",
  "country": "SE",
  "district": "Trelleborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.1349,
   55.3837
  ],
  "lat": 55.3837,
  "lng": 13.1349,
  "priceBasis": "national"
 },
 {
  "slug": "s1969b105",
  "name": "Willys Sölvesborg Kämpaslätten",
  "chain": "willys",
  "city": "Sölvesborg",
  "country": "SE",
  "district": "Sölvesborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.5645,
   56.0603
  ],
  "lat": 56.0603,
  "lng": 14.5645,
  "priceBasis": "national"
 },
 {
  "slug": "saf4f97cc",
  "name": "Willys Södertälje Vasa",
  "chain": "willys",
  "city": "Södertälje",
  "country": "SE",
  "district": "Södertälje",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.5832,
   59.1863
  ],
  "lat": 59.1863,
  "lng": 17.5832,
  "priceBasis": "national"
 },
 {
  "slug": "s7de020c6",
  "name": "Willys Strömstad Shoppingcenter",
  "chain": "willys",
  "city": "Strömstad",
  "country": "SE",
  "district": "Strömstad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.1889,
   58.9464
  ],
  "lat": 58.9464,
  "lng": 11.1889,
  "priceBasis": "national"
 },
 {
  "slug": "s026eb7d7",
  "name": "Willys Nässjö Almenäs",
  "chain": "willys",
  "city": "Nässjö",
  "country": "SE",
  "district": "Nässjö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.6955,
   57.6463
  ],
  "lat": 57.6463,
  "lng": 14.6955,
  "priceBasis": "national"
 },
 {
  "slug": "sf96cd727",
  "name": "Willys Kalmar Hansa City",
  "chain": "willys",
  "city": "Kalmar",
  "country": "SE",
  "district": "Kalmar",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.3157,
   56.6869
  ],
  "lat": 56.6869,
  "lng": 16.3157,
  "priceBasis": "national"
 },
 {
  "slug": "sa7349a72",
  "name": "Willys Huskvarna",
  "chain": "willys",
  "city": "Huskvarna",
  "country": "SE",
  "district": "Huskvarna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.2759,
   57.7909
  ],
  "lat": 57.7909,
  "lng": 14.2759,
  "priceBasis": "national"
 },
 {
  "slug": "s8586ca0a",
  "name": "Willys Fagersta Norrbyplan",
  "chain": "willys",
  "city": "Fagersta",
  "country": "SE",
  "district": "Fagersta",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.8106,
   59.9952
  ],
  "lat": 59.9952,
  "lng": 15.8106,
  "priceBasis": "national"
 },
 {
  "slug": "s927b8a72",
  "name": "Willys Botkyrka Handel",
  "chain": "willys",
  "city": "Norsborg",
  "country": "SE",
  "district": "Norsborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.8654,
   59.2532
  ],
  "lat": 59.2532,
  "lng": 17.8654,
  "priceBasis": "national"
 },
 {
  "slug": "sd0e3d571",
  "name": "Willys",
  "chain": "willys",
  "city": "Ljungby",
  "country": "SE",
  "district": "Ljungby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.9332,
   56.832
  ],
  "lat": 56.832,
  "lng": 13.9332,
  "priceBasis": "national"
 },
 {
  "slug": "sb2fca6a9",
  "name": "Willy:s Hemma",
  "chain": "willys",
  "city": "Umeå",
  "country": "SE",
  "district": "Umeå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   20.2637,
   63.8268
  ],
  "lat": 63.8268,
  "lng": 20.2637,
  "priceBasis": "national"
 },
 {
  "slug": "sb2a5568d",
  "name": "Willys",
  "chain": "willys",
  "city": "Järfälla",
  "country": "SE",
  "district": "Järfälla",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.8422,
   59.4087
  ],
  "lat": 59.4087,
  "lng": 17.8422,
  "priceBasis": "national"
 },
 {
  "slug": "sa925f4ec",
  "name": "Willys Nynäshamn Sandtorp",
  "chain": "willys",
  "city": "Nynäshamn",
  "country": "SE",
  "district": "Nynäshamn",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9412,
   58.9168
  ],
  "lat": 58.9168,
  "lng": 17.9412,
  "priceBasis": "national"
 },
 {
  "slug": "s2ec20952",
  "name": "Willys Hemma Enköping Centrum",
  "chain": "willys",
  "city": "Enköping",
  "country": "SE",
  "district": "Enköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.0766,
   59.6365
  ],
  "lat": 59.6365,
  "lng": 17.0766,
  "priceBasis": "national"
 },
 {
  "slug": "scef3403c",
  "name": "Willys",
  "chain": "willys",
  "city": "Vällingby",
  "country": "SE",
  "district": "Vällingby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.8757,
   59.3605
  ],
  "lat": 59.3605,
  "lng": 17.8757,
  "priceBasis": "national"
 },
 {
  "slug": "s4c5ad1a9",
  "name": "Willys Hemma Sollentuna Tureberg",
  "chain": "willys",
  "city": "Sollentuna",
  "country": "SE",
  "district": "Sollentuna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9473,
   59.4248
  ],
  "lat": 59.4248,
  "lng": 17.9473,
  "priceBasis": "national"
 },
 {
  "slug": "s3d1ee66b",
  "name": "Willys Västerås Stenby",
  "chain": "willys",
  "city": "Västerås",
  "country": "SE",
  "district": "Västerås",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.567,
   59.6367
  ],
  "lat": 59.6367,
  "lng": 16.567,
  "priceBasis": "national"
 },
 {
  "slug": "s2dfcd447",
  "name": "Willys",
  "chain": "willys",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0462,
   55.5864
  ],
  "lat": 55.5864,
  "lng": 13.0462,
  "priceBasis": "national"
 },
 {
  "slug": "s3b069b88",
  "name": "Willys Lund Nova",
  "chain": "willys",
  "city": "Lund",
  "country": "SE",
  "district": "Lund",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.1602,
   55.7147
  ],
  "lat": 55.7147,
  "lng": 13.1602,
  "priceBasis": "national"
 },
 {
  "slug": "s0fbb5689",
  "name": "Willys Stockholm Bromma",
  "chain": "willys",
  "city": "Bromma",
  "country": "SE",
  "district": "Bromma",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.9505,
   59.357
  ],
  "lat": 59.357,
  "lng": 17.9505,
  "priceBasis": "national"
 },
 {
  "slug": "sc8f53bb2",
  "name": "Willy:s",
  "chain": "willys",
  "city": "Limhamn",
  "country": "SE",
  "district": "Limhamn",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.934,
   55.5822
  ],
  "lat": 55.5822,
  "lng": 12.934,
  "priceBasis": "national"
 },
 {
  "slug": "s74375363",
  "name": "Willys Staffanstorp",
  "chain": "willys",
  "city": "Staffanstorp",
  "country": "SE",
  "district": "Staffanstorp",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.2322,
   55.6448
  ],
  "lat": 55.6448,
  "lng": 13.2322,
  "priceBasis": "national"
 },
 {
  "slug": "s3d4b1c17",
  "name": "Willys",
  "chain": "willys",
  "city": "Skellefteå",
  "country": "SE",
  "district": "Skellefteå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   21.0222,
   64.7666
  ],
  "lat": 64.7666,
  "lng": 21.0222,
  "priceBasis": "national"
 },
 {
  "slug": "s7d9620d7",
  "name": "Willys",
  "chain": "willys",
  "city": "Lund",
  "country": "SE",
  "district": "Lund",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.221,
   55.72
  ],
  "lat": 55.72,
  "lng": 13.221,
  "priceBasis": "national"
 },
 {
  "slug": "s940ebc83",
  "name": "Willys",
  "chain": "willys",
  "city": "Östersund",
  "country": "SE",
  "district": "Östersund",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.6542,
   63.1632
  ],
  "lat": 63.1632,
  "lng": 14.6542,
  "priceBasis": "national"
 },
 {
  "slug": "se0127021",
  "name": "Willys Svalan",
  "chain": "willys",
  "city": "Falun",
  "country": "SE",
  "district": "Falun",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.6208,
   60.62
  ],
  "lat": 60.62,
  "lng": 15.6208,
  "priceBasis": "national"
 },
 {
  "slug": "s9d6bd8ad",
  "name": "Willys",
  "chain": "willys",
  "city": "Lidingö",
  "country": "SE",
  "district": "Lidingö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.1525,
   59.3485
  ],
  "lat": 59.3485,
  "lng": 18.1525,
  "priceBasis": "national"
 },
 {
  "slug": "s8fde1866",
  "name": "Willys Örebro Marieberg",
  "chain": "willys",
  "city": "Örebro",
  "country": "SE",
  "district": "Örebro",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.1345,
   59.2099
  ],
  "lat": 59.2099,
  "lng": 15.1345,
  "priceBasis": "national"
 },
 {
  "slug": "s55d4b30f",
  "name": "Willy's Hemma",
  "chain": "willys",
  "city": "Täby",
  "country": "SE",
  "district": "Täby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.0496,
   59.4528
  ],
  "lat": 59.4528,
  "lng": 18.0496,
  "priceBasis": "national"
 },
 {
  "slug": "sa6bc1341",
  "name": "Willys Eskilstuna Smeden",
  "chain": "willys",
  "city": "Eskilstuna",
  "country": "SE",
  "district": "Eskilstuna",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.5298,
   59.3751
  ],
  "lat": 59.3751,
  "lng": 16.5298,
  "priceBasis": "national"
 },
 {
  "slug": "s09f35d54",
  "name": "Willys Hemma",
  "chain": "willys",
  "city": "Torslanda",
  "country": "SE",
  "district": "Torslanda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.7699,
   57.7307
  ],
  "lat": 57.7307,
  "lng": 11.7699,
  "priceBasis": "national"
 },
 {
  "slug": "s01f13e18",
  "name": "Willy:s",
  "chain": "willys",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.6581,
   59.85
  ],
  "lat": 59.85,
  "lng": 17.6581,
  "priceBasis": "national"
 },
 {
  "slug": "s245c907c",
  "name": "Willys Hemma",
  "chain": "willys",
  "city": "Göteborg",
  "country": "SE",
  "district": "Göteborg",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.0375,
   57.7146
  ],
  "lat": 57.7146,
  "lng": 12.0375,
  "priceBasis": "national"
 },
 {
  "slug": "sdfba8ead",
  "name": "Willys Vetlanda",
  "chain": "willys",
  "city": "Vetlanda",
  "country": "SE",
  "district": "Vetlanda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.0893,
   57.4258
  ],
  "lat": 57.4258,
  "lng": 15.0893,
  "priceBasis": "national"
 },
 {
  "slug": "s60523313",
  "name": "Willys",
  "chain": "willys",
  "city": "Gnosjö",
  "country": "SE",
  "district": "Gnosjö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.7422,
   57.3539
  ],
  "lat": 57.3539,
  "lng": 13.7422,
  "priceBasis": "national"
 },
 {
  "slug": "sc43c447d",
  "name": "Willys",
  "chain": "willys",
  "city": "Vårgårda",
  "country": "SE",
  "district": "Vårgårda",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.8051,
   58.0319
  ],
  "lat": 58.0319,
  "lng": 12.8051,
  "priceBasis": "national"
 },
 {
  "slug": "s08c37503",
  "name": "Willys",
  "chain": "willys",
  "city": "Gislaved",
  "country": "SE",
  "district": "Gislaved",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.5431,
   57.321
  ],
  "lat": 57.321,
  "lng": 13.5431,
  "priceBasis": "national"
 },
 {
  "slug": "s7ec9bd1a",
  "name": "Willys Nybro 2264",
  "chain": "willys",
  "city": "Nybro",
  "country": "SE",
  "district": "Nybro",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.9066,
   56.7429
  ],
  "lat": 56.7429,
  "lng": 15.9066,
  "priceBasis": "national"
 },
 {
  "slug": "sf7eee10d",
  "name": "Willys Finspång",
  "chain": "willys",
  "city": "Finspång",
  "country": "SE",
  "district": "Finspång",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.8234,
   58.7015
  ],
  "lat": 58.7015,
  "lng": 15.8234,
  "priceBasis": "national"
 },
 {
  "slug": "s64d4669d",
  "name": "Willys Örebro Almby",
  "chain": "willys",
  "city": "Örebro",
  "country": "SE",
  "district": "Örebro",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.2382,
   59.2628
  ],
  "lat": 59.2628,
  "lng": 15.2382,
  "priceBasis": "national"
 },
 {
  "slug": "s98bbd6f9",
  "name": "Willy:s Ronneby C",
  "chain": "willys",
  "city": "Ronneby",
  "country": "SE",
  "district": "Ronneby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.2797,
   56.2107
  ],
  "lat": 56.2107,
  "lng": 15.2797,
  "priceBasis": "national"
 },
 {
  "slug": "sbeca0666",
  "name": "Willys",
  "chain": "willys",
  "city": "Enköping",
  "country": "SE",
  "district": "Enköping",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.0863,
   59.6503
  ],
  "lat": 59.6503,
  "lng": 17.0863,
  "priceBasis": "national"
 },
 {
  "slug": "s8e6cb131",
  "name": "Willys Hemma Säffle Station",
  "chain": "willys",
  "city": "Säffle",
  "country": "SE",
  "district": "Säffle",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.9165,
   59.1309
  ],
  "lat": 59.1309,
  "lng": 12.9165,
  "priceBasis": "national"
 },
 {
  "slug": "see60bba4",
  "name": "Willys",
  "chain": "willys",
  "city": "Gävle",
  "country": "SE",
  "district": "Gävle",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.1613,
   60.6594
  ],
  "lat": 60.6594,
  "lng": 17.1613,
  "priceBasis": "national"
 },
 {
  "slug": "s35a929e3",
  "name": "Willys",
  "chain": "willys",
  "city": "Ängelholm",
  "country": "SE",
  "district": "Ängelholm",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.8912,
   56.2558
  ],
  "lat": 56.2558,
  "lng": 12.8912,
  "priceBasis": "national"
 },
 {
  "slug": "sc8d623b9",
  "name": "Willys",
  "chain": "willys",
  "city": "Flen",
  "country": "SE",
  "district": "Flen",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.5919,
   59.0633
  ],
  "lat": 59.0633,
  "lng": 16.5919,
  "priceBasis": "national"
 },
 {
  "slug": "s570de4c1",
  "name": "Willy:s Växjö I 11 - 2265",
  "chain": "willys",
  "city": "Växjö",
  "country": "SE",
  "district": "Växjö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.7676,
   56.8774
  ],
  "lat": 56.8774,
  "lng": 14.7676,
  "priceBasis": "national"
 },
 {
  "slug": "s109616b7",
  "name": "Willys",
  "chain": "willys",
  "city": "Skövde",
  "country": "SE",
  "district": "Skövde",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.881,
   58.4091
  ],
  "lat": 58.4091,
  "lng": 13.881,
  "priceBasis": "national"
 },
 {
  "slug": "s743a8179",
  "name": "Willys",
  "chain": "willys",
  "city": "Mariestad",
  "country": "SE",
  "district": "Mariestad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.8165,
   58.6823
  ],
  "lat": 58.6823,
  "lng": 13.8165,
  "priceBasis": "national"
 },
 {
  "slug": "s2e808c55",
  "name": "Willys",
  "chain": "willys",
  "city": "Åkersberga",
  "country": "SE",
  "district": "Åkersberga",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.2761,
   59.4894
  ],
  "lat": 59.4894,
  "lng": 18.2761,
  "priceBasis": "national"
 },
 {
  "slug": "s19c1ab20",
  "name": "Willys Hemma Ulricehamn",
  "chain": "willys",
  "city": "Ulricehamn",
  "country": "SE",
  "district": "Ulricehamn",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.4092,
   57.7893
  ],
  "lat": 57.7893,
  "lng": 13.4092,
  "priceBasis": "national"
 },
 {
  "slug": "s444b7429",
  "name": "Willys",
  "chain": "willys",
  "city": "Sköndal",
  "country": "SE",
  "district": "Sköndal",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.1064,
   59.2604
  ],
  "lat": 59.2604,
  "lng": 18.1064,
  "priceBasis": "national"
 },
 {
  "slug": "s97f99f2f",
  "name": "Willys",
  "chain": "willys",
  "city": "Piteå",
  "country": "SE",
  "district": "Piteå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   21.439,
   65.3237
  ],
  "lat": 65.3237,
  "lng": 21.439,
  "priceBasis": "national"
 },
 {
  "slug": "s2c4fa0ff",
  "name": "Willys",
  "chain": "willys",
  "city": "Olofström",
  "country": "SE",
  "district": "Olofström",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   14.5364,
   56.2777
  ],
  "lat": 56.2777,
  "lng": 14.5364,
  "priceBasis": "national"
 },
 {
  "slug": "s7d62e12f",
  "name": "Willy:s Karlskrona Lyckeby 2153",
  "chain": "willys",
  "city": "Lyckeby",
  "country": "SE",
  "district": "Lyckeby",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   15.6499,
   56.1968
  ],
  "lat": 56.1968,
  "lng": 15.6499,
  "priceBasis": "national"
 },
 {
  "slug": "scb54d9e5",
  "name": "Willys",
  "chain": "willys",
  "city": "Tyresö",
  "country": "SE",
  "district": "Tyresö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   18.2156,
   59.2482
  ],
  "lat": 59.2482,
  "lng": 18.2156,
  "priceBasis": "national"
 },
 {
  "slug": "saf923907",
  "name": "Willys",
  "chain": "willys",
  "city": "Sandviken",
  "country": "SE",
  "district": "Sandviken",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   16.7713,
   60.6258
  ],
  "lat": 60.6258,
  "lng": 16.7713,
  "priceBasis": "national"
 },
 {
  "slug": "s559d683d",
  "name": "Willys Åmål Rondellen",
  "chain": "willys",
  "city": "Åmål",
  "country": "SE",
  "district": "Åmål",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   12.676,
   59.0563
  ],
  "lat": 59.0563,
  "lng": 12.676,
  "priceBasis": "national"
 },
 {
  "slug": "s30cc207a",
  "name": "Willys Skurup Handelsplats",
  "chain": "willys",
  "city": "Skurup",
  "country": "SE",
  "district": "Skurup",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.486,
   55.4916
  ],
  "lat": 55.4916,
  "lng": 13.486,
  "priceBasis": "national"
 },
 {
  "slug": "sf5b42a99",
  "name": "Willys Skellefteå Anderstorp",
  "chain": "willys",
  "city": "Skellefteå",
  "country": "SE",
  "district": "Skellefteå",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   20.963,
   64.7427
  ],
  "lat": 64.7427,
  "lng": 20.963,
  "priceBasis": "national"
 },
 {
  "slug": "s307c643f",
  "name": "Willys Vagnhärad",
  "chain": "willys",
  "city": "Vagnhärad",
  "country": "SE",
  "district": "Vagnhärad",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   17.4953,
   58.9541
  ],
  "lat": 58.9541,
  "lng": 17.4953,
  "priceBasis": "national"
 },
 {
  "slug": "s58ee96e5",
  "name": "Willys Hemma",
  "chain": "willys",
  "city": "Lund",
  "country": "SE",
  "district": "Lund",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.1925,
   55.7025
  ],
  "lat": 55.7025,
  "lng": 13.1925,
  "priceBasis": "national"
 },
 {
  "slug": "s25b4c5c2",
  "name": "ICA Kvantum Malmborgs Mobilia",
  "chain": "ica",
  "city": "Malmö",
  "country": "SE",
  "district": "Malmö",
  "distance": 0,
  "basketCost": 1902,
  "basketDiff": 36,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.0047,
   55.5799
  ],
  "lat": 55.5799,
  "lng": 13.0047,
  "priceBasis": "per_store"
 },
 {
  "slug": "s5a1f588e",
  "name": "ICA Kvantum Kiruna",
  "chain": "ica",
  "city": "Kiruna",
  "country": "SE",
  "district": "Kiruna",
  "distance": 0,
  "basketCost": 1929,
  "basketDiff": 63,
  "percentile": 96,
  "openTill": "",
  "coords": [
   20.2538,
   67.8485
  ],
  "lat": 67.8485,
  "lng": 20.2538,
  "priceBasis": "per_store"
 },
 {
  "slug": "s3306cc04",
  "name": "ICA Supermarket Nordeviks",
  "chain": "ica",
  "city": "Skärhamn",
  "country": "SE",
  "district": "Skärhamn",
  "distance": 0,
  "basketCost": 1933,
  "basketDiff": 67,
  "percentile": 96,
  "openTill": "",
  "coords": [
   11.5542,
   57.9856
  ],
  "lat": 57.9856,
  "lng": 11.5542,
  "priceBasis": "per_store"
 },
 {
  "slug": "sdbd6aade",
  "name": "ICA Kvantum Hammarö",
  "chain": "ica",
  "city": "Hammarö",
  "country": "SE",
  "district": "Hammarö",
  "distance": 0,
  "basketCost": 1946,
  "basketDiff": 80,
  "percentile": 96,
  "openTill": "",
  "coords": [
   13.5044,
   59.3426
  ],
  "lat": 59.3426,
  "lng": 13.5044,
  "priceBasis": "per_store"
 },
 {
  "slug": "s0352eee7",
  "name": "ICA Kvantum Kristianstad",
  "chain": "ica",
  "city": "Kristianstad",
  "country": "SE",
  "district": "Kristianstad",
  "distance": 0,
  "basketCost": 1953,
  "basketDiff": 87,
  "percentile": 97,
  "openTill": "",
  "coords": [
   14.1691,
   56.0253
  ],
  "lat": 56.0253,
  "lng": 14.1691,
  "priceBasis": "per_store"
 },
 {
  "slug": "s22505c9d",
  "name": "ICA Kvantum Tidaholm",
  "chain": "ica",
  "city": "Tidaholm",
  "country": "SE",
  "district": "Tidaholm",
  "distance": 0,
  "basketCost": 1960,
  "basketDiff": 94,
  "percentile": 97,
  "openTill": "",
  "coords": [
   13.9517,
   58.1795
  ],
  "lat": 58.1795,
  "lng": 13.9517,
  "priceBasis": "per_store"
 },
 {
  "slug": "sb860e962",
  "name": "ICA Supermarket Hovmantorp",
  "chain": "ica",
  "city": "Hovmantorp",
  "country": "SE",
  "district": "Hovmantorp",
  "distance": 0,
  "basketCost": 1967,
  "basketDiff": 101,
  "percentile": 97,
  "openTill": "",
  "coords": [
   15.1397,
   56.787
  ],
  "lat": 56.787,
  "lng": 15.1397,
  "priceBasis": "per_store"
 },
 {
  "slug": "s1d57b26a",
  "name": "ICA Supermarket Falköping",
  "chain": "ica",
  "city": "Falköping",
  "country": "SE",
  "district": "Falköping",
  "distance": 0,
  "basketCost": 1969,
  "basketDiff": 103,
  "percentile": 97,
  "openTill": "",
  "coords": [
   13.5634,
   58.1543
  ],
  "lat": 58.1543,
  "lng": 13.5634,
  "priceBasis": "per_store"
 },
 {
  "slug": "s39f8e82c",
  "name": "ICA Kvantum Säffle",
  "chain": "ica",
  "city": "Säffle",
  "country": "SE",
  "district": "Säffle",
  "distance": 0,
  "basketCost": 1975,
  "basketDiff": 109,
  "percentile": 98,
  "openTill": "",
  "coords": [
   12.8863,
   59.1278
  ],
  "lat": 59.1278,
  "lng": 12.8863,
  "priceBasis": "per_store"
 },
 {
  "slug": "s71f64626",
  "name": "Coop Visby",
  "chain": "coop",
  "city": "Visby",
  "country": "SE",
  "district": "Visby",
  "distance": 0,
  "basketCost": 1976,
  "basketDiff": 110,
  "percentile": 98,
  "openTill": "",
  "coords": [
   18.3014,
   57.6379
  ],
  "lat": 57.6379,
  "lng": 18.3014,
  "priceBasis": "regional"
 },
 {
  "slug": "sa2cd57d3",
  "name": "ICA Tor Center",
  "chain": "ica",
  "city": "Torsåker",
  "country": "SE",
  "district": "Torsåker",
  "distance": 0,
  "basketCost": 1986,
  "basketDiff": 120,
  "percentile": 98,
  "openTill": "",
  "coords": [
   16.4727,
   60.5113
  ],
  "lat": 60.5113,
  "lng": 16.4727,
  "priceBasis": "per_store"
 },
 {
  "slug": "s9eef8e92",
  "name": "ICA Supermarket Lindvallen",
  "chain": "ica",
  "city": "Sälen",
  "country": "SE",
  "district": "Sälen",
  "distance": 0,
  "basketCost": 1999,
  "basketDiff": 133,
  "percentile": 98,
  "openTill": "",
  "coords": [
   13.2028,
   61.1644
  ],
  "lat": 61.1644,
  "lng": 13.2028,
  "priceBasis": "per_store"
 },
 {
  "slug": "s5bdf5178",
  "name": "Coop Uppsala",
  "chain": "coop",
  "city": "Uppsala",
  "country": "SE",
  "district": "Uppsala",
  "distance": 0,
  "basketCost": 2007,
  "basketDiff": 141,
  "percentile": 99,
  "openTill": "",
  "coords": [
   17.6032,
   59.841
  ],
  "lat": 59.841,
  "lng": 17.6032,
  "priceBasis": "regional"
 },
 {
  "slug": "s94d11738",
  "name": "ICA Supermarket Hedemyrs",
  "chain": "ica",
  "city": "Tanumshede",
  "country": "SE",
  "district": "Tanumshede",
  "distance": 0,
  "basketCost": 2023,
  "basketDiff": 157,
  "percentile": 99,
  "openTill": "",
  "coords": [
   11.3244,
   58.7247
  ],
  "lat": 58.7247,
  "lng": 11.3244,
  "priceBasis": "per_store"
 },
 {
  "slug": "s838b6c48",
  "name": "ICA Kvantum Filipstad",
  "chain": "ica",
  "city": "Filipstad",
  "country": "SE",
  "district": "Filipstad",
  "distance": 0,
  "basketCost": 2024,
  "basketDiff": 158,
  "percentile": 99,
  "openTill": "",
  "coords": [
   14.1567,
   59.713
  ],
  "lat": 59.713,
  "lng": 14.1567,
  "priceBasis": "per_store"
 },
 {
  "slug": "s47a86dfa",
  "name": "ICA Kvantum Tomelilla",
  "chain": "ica",
  "city": "Tomelilla",
  "country": "SE",
  "district": "Tomelilla",
  "distance": 0,
  "basketCost": 2024,
  "basketDiff": 158,
  "percentile": 99,
  "openTill": "",
  "coords": [
   13.9458,
   55.5459
  ],
  "lat": 55.5459,
  "lng": 13.9458,
  "priceBasis": "per_store"
 },
 {
  "slug": "s39ac815f",
  "name": "ICA Supermarket Berga Centrum, Kalmar",
  "chain": "ica",
  "city": "Kalmar",
  "country": "SE",
  "district": "Kalmar",
  "distance": 0,
  "basketCost": 2038,
  "basketDiff": 172,
  "percentile": 100,
  "openTill": "",
  "coords": [
   16.3386,
   56.6916
  ],
  "lat": 56.6916,
  "lng": 16.3386,
  "priceBasis": "per_store"
 },
 {
  "slug": "sd7c0a6bc",
  "name": "ICA Kvantum Kvissleby",
  "chain": "ica",
  "city": "Kvissleby",
  "country": "SE",
  "district": "Kvissleby",
  "distance": 0,
  "basketCost": 2064,
  "basketDiff": 198,
  "percentile": 100,
  "openTill": "",
  "coords": [
   17.3789,
   62.2985
  ],
  "lat": 62.2985,
  "lng": 17.3789,
  "priceBasis": "per_store"
 },
 {
  "slug": "s317a71b6",
  "name": "ICA Nära Ryd",
  "chain": "ica",
  "city": "Ryd",
  "country": "SE",
  "district": "Ryd",
  "distance": 0,
  "basketCost": 2081,
  "basketDiff": 215,
  "percentile": 100,
  "openTill": "",
  "coords": [
   14.6931,
   56.466
  ],
  "lat": 56.466,
  "lng": 14.6931,
  "priceBasis": "per_store"
 }
];
const PRICE_HISTORY_LONG = [];
const MY_BASKET_DEFAULT = [
 {
  "slug": "p9199795b",
  "qty": 1
 },
 {
  "slug": "pca18d9a8",
  "qty": 1
 },
 {
  "slug": "p85b7289b",
  "qty": 1
 },
 {
  "slug": "p5fce7307",
  "qty": 1
 },
 {
  "slug": "p74483b4f",
  "qty": 1
 },
 {
  "slug": "pf0b06ba4",
  "qty": 1
 },
 {
  "slug": "p7cb4f0e1",
  "qty": 1
 },
 {
  "slug": "p0e710aa5",
  "qty": 1
 },
 {
  "slug": "p766e99bf",
  "qty": 1
 },
 {
  "slug": "pe247177f",
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
