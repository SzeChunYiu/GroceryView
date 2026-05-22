export type IcaProduct = {
  code: string;
  productId: string;
  retailerProductId: string;
  name: string;
  brand: string;
  categories: string[];
  imageUrl: string;
  productUrl: string;
  packageSize: string;
  countryOfOrigin: string;
  price: number | null;
  priceCurrency: string;
  unitPrice: number | null;
  unitPriceCurrency: string;
  unitPriceUnit: string;
  promoPrice: number | null;
  promoPriceCurrency: string;
  promoUnitPrice: number | null;
  promoUnitPriceCurrency: string;
  promoUnitPriceUnit: string;
  promotionDescription: string;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  sourceUrl: string;
  retrievedAt: string;
};

export const ICA_STORE_BASE_URL = 'https://handlaprivatkund.ica.se';
export const DEFAULT_ICA_STORE_ACCOUNT_ID = '1004599';
export const DEFAULT_ICA_STORE_NAME = 'ICA Kvantum Kungsholmen';
export const DEFAULT_ICA_REGION_ID = '6ae1c52a-99a8-4b19-9464-dd01274df39d';
export const DEFAULT_ICA_MAX_PRODUCTS = 300;

export type IcaStoreConfig = {
  storeAccountId: string;
  storeName: string;
  regionId: string;
};

export const DEFAULT_ICA_STORE_CONFIGS: readonly IcaStoreConfig[] = [
  {
    storeAccountId: DEFAULT_ICA_STORE_ACCOUNT_ID,
    storeName: DEFAULT_ICA_STORE_NAME,
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004247',
    storeName: 'ICA Focus',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003714',
    storeName: 'ICA Karlaplan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004228',
    storeName: 'ICA Supermarket Fältöversten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004222',
    storeName: 'ICA Kvantum Södermalm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003754',
    storeName: 'ICA Supermarket Sjöstaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003380',
    storeName: 'Maxi ICA Stormarknad Solna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1015001',
    storeName: 'Maxi ICA Stormarknad Bromma',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004309',
    storeName: 'ICA Nära Annedal',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003898',
    storeName: 'ICA Kvantum Tyresö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003408',
    storeName: 'Maxi ICA Stormarknad Barkarbystaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004407',
    storeName: 'Maxi ICA Stormarknad Botkyrka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003777',
    storeName: 'Maxi ICA Stormarknad Haninge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004414',
    storeName: 'ICA Banér',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003855',
    storeName: 'ICA Supermarket Vanadis',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004315',
    storeName: 'ICA Nära Kallhäll',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1051011',
    storeName: 'Maxi ICA Stormarknad Österåker',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003735',
    storeName: 'Maxi ICA Stormarknad Moraberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003729',
    storeName: 'ICA Nära Brottbyhallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004109',
    storeName: 'Maxi ICA Stormarknad Vasa Handelsplats',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003510',
    storeName: 'ICA Nära Enhörna, Södertälje',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003975',
    storeName: 'ICA Nära Lunda Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003429',
    storeName: 'Maxi ICA Stormarknad Bålsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003421',
    storeName: 'Maxi ICA Stormarknad Nynäshamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003416',
    storeName: 'ICA Kvantum Knivsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003820',
    storeName: 'ICA Supermarket Torghallen, Mariefred',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003471',
    storeName: 'ICA Kvantum Rimbo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003458',
    storeName: 'ICA Kvantum Ale',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003647',
    storeName: 'Maxi ICA Stormarknad Alingsås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003644',
    storeName: 'ICA Nära Alexius Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004242',
    storeName: 'ICA Supermarket Alfta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003645',
    storeName: 'ICA Supermarket Algots Mönsterås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004333',
    storeName: 'ICA Nära Alléns',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003650',
    storeName: 'ICA Nära Almunge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003654',
    storeName: 'ICA Supermarket Alunda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004219',
    storeName: 'Maxi ICA Stormarknad Göteborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004589',
    storeName: 'ICA Kvantum Mölndal',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003954',
    storeName: 'Maxi ICA Stormarknad Högsbo, Göteborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003825',
    storeName: 'Maxi ICA Stormarknad Torslanda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003932',
    storeName: 'ICA Kvantum Hovås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004392',
    storeName: 'Maxi ICA Stormarknad Kungälv',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004185',
    storeName: 'Maxi ICA Stormarknad Kungsbacka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003398',
    storeName: 'ICA Kvantum Stenungsund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003778',
    storeName: 'ICA Kvantum Frölunda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004365',
    storeName: 'Maxi ICA Stormarknad Partille',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003383',
    storeName: 'ICA Kvantum Lerum',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003849',
    storeName: 'ICA Supermarket Hönö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003917',
    storeName: 'ICA Kvantum Kungsbacka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004291',
    storeName: 'ICA Supermarket Nordeviks',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004520',
    storeName: 'ICA Supermarket Noltorp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004490',
    storeName: 'ICA Kvantum Malmborgs Caroli',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003569',
    storeName: 'Maxi ICA Stormarknad Västra Hamnen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004037',
    storeName: 'ICA Kvantum Malmborgs Mobilia',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004492',
    storeName: 'Maxi ICA Stormarknad Malmö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003428',
    storeName: 'Maxi ICA Stormarknad Burlöv',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1088004',
    storeName: 'Maxi ICA Stormarknad Gunnesbo, Lund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004060',
    storeName: 'Maxi ICA Stormarknad Löddeköpinge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003612',
    storeName: 'ICA Kvantum Karlssons',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003452',
    storeName: 'ICA Kvantum Södra Sandby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003620',
    storeName: 'Maxi ICA Stormarknad Trelleborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004360',
    storeName: 'ICA Kvantum Sjöbo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003916',
    storeName: 'Maxi ICA Stormarknad Råå Helsingborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003793',
    storeName: 'ICA Kvantum Hörby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004458',
    storeName: 'ICA Supermarket Luthagens Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004181',
    storeName: 'ICA Folkes Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003386',
    storeName: 'ICA Nära Stabby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003426',
    storeName: 'ICA Supermarket Årstahallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003871',
    storeName: 'ICA Kvantum Uppsala',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004488',
    storeName: 'Maxi ICA Stormarknad Stenhagen Uppsala',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003521',
    storeName: 'ICA Supermarket Sigtuna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004562',
    storeName: 'ICA Kvantum Märsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004504',
    storeName: 'ICA Supermarket Bro',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003501',
    storeName: 'ICA Kvantum Väsby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004501',
    storeName: 'ICA Kvantum Vallentuna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003415',
    storeName: 'Maxi ICA Stormarknad Häggvik',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003673',
    storeName: 'ICA Kvantum Sollentuna C',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1131004',
    storeName: 'Maxi ICA Stormarknad Arninge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004250',
    storeName: 'ICA Kvantum Täby C',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003723',
    storeName: 'ICA Supermarket Boström',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003490',
    storeName: 'ICA Rylander',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004380',
    storeName: 'Maxi ICA Stormarknad Enköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003784',
    storeName: 'ICA Supermarket Örbyhus',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004388',
    storeName: 'ICA Supermarket Stop Täby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003830',
    storeName: 'ICA Trevehallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004531',
    storeName: 'ICA Supermarket Hässelby Torg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003442',
    storeName: 'ICA Supermarket Åkersberga Centrum',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004173',
    storeName: 'ICA Supermarket Favoriten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004581',
    storeName: 'ICA Kvantum Mall of Scandinavia',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003586',
    storeName: 'ICA Supermarket Berga Centrum, Linköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003823',
    storeName: 'Maxi ICA Stormarknad Linköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004066',
    storeName: 'ICA Supermarket Rimforsa',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004546',
    storeName: 'ICA Supermarket Åtvidaberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003556',
    storeName: 'ICA Supermarket Eneby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004539',
    storeName: 'ICA Nära Tjällmo handel',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004267',
    storeName: 'Maxi ICA Stormarknad Motala',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003690',
    storeName: 'ICA Kvantum Mirum Galleria, Norrköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1051010',
    storeName: 'Maxi ICA Stormarknad Norrköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003461',
    storeName: 'ICA Supermarket Smedby, Norrköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004043',
    storeName: 'ICA Nära Boxholm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004592',
    storeName: 'ICA Supermarket Söderköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003580',
    storeName: 'ICA Supermarket Kisa',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004084',
    storeName: 'Maxi ICA Stormarknad Helsingborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003937',
    storeName: 'Maxi ICA Stormarknad Hyllinge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003382',
    storeName: 'Maxi ICA Stormarknad Luleå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004453',
    storeName: 'ICA Kvantum Stormarknad, Luleå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004142',
    storeName: 'ICA Kvantum Boden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003896',
    storeName: 'ICA Kvantum Piteå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003828',
    storeName: 'Maxi ICA Stormarknad Umeå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004229',
    storeName: 'ICA Kvantum Kronoparken',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004425',
    storeName: 'ICA Supermarket Sävar',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004559',
    storeName: 'ICA Nära Börsen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003602',
    storeName: 'ICA Supermarket Östra Husby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004034',
    storeName: 'Maxi ICA Stormarknad Katrineholm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003392',
    storeName: 'ICA Supermarket Fyren',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004097',
    storeName: 'Maxi ICA Stormarknad Örebro Boglundsängen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003736',
    storeName: 'Maxi ICA Stormarknad Universitetet',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004364',
    storeName: 'ICA Kvantum Örebro',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003562',
    storeName: 'Maxi ICA Stormarknad Kumla',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004235',
    storeName: 'ICA Odenhallen, Odensbacken',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004335',
    storeName: 'ICA Supermarket Näsbyhallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004564',
    storeName: 'ICA Supermarket Hallsberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004536',
    storeName: 'ICA Supermarket Nora',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003883',
    storeName: 'ICA Supermarket Alvesta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003551',
    storeName: 'ICA Nära Vilstahallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1166011',
    storeName: 'Maxi ICA Stormarknad Arvika',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004027',
    storeName: 'Maxi ICA Stormarknad Karlshamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004685',
    storeName: 'ICA Torghallen, Askersund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004517',
    storeName: 'ICA Kvantum Avesta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004061',
    storeName: 'ICA Supermarket Hagsätra',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003507',
    storeName: 'ICA Supermarket Bankeryd',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003704',
    storeName: 'ICA Supermarket Bjästa',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1051012',
    storeName: 'Maxi ICA Stormarknad Bollnäs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004119',
    storeName: 'Maxi ICA Stormarknad Borlänge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004101',
    storeName: 'ICA City Knalleland',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003722',
    storeName: 'Maxi ICA Stormarknad Borås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003705',
    storeName: 'ICA Nära Braås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004093',
    storeName: 'ICA Nära Bredaryd',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004577',
    storeName: 'ICA Supermarket Brommaplan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003838',
    storeName: 'Maxi ICA Stormarknad Bromölla',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004056',
    storeName: 'ICA Nära Bräkne-Hoby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004098',
    storeName: 'ICA City Brämhult',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1037008',
    storeName: 'ICA Supermarket Charlottenberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004127',
    storeName: 'ICA Supermarket Delsbohallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004290',
    storeName: 'ICA Supermarket Edsbyn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003876',
    storeName: 'ICA Supermarket Tappström',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004151',
    storeName: 'ICA Supermarket Ekshärad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004391',
    storeName: 'ICA Supermarket Eksjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004469',
    storeName: 'ICA Supermarket Emmaboda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003686',
    storeName: 'ICA Kvantum BEA Livsmedel',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004152',
    storeName: 'ICA Kvantum Ekängen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004413',
    storeName: 'ICA Supermarket Stenby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004513',
    storeName: 'Maxi ICA Stormarknad Eskilstuna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004170',
    storeName: 'ICA Kvantum Falkenberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003688',
    storeName: 'ICA Supermarket Skrea Strand',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003880',
    storeName: 'ICA Supermarket Falköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004508',
    storeName: 'ICA Supermarket Slätta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003411',
    storeName: 'Maxi ICA Stormarknad Falun',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003412',
    storeName: 'ICA Kvantum Farsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004175',
    storeName: 'ICA Kvantum Filipstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003606',
    storeName: 'ICA Kvantum Flen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003837',
    storeName: 'ICA Supermarket Forshaga',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004100',
    storeName: 'ICA City Fristad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003861',
    storeName: 'ICA Supermarket Vallhalla',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004069',
    storeName: 'ICA Supermarket Bunge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003656',
    storeName: 'ICA Kvantum Färjestaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004214',
    storeName: 'ICA Kvantum Gislaved',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003868',
    storeName: 'ICA Supermarket Klingan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004349',
    storeName: 'ICA Nära Optimisten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004551',
    storeName: 'ICA Kvantum Gällivare',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003610',
    storeName: 'ICA Nära Gällstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003587',
    storeName: 'ICA Nära Bomhus',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004534',
    storeName: 'ICA Supermarket Strömsbro',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1158001',
    storeName: 'Maxi ICA Stormarknad Brynäs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003987',
    storeName: 'Maxi ICA Stormarknad Gävle',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003764',
    storeName: 'ICA Supermarket Ettan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004211',
    storeName: 'ICA Nära Pettersberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004356',
    storeName: 'ICA Nära Vallby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003869',
    storeName: 'ICA Kvantum Västerås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004015',
    storeName: 'Maxi ICA Stormarknad Jönköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003919',
    storeName: 'ICA Nära Hovslätt',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003571',
    storeName: 'Maxi ICA Stormarknad Växjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004593',
    storeName: 'ICA Kvantum Teleborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003792',
    storeName: 'ICA Supermarket Hovshaga',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004519',
    storeName: 'ICA Supermarket Fanfaren',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004029',
    storeName: 'Maxi ICA Stormarknad Karlstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004584',
    storeName: 'ICA Kvantum Hammarö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003565',
    storeName: 'Maxi ICA Stormarknad Välsviken',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004396',
    storeName: 'ICA Kvantum Nacksta Sundsvall',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003423',
    storeName: 'Maxi ICA Stormarknad Sundsvall',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003884',
    storeName: 'ICA Kvantum Götene',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '00966',
    storeName: 'ICA Supermarket Matkassen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003648',
    storeName: 'ICA Supermarket Söndrum',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003781',
    storeName: 'Maxi ICA Stormarknad Flygstaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003925',
    storeName: 'Maxi ICA Stormarknad Högskolan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003960',
    storeName: 'ICA Supermarket Skutan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004009',
    storeName: 'ICA Supermarket Högbyhallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003453',
    storeName: 'ICA Supermarket Pärlan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003931',
    storeName: 'ICA Supermarket Hofors',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003996',
    storeName: 'ICA Supermarket Hovmantorp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003430',
    storeName: 'Maxi ICA Stormarknad Flemingsberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003414',
    storeName: 'Maxi ICA Stormarknad Hudiksvall',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004554',
    storeName: 'ICA Supermarket Telefonplan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003949',
    storeName: 'Maxi ICA Stormarknad Härnösand',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003545',
    storeName: 'Maxi ICA Stormarknad Hässleholm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003951',
    storeName: 'ICA Kvantum Höganäs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003395',
    storeName: 'ICA Supermarket Höör',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003446',
    storeName: 'ICA Supermarket Jämjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003750',
    storeName: 'ICA Nära Järbo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004514',
    storeName: 'ICA Supermarket Järvsö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004348',
    storeName: 'Maxi ICA Stormarknad Kalmar',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004523',
    storeName: 'ICA Supermarket Berga Centrum, Kalmar',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003977',
    storeName: 'ICA Supermarket Smedby, Kalmar',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003696',
    storeName: 'ICA Supermarket Lindsdal',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004441',
    storeName: 'ICA Skansen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003661',
    storeName: 'ICA Kvantum Nybro',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004194',
    storeName: 'ICA Nära Ålem',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004057',
    storeName: 'Maxi ICA Stormarknad Kristianstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004334',
    storeName: 'ICA Kvantum Kristianstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003905',
    storeName: 'ICA Kvantum Åhus',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004346',
    storeName: 'Maxi ICA Stormarknad Olofström',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003794',
    storeName: 'ICA Supermarket Osby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003966',
    storeName: 'ICA Supermarket Perstorp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004362',
    storeName: 'ICA Supermarket Cityhallen Karlskrona',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004028',
    storeName: 'Maxi ICA Stormarknad Karlskrona',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003513',
    storeName: 'Maxi ICA Stormarknad Ronneby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004376',
    storeName: 'ICA Supermarket Lammhult',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004237',
    storeName: 'ICA Nära Ryd',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003597',
    storeName: 'ICA Supermarket Mullsjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003785',
    storeName: 'ICA Supermarket Vaggeryd',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004704',
    storeName: 'Maxi ICA Stormarknad Karlskoga',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003404',
    storeName: 'ICA Supermarket Skåre',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003986',
    storeName: 'ICA Supermarket Kil',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004227',
    storeName: 'ICA Kvantum Kiruna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004395',
    storeName: 'ICA Kvantum Klippan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004054',
    storeName: 'ICA Supermarket Kramfors',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004299',
    storeName: 'Maxi ICA Stormarknad Kristinehamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003679',
    storeName: 'ICA Supermarket Skeppet, Kungshamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004588',
    storeName: 'ICA Kvantum Kvissleby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004375',
    storeName: 'Maxi ICA Stormarknad Köping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004688',
    storeName: 'ICA Supermarket Laxå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004437',
    storeName: 'ICA Kvantum Lidingö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004493',
    storeName: 'ICA Nära Rudboda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003833',
    storeName: 'ICA Supermarket Käppala',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004186',
    storeName: 'ICA Kvantum Hjertberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004695',
    storeName: 'ICA Supermarket Margretelund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004318',
    storeName: 'ICA Nära Likenäs Allköp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004424',
    storeName: 'ICA Supermarket Lindesberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004102',
    storeName: 'Maxi ICA Stormarknad Ljungby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004558',
    storeName: 'ICA Supermarket Ljungskile',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004594',
    storeName: 'ICA Kvantum Ludvika',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004459',
    storeName: 'ICA Supermarket Lycksele',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004460',
    storeName: 'ICA Supermarket Lysekil',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003614',
    storeName: 'ICA Supermarket Malung',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004565',
    storeName: 'ICA Supermarket Malå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004572',
    storeName: 'ICA Nära Mathörnan, Mariannelund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004044',
    storeName: 'ICA Kvantum Mariestad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004499',
    storeName: 'ICA Kvantum Markaryd',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003804',
    storeName: 'ICA Supermarket Matfors',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004243',
    storeName: 'Maxi ICA Stormarknad Mellbystrand',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003419',
    storeName: 'Maxi ICA Stormarknad Mora',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003771',
    storeName: 'ICA Supermarket Munka Ljungby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004021',
    storeName: 'ICA Kvantum Sickla',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004282',
    storeName: 'Maxi ICA Stormarknad Nacka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004289',
    storeName: 'ICA Supermarket Bommen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003532',
    storeName: 'ICA Kvantum Flygfyren',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004294',
    storeName: 'ICA Supermarket Norrköp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004095',
    storeName: 'ICA Supermarket Nossebro',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004303',
    storeName: 'Maxi ICA Stormarknad Nyköping',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004590',
    storeName: 'ICA Kvantum Nässjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003842',
    storeName: 'ICA Supermarket Ugglebo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004340',
    storeName: 'Maxi ICA Stormarknad Oskarshamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003531',
    storeName: 'ICA Kvantum Oxelösund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003474',
    storeName: 'ICA Supermarket Robertsfors',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004689',
    storeName: 'ICA Supermarket Salem',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003585',
    storeName: 'ICA Kvantum Åkrahallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003806',
    storeName: 'ICA Nära Nyplan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004503',
    storeName: 'ICA Supermarket Björksätra',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003396',
    storeName: 'Maxi ICA Stormarknad Sandviken',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003463',
    storeName: 'ICA Supermarket Simrishamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004002',
    storeName: 'ICA Kvantum Skellefteå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003910',
    storeName: 'Maxi ICA Stormarknad Skellefteå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003746',
    storeName: 'ICA Nära Blomman',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004080',
    storeName: 'Maxi ICA Stormarknad Skövde',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004092',
    storeName: 'ICA Supermarket Sollebrunn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004238',
    storeName: 'ICA Kvantum Sollefteå',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004420',
    storeName: 'ICA Nära Strandhallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003417',
    storeName: 'ICA Kvantum Liljeholmen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003425',
    storeName: 'ICA Kvantum Värtan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003988',
    storeName: 'ICA Supermarket Aptiten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004324',
    storeName: 'ICA Nära Riksten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004509',
    storeName: 'ICA Nära Söråker',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004195',
    storeName: 'ICA Supermarket Vimmerby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003971',
    storeName: 'ICA Supermarket Kärra',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003604',
    storeName: 'Maxi ICA Stormarknad Trollhättan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003475',
    storeName: 'ICA Supermarket Speceritjänst',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003424',
    storeName: 'Maxi ICA Stormarknad Värmdö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003816',
    storeName: 'ICA Tor Center',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003911',
    storeName: 'ICA Nära Kilafors',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003787',
    storeName: 'ICA Supermarket Ystad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003384',
    storeName: 'ICA Supermarket Anderstorp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004579',
    storeName: 'ICA Supermarket Sundbyberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004164',
    storeName: 'ICA Supermarket Esplanad, Sthlm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004026',
    storeName: 'ICA Supermarket Kungsholmstorg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003933',
    storeName: 'ICA Supermarket Ringen, Sthlm',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004134',
    storeName: 'ICA Supermarket Sabbatsberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003418',
    storeName: 'Maxi ICA Stormarknad Lindhagen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003563',
    storeName: 'ICA Supermarket Väddö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1135007',
    storeName: 'ICA Supermarket Älta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004436',
    storeName: 'ICA Nära Älvsjö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004477',
    storeName: 'ICA Supermarket Storuman',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003740',
    storeName: 'ICA Kvantum Strömstad',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004563',
    storeName: 'ICA Kvantum Säffle',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003751',
    storeName: 'ICA Supermarket BBB Sunne',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004393',
    storeName: 'ICA Supermarket Svenstavik',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004251',
    storeName: 'ICA Nära Sälen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004707',
    storeName: 'ICA Supermarket Lindvallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004032',
    storeName: 'ICA Nära Klingan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003939',
    storeName: 'ICA Supermarket Hedemyrs',
    regionId: DEFAULT_ICA_REGION_ID
  }
];

export type FetchIcaProductsOptions = {
  fetchImpl?: typeof fetch;
  storeAccountId?: string;
  storeName?: string;
  regionId?: string;
  maxRows?: number;
  maxPageSize?: number;
  retrievedAt?: string;
};

export function buildIcaStorePromotionsUrl(
  storeAccountId = DEFAULT_ICA_STORE_ACCOUNT_ID,
  regionId = DEFAULT_ICA_REGION_ID,
  maxPageSize = DEFAULT_ICA_MAX_PRODUCTS
): string {
  const url = new URL(`/stores/${storeAccountId}/api/product-listing-pages/v1/pages/promotions`, ICA_STORE_BASE_URL);
  url.searchParams.set('regionId', regionId);
  url.searchParams.set('includeAdditionalPageInfo', 'true');
  url.searchParams.set('maxProductsToDecorate', String(maxPageSize));
  url.searchParams.set('maxPageSize', String(maxPageSize));
  return url.toString();
}

export function buildIcaStoreProductUrl(storeAccountId: string, retailerProductId: string): string {
  return new URL(`/stores/${storeAccountId}/products/${retailerProductId}/details`, ICA_STORE_BASE_URL).toString();
}

export async function fetchIcaProducts(options: FetchIcaProductsOptions = {}): Promise<IcaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const storeAccountId = options.storeAccountId ?? DEFAULT_ICA_STORE_ACCOUNT_ID;
  const storeName = options.storeName ?? DEFAULT_ICA_STORE_NAME;
  const regionId = options.regionId ?? DEFAULT_ICA_REGION_ID;
  const maxRows = options.maxRows ?? DEFAULT_ICA_MAX_PRODUCTS;
  const maxPageSize = options.maxPageSize ?? maxRows;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = buildIcaStorePromotionsUrl(storeAccountId, regionId, maxPageSize);

  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json, text/plain, */*',
      referer: new URL(`/stores/${storeAccountId}`, ICA_STORE_BASE_URL).toString(),
      'client-route-id': 'PROMOTIONS',
      'ecom-request-source': 'web',
      'user-agent': 'GroceryView/0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`ICA store promotions request failed for ${storeAccountId}: ${response.status}`);
  }

  return parseIcaStorePromotions(await response.json(), {
    sourceUrl,
    retrievedAt,
    storeAccountId,
    storeName,
    regionId,
    maxRows
  });
}

export type FetchIcaDefaultStoreProductsOptions = Omit<
  FetchIcaProductsOptions,
  'storeAccountId' | 'storeName' | 'regionId'
> & {
  stores?: readonly IcaStoreConfig[];
};

export async function fetchIcaDefaultStoreProducts(
  options: FetchIcaDefaultStoreProductsOptions = {}
): Promise<IcaProduct[]> {
  const stores = options.stores ?? DEFAULT_ICA_STORE_CONFIGS;
  const concurrency = 8;
  const batches: PromiseSettledResult<IcaProduct[]>[] = [];
  for (let index = 0; index < stores.length; index += concurrency) {
    const batch = stores.slice(index, index + concurrency);
    batches.push(...await Promise.allSettled(batch.map((store) => fetchIcaProducts({
      ...options,
      storeAccountId: store.storeAccountId,
      storeName: store.storeName,
      regionId: store.regionId
    }))));
  }
  const rows = batches.flatMap((batch) => batch.status === 'fulfilled' ? batch.value : []);
  if (rows.length === 0) {
    const firstFailure = batches.find((batch) => batch.status === 'rejected');
    const reason = firstFailure?.status === 'rejected'
      ? firstFailure.reason instanceof Error ? firstFailure.reason.message : String(firstFailure.reason)
      : 'no ICA products returned';
    throw new Error(`ICA store promotions returned no usable branch products: ${reason}`);
  }

  return rows;
}

export type ParseIcaStorePromotionsOptions = {
  sourceUrl: string;
  retrievedAt: string;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  maxRows?: number;
};

export function parseIcaStorePromotions(payload: unknown, options: ParseIcaStorePromotionsOptions): IcaProduct[] {
  if (!isRecord(payload)) {
    return [];
  }
  const rows: IcaProduct[] = [];
  const seen = new Set<string>();
  const productGroups = arrayOfRecords(payload.productGroups);

  for (const group of productGroups) {
    const groupType = text(group.type);
    const category = groupType || text(group.name) || 'store_promotions';
    for (const product of arrayOfRecords(group.decoratedProducts)) {
      const productId = text(product.productId);
      const retailerProductId = text(product.retailerProductId);
      const name = text(product.name);
      if (!productId || !retailerProductId || !name || seen.has(retailerProductId)) {
        continue;
      }
      seen.add(retailerProductId);
      const price = money(product.price);
      const unitPrice = nestedMoney(product.unitPrice);
      const promoPrice = money(product.promoPrice);
      const promoUnitPrice = nestedMoney(product.promoUnitPrice);
      const promotion = arrayOfRecords(product.promotions)[0];

      rows.push({
        code: retailerProductId,
        productId,
        retailerProductId,
        name,
        brand: text(product.brand),
        categories: [category],
        imageUrl: imageUrl(product.image),
        productUrl: buildIcaStoreProductUrl(options.storeAccountId, retailerProductId),
        packageSize: text(product.packSizeDescription),
        countryOfOrigin: text(product.countryOfOrigin),
        price: price.amount,
        priceCurrency: price.currency,
        unitPrice: unitPrice.amount,
        unitPriceCurrency: unitPrice.currency,
        unitPriceUnit: unitPrice.unit,
        promoPrice: promoPrice.amount,
        promoPriceCurrency: promoPrice.currency,
        promoUnitPrice: promoUnitPrice.amount,
        promoUnitPriceCurrency: promoUnitPrice.currency,
        promoUnitPriceUnit: promoUnitPrice.unit,
        promotionDescription: text(promotion?.description),
        storeAccountId: options.storeAccountId,
        storeName: options.storeName,
        regionId: options.regionId,
        sourceUrl: options.sourceUrl,
        retrievedAt: options.retrievedAt
      });

      if (options.maxRows && rows.length >= options.maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: unknown): { amount: number | null; currency: string } {
  if (!isRecord(value)) {
    return { amount: null, currency: '' };
  }
  return {
    amount: typeof value.amount === 'number' ? value.amount : null,
    currency: text(value.currency)
  };
}

function nestedMoney(value: unknown): { amount: number | null; currency: string; unit: string } {
  if (!isRecord(value)) {
    return { amount: null, currency: '', unit: '' };
  }
  const price = money(value.price);
  return {
    amount: price.amount,
    currency: price.currency,
    unit: text(value.unit)
  };
}

function imageUrl(value: unknown): string {
  if (!isRecord(value)) {
    return '';
  }
  return text(value.src);
}
