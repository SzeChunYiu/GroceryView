// AUTO-GENERATED from sampled public branch observation feeds.
// Sources: Lidl store offers, Willys/Hemkop Axfood campaign rows, Coop online products and flyer rows.

export type IngestedBranchPriceObservation = {
  sourceKey: string;
  sourceLabel: string;
  retailer: string;
  storeId: string;
  storeName: string;
  city: string;
  productKey: string;
  productName: string;
  price: number;
};

export const geoPriceBranchObservationSourceLabels = [
  'Lidl public branch offers',
  'Willys weekly discount branch rows',
  'Hemkop weekly discount branch rows',
  'Coop online-price store rows',
  'Coop weekly flyer branch rows'
] as const;

export const geoPriceBranchObservations: IngestedBranchPriceObservation[] = [
  {
    sourceKey: 'lidl-store-offers',
    sourceLabel: 'Lidl public branch offers',
    retailer: 'Lidl',
    storeId: 'stockholm/sveavagen-59',
    storeName: 'Lidl Stockholm Sveavagen 59',
    city: 'Stockholm',
    productKey: '101302991',
    productName: 'Makaroner Pasta',
    price: 16.9
  },
  {
    sourceKey: 'willys-weekly-discounts',
    sourceLabel: 'Willys weekly discount branch rows',
    retailer: 'Willys',
    storeId: '2149',
    storeName: 'Willys Stockholm Mariahallen',
    city: 'Stockholm',
    productKey: '101302991',
    productName: 'Makaroner Pasta',
    price: 15.9
  },
  {
    sourceKey: 'hemkop-weekly-discounts',
    sourceLabel: 'Hemkop weekly discount branch rows',
    retailer: 'Hemkop',
    storeId: '4102',
    storeName: 'Hemkop Stockholm Torsplan',
    city: 'Stockholm',
    productKey: '101302991',
    productName: 'Makaroner Pasta',
    price: 18.9
  },
  {
    sourceKey: 'coop-online-products',
    sourceLabel: 'Coop online-price store rows',
    retailer: 'Coop',
    storeId: '026500',
    storeName: 'Coop Stockholm Central',
    city: 'Stockholm',
    productKey: '7340011403022',
    productName: 'Makaroner Pasta',
    price: 17.5
  },
  {
    sourceKey: 'coop-weekly-discounts',
    sourceLabel: 'Coop weekly flyer branch rows',
    retailer: 'Coop',
    storeId: '176110',
    storeName: 'Coop City Hallsberg',
    city: 'Hallsberg',
    productKey: '101758934',
    productName: 'Havregryn Extra Fylliga',
    price: 22.9
  },
  {
    sourceKey: 'willys-weekly-discounts',
    sourceLabel: 'Willys weekly discount branch rows',
    retailer: 'Willys',
    storeId: '2355',
    storeName: 'Willys Hallsberg',
    city: 'Hallsberg',
    productKey: '101758934',
    productName: 'Havregryn Extra Fylliga',
    price: 21.9
  },
  {
    sourceKey: 'hemkop-weekly-discounts',
    sourceLabel: 'Hemkop weekly discount branch rows',
    retailer: 'Hemkop',
    storeId: '4555',
    storeName: 'Hemkop Hallsberg',
    city: 'Hallsberg',
    productKey: '101758934',
    productName: 'Havregryn Extra Fylliga',
    price: 24.9
  }
];
