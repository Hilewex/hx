export interface RankingCandidate {
  candidateId: string;
  productId: string;
  scoreFoundationOnly: number;
}

export interface RankingInput {
  surface: 'search' | 'category' | 'home' | 'discover' | 'pdp_related';
  inputCandidateSetSource: string;
  candidates: RankingCandidate[];
}

export interface RankingOutput {
  rankingFinal: boolean;
  recommendationTruthMutated: boolean;
  productTruthMutated: boolean;
  priceTruthMutated: boolean;
  stockTruthMutated: boolean;
  mediaTruthMutated: boolean;
  searchCandidateTruthMutated: boolean;
  businessTruthMutated: boolean;
  outputPublicSafe: boolean;
  rankedCandidates: RankingCandidate[];
}
