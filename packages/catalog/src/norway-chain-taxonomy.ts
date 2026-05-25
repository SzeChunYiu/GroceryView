export type NorwayOperatorGroupId =
  | 'norgesgruppen'
  | 'rema-1000-norge'
  | 'coop-norge'
  | 'bunnpris'
  | 'oda'
  | 'europris'
  | 'normal';

export type NorwayStoreFormat =
  | 'discount'
  | 'supermarket'
  | 'hypermarket'
  | 'convenience'
  | 'online'
  | 'variety';

export type NorwayStoreChannel = 'physical' | 'online' | 'omnichannel';

export type NorwayChainId =
  | 'kiwi'
  | 'rema-1000'
  | 'meny'
  | 'coop-extra'
  | 'coop-obs'
  | 'coop-mega'
  | 'coop-prix'
  | 'joker'
  | 'spar'
  | 'bunnpris'
  | 'oda'
  | 'europris'
  | 'normal-no';

export type NorwayCanonicalChain = {
  id: NorwayChainId;
  name: string;
  operatorGroupId: NorwayOperatorGroupId;
  operatorGroupName: string;
  retailerType: 'grocery' | 'variety' | 'online_marketplace';
  storeFormat: NorwayStoreFormat;
  channel: NorwayStoreChannel;
  aliases: readonly string[];
  reviewHint: string;
};

export type NorwayStoreOperatorAttachmentInput = {
  name?: string;
  brand?: string;
  operator?: string;
  municipality?: string;
  latitude?: number | null;
  longitude?: number | null;
  onlineOnly?: boolean;
};

export type NorwayStoreOperatorAttachment = {
  canonicalChainId: NorwayChainId | null;
  operatorGroupId: NorwayOperatorGroupId | null;
  storeFormat: NorwayStoreFormat | null;
  channel: NorwayStoreChannel | null;
  municipality: string;
  latitude: number | null;
  longitude: number | null;
  review: {
    status: 'clear' | 'needs_review';
    reasons: string[];
  };
};

export const NORWAY_CANONICAL_CHAINS: readonly NorwayCanonicalChain[] = [
  {
    id: 'kiwi',
    name: 'KIWI',
    operatorGroupId: 'norgesgruppen',
    operatorGroupName: 'NorgesGruppen',
    retailerType: 'grocery',
    storeFormat: 'discount',
    channel: 'physical',
    aliases: ['kiwi', 'kiwi minipris'],
    reviewHint: 'Attach OSM/store rows with KIWI brand or name to NorgesGruppen discount format.'
  },
  {
    id: 'rema-1000',
    name: 'REMA 1000',
    operatorGroupId: 'rema-1000-norge',
    operatorGroupName: 'REMA 1000 Norge',
    retailerType: 'grocery',
    storeFormat: 'discount',
    channel: 'physical',
    aliases: ['rema 1000', 'rema1000'],
    reviewHint: 'Attach rows with REMA 1000 brand/name to the REMA discount format.'
  },
  {
    id: 'meny',
    name: 'MENY',
    operatorGroupId: 'norgesgruppen',
    operatorGroupName: 'NorgesGruppen',
    retailerType: 'grocery',
    storeFormat: 'supermarket',
    channel: 'omnichannel',
    aliases: ['meny'],
    reviewHint: 'MENY rows are NorgesGruppen supermarket stores with online assortment overlap.'
  },
  {
    id: 'coop-extra',
    name: 'Coop Extra',
    operatorGroupId: 'coop-norge',
    operatorGroupName: 'Coop Norge',
    retailerType: 'grocery',
    storeFormat: 'discount',
    channel: 'physical',
    aliases: ['coop extra', 'extra'],
    reviewHint: 'Coop Extra is the Coop discount format; plain Coop rows need format review.'
  },
  {
    id: 'coop-obs',
    name: 'Coop Obs',
    operatorGroupId: 'coop-norge',
    operatorGroupName: 'Coop Norge',
    retailerType: 'grocery',
    storeFormat: 'hypermarket',
    channel: 'physical',
    aliases: ['coop obs', 'obs'],
    reviewHint: 'Coop Obs is the Coop hypermarket format; plain Coop rows need format review.'
  },
  {
    id: 'coop-mega',
    name: 'Coop Mega',
    operatorGroupId: 'coop-norge',
    operatorGroupName: 'Coop Norge',
    retailerType: 'grocery',
    storeFormat: 'supermarket',
    channel: 'physical',
    aliases: ['coop mega', 'mega'],
    reviewHint: 'Coop Mega is the Coop supermarket format; plain Coop rows need format review.'
  },
  {
    id: 'coop-prix',
    name: 'Coop Prix',
    operatorGroupId: 'coop-norge',
    operatorGroupName: 'Coop Norge',
    retailerType: 'grocery',
    storeFormat: 'convenience',
    channel: 'physical',
    aliases: ['coop prix', 'prix'],
    reviewHint: 'Coop Prix is the Coop convenience/local format; plain Coop rows need format review.'
  },
  {
    id: 'joker',
    name: 'Joker',
    operatorGroupId: 'norgesgruppen',
    operatorGroupName: 'NorgesGruppen',
    retailerType: 'grocery',
    storeFormat: 'convenience',
    channel: 'physical',
    aliases: ['joker'],
    reviewHint: 'Joker rows are NorgesGruppen local/convenience stores.'
  },
  {
    id: 'spar',
    name: 'Spar',
    operatorGroupId: 'norgesgruppen',
    operatorGroupName: 'NorgesGruppen',
    retailerType: 'grocery',
    storeFormat: 'supermarket',
    channel: 'physical',
    aliases: ['spar', 'eurospar'],
    reviewHint: 'Spar/Eurospar rows are NorgesGruppen supermarket stores.'
  },
  {
    id: 'bunnpris',
    name: 'Bunnpris',
    operatorGroupId: 'bunnpris',
    operatorGroupName: 'Bunnpris',
    retailerType: 'grocery',
    storeFormat: 'supermarket',
    channel: 'physical',
    aliases: ['bunnpris'],
    reviewHint: 'Bunnpris is its own grocery operator group.'
  },
  {
    id: 'oda',
    name: 'Oda',
    operatorGroupId: 'oda',
    operatorGroupName: 'Oda',
    retailerType: 'online_marketplace',
    storeFormat: 'online',
    channel: 'online',
    aliases: ['oda', 'oda.com'],
    reviewHint: 'Oda is online-only; do not attach physical store coordinates unless they are fulfilment sites.'
  },
  {
    id: 'europris',
    name: 'Europris',
    operatorGroupId: 'europris',
    operatorGroupName: 'Europris',
    retailerType: 'variety',
    storeFormat: 'variety',
    channel: 'omnichannel',
    aliases: ['europris'],
    reviewHint: 'Europris is in scope as a variety retailer with grocery overlap.'
  },
  {
    id: 'normal-no',
    name: 'Normal',
    operatorGroupId: 'normal',
    operatorGroupName: 'Normal',
    retailerType: 'variety',
    storeFormat: 'variety',
    channel: 'physical',
    aliases: ['normal'],
    reviewHint: 'Normal is in scope as a variety retailer with personal-care and grocery overlap.'
  }
];

const CHAIN_BY_ID = new Map<NorwayChainId, NorwayCanonicalChain>(
  NORWAY_CANONICAL_CHAINS.map((chain) => [chain.id, chain])
);

export function findNorwayCanonicalChain(chainId: string): NorwayCanonicalChain | undefined {
  return CHAIN_BY_ID.get(chainId as NorwayChainId);
}

export function matchNorwayCanonicalChain(values: readonly unknown[]): NorwayCanonicalChain | undefined {
  const haystack = normalizedSearchText(values);
  return NORWAY_CANONICAL_CHAINS.find((chain) =>
    chain.aliases.some((alias) => new RegExp(`\\b${escapeRegExp(normalizedSearchText([alias]))}\\b`).test(haystack))
  );
}

export function attachNorwayStoreOperator(
  input: NorwayStoreOperatorAttachmentInput
): NorwayStoreOperatorAttachment {
  const chain = input.onlineOnly ? findNorwayCanonicalChain('oda') : matchNorwayCanonicalChain([input.brand, input.name, input.operator]);
  const municipality = text(input.municipality);
  const latitude = finiteNumberOrNull(input.latitude);
  const longitude = finiteNumberOrNull(input.longitude);
  const reasons: string[] = [];

  if (!chain) reasons.push('canonical_chain_unmatched');
  if (!municipality) reasons.push('municipality_missing');
  if (chain?.operatorGroupId === 'coop-norge' && /\bcoop\b/i.test([input.brand, input.name, input.operator].map(text).join(' ')) && !/\b(extra|obs|mega|prix)\b/i.test([input.brand, input.name, input.operator].map(text).join(' '))) {
    reasons.push('coop_format_ambiguous');
  }
  if (chain?.channel !== 'online' && (latitude === null || longitude === null)) {
    reasons.push('physical_coordinates_missing');
  }

  return {
    canonicalChainId: chain?.id ?? null,
    operatorGroupId: chain?.operatorGroupId ?? null,
    storeFormat: chain?.storeFormat ?? null,
    channel: chain?.channel ?? null,
    municipality,
    latitude,
    longitude,
    review: {
      status: reasons.length === 0 ? 'clear' : 'needs_review',
      reasons
    }
  };
}

function normalizedSearchText(values: readonly unknown[]): string {
  return values
    .map(text)
    .join(' ')
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
