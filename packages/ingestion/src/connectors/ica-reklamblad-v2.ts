import { parsePromotionMechanic, type StructuredPromotion } from '@groceryview/core';
import {
  fetchIcaReklambladOffers,
  parseIcaReklambladOffers,
  type FetchIcaReklambladOffersOptions,
  type IcaReklambladOffer
} from './ica-reklamblad.js';

export type IcaReklambladPromotionRow = IcaReklambladOffer & {
  promotion: StructuredPromotion;
  promotionKind: StructuredPromotion['kind'];
  isMemberPrice: boolean;
};

export async function fetchIcaReklambladV2Offers(
  options: FetchIcaReklambladOffersOptions = {}
): Promise<IcaReklambladPromotionRow[]> {
  const offers = await fetchIcaReklambladOffers(options);
  return offers.map(promotionRouter);
}

export function parseIcaReklambladV2Offers(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): IcaReklambladPromotionRow[] {
  return parseIcaReklambladOffers(html, context).map(promotionRouter);
}

export function promotionRouter(offer: IcaReklambladOffer): IcaReklambladPromotionRow {
  const promotion = parsePromotionMechanic(offer.priceText);
  const memberFromCopy = /stammis|medlem|member/i.test(`${offer.priceText} ${offer.regularPriceText}`);

  return {
    ...offer,
    promotion,
    promotionKind: memberFromCopy ? 'member' : promotion.kind,
    isMemberPrice: memberFromCopy
  };
}
