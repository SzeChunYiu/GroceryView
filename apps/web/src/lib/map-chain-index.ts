import { calculateChainPriceIndex } from '@groceryview/core';
import { buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from './chain-index-data';

export type MapChainIndexScore = {
  chainId: string;
  overallIndex: number;
  confidence: 'high' | 'medium' | 'low';
  observations: number;
};

export const mapChainIndexScores: MapChainIndexScore[] = calculateChainPriceIndex([
  ...buildChainPriceObservations(),
  ...buildMatchedBasketChainPriceObservations()
]).chains.map((chain) => ({
  chainId: chain.chainId,
  overallIndex: chain.overallIndex,
  confidence: chain.confidence,
  observations: chain.observations
}));

export const cheapestMapChain = mapChainIndexScores[0] ?? null;
