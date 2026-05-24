export type PressbyranSeChannel = 'store' | 'online' | 'delivery' | 'app' | 'b2b';
export type PressbyranSeFormat = 'pressbyran' | 'pbx' | 'pressbyran-work';

export type PressbyranSeRawRow = {
  id: string;
  name: string;
  price?: number | null;
  channel?: PressbyranSeChannel;
  format?: PressbyranSeFormat;
  sourceKind?: 'standard' | 'app-offer' | 'digital-coupon' | 'magazine-webshop' | 'delivery-campaign' | 'workplace';
  url?: string;
};

export type PressbyranSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'pressbyran';
  id: string;
  name: string;
  price: number | null;
  channel: PressbyranSeChannel;
  format: PressbyranSeFormat;
  is_member_price: boolean;
  is_coupon_price: boolean;
  source_url: string | null;
};

export const pressbyranSeConnector = {
  chain: 'pressbyran',
  country: 'SE',
  currency: 'SEK',
  source: 'https://www.pressbyran.se'
} as const;

function channelFor(row: PressbyranSeRawRow): PressbyranSeChannel {
  if (row.channel) return row.channel;
  if (row.sourceKind === 'magazine-webshop') return 'online';
  if (row.sourceKind === 'delivery-campaign') return 'delivery';
  if (row.sourceKind === 'app-offer' || row.sourceKind === 'digital-coupon') return 'app';
  if (row.sourceKind === 'workplace') return 'b2b';
  return 'store';
}

export function normalizePressbyranSeRow(row: PressbyranSeRawRow): PressbyranSeRow {
  const appOrCoupon = row.sourceKind === 'app-offer' || row.sourceKind === 'digital-coupon';

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'pressbyran',
    id: row.id,
    name: row.name,
    price: typeof row.price === 'number' && Number.isFinite(row.price) ? row.price : null,
    channel: channelFor(row),
    format: row.format ?? (row.sourceKind === 'workplace' ? 'pressbyran-work' : 'pressbyran'),
    is_member_price: row.sourceKind === 'app-offer',
    is_coupon_price: appOrCoupon,
    source_url: row.url ?? null
  };
}

export const pressbyranSeConnectorUnitCases = [
  {
    name: 'app offer marks member and coupon flags',
    input: { id: 'kompis-glass', name: '6:e glassen', sourceKind: 'app-offer' as const },
    expected: { channel: 'app', is_member_price: true, is_coupon_price: true }
  },
  {
    name: 'magazine webshop rows stay online channel without synthetic store pair',
    input: { id: 'magazine-webshop', name: 'Tidning', sourceKind: 'magazine-webshop' as const },
    expected: { channel: 'online', is_member_price: false, is_coupon_price: false }
  },
  {
    name: 'workplace fridge rows keep Pressbyran at work format',
    input: { id: 'work-fridge', name: 'Lunch', sourceKind: 'workplace' as const },
    expected: { channel: 'b2b', format: 'pressbyran-work' }
  }
];
