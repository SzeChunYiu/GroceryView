export const weeklyBasketRows = [
  {
    product: 'Zoegas Coffee 450g',
    store: 'Willys Odenplan',
    quantity: '1 pack',
    total: '49.90 SEK',
    movement: '-8.4%',
    source: 'retailer flyer observation'
  },
  {
    product: 'Arla Mellanmjolk 1L',
    store: 'Lidl Sveavagen',
    quantity: '3 cartons',
    total: '41.70 SEK',
    movement: '-2.1%',
    source: 'online shelf observation'
  },
  {
    product: 'Pagen Lingongrova 500g',
    store: 'Coop Medborgarplatsen',
    quantity: '1 loaf',
    total: '33.90 SEK',
    movement: '-3.5%',
    source: 'retailer flyer observation'
  },
  {
    product: 'Felix Pyttipanna 720g',
    store: 'Willys Skanstull',
    quantity: '1 bag',
    total: '34.90 SEK',
    movement: '-5.1%',
    source: 'member promo observation'
  }
];

export const weeklyBasketSummary = {
  itemCount: weeklyBasketRows.length,
  plannedTotal: '160.40 SEK',
  strongestMove: 'Zoegas Coffee 450g',
  strongestMoveValue: '-8.4%'
};
