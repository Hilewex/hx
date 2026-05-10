export interface RecommendationCandidate {
  productId: string;
  recommendedReason: string;
}

export interface RecommendationInput {
  surface: 'home' | 'discover' | 'pdp_related';
  seedProductId?: string;
  publicSafeCandidates: RecommendationCandidate[];
}

export interface RecommendationOutput {
  rankingFinal: boolean;
  recommendationTruthMutated: boolean;
  productTruthMutated: boolean;
  priceTruthMutated: boolean;
  stockTruthMutated: boolean;
  mediaTruthMutated: boolean;
  searchCandidateTruthMutated: boolean;
  businessTruthMutated: boolean;
  outputPublicSafe: boolean;
  recommendations: RecommendationCandidate[];
}
