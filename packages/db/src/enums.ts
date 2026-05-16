export const priceTypes = ['regular', 'promotion', 'member', 'online', 'in_store', 'clearance', 'estimated'] as const;
export type PriceType = (typeof priceTypes)[number];

export const sourceTypes = ['retailer_page', 'retailer_api', 'flyer', 'receipt', 'shelf_photo', 'manual_admin', 'open_data', 'estimated'] as const;
export type SourceType = (typeof sourceTypes)[number];

export const confidenceBands = ['verified', 'high', 'medium', 'low', 'estimated'] as const;
export type ConfidenceBand = (typeof confidenceBands)[number];

export const alertStatuses = ['active', 'paused', 'triggered', 'expired', 'deleted'] as const;
export type AlertStatus = (typeof alertStatuses)[number];

export const observationStatuses = ['pending', 'accepted', 'rejected', 'superseded'] as const;
export type ObservationStatus = (typeof observationStatuses)[number];
